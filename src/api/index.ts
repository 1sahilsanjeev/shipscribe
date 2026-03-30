import dotenv from 'dotenv';
import path from 'path';

// Load .env dynamically for local development without import.meta.url which breaks Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

console.log('[startup] Environment check:');
console.log('[startup] SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ set' : '✗ MISSING');
console.log('[startup] SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✓ set' : '✗ MISSING');
console.log('[startup] SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓ set' : '✗ MISSING');
console.log('[startup] ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ MISSING');
console.log('[startup] JWT_SECRET:', process.env.JWT_SECRET ? '✓ set' : '✗ MISSING');
console.log('[startup] NODE_ENV:', process.env.NODE_ENV);
console.log('[startup] PORT:', process.env.PORT);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { supabaseAdmin, supabase } from '../lib/supabase.js';
import { generateSummary, generatePostVariants } from '../lib/anthropic.js';
import { syncGitHub } from '../tools/github.js';
import { syncClaudeCode } from '../tools/claudecode.js';
import { getTimeToday } from '../lib/timeTracker.js';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js';
import { getGithubPollerStatus } from '../watchers/githubPoller.js';
import { config } from '../config.js';
import connectionsRouter from './connections.js';
import analyticsRouter from './analytics.js';
import summariesRouter from './summaries.js';
import postsRouter from './posts.js';
import chatRouter from './chat.js';
import voiceRouter from './voice.js';
import projectsRouter from './projects.js';
import waitlistRouter from './waitlist.js';
import adminRouter from './admin.js';
import mcpRouter from './mcpRouter.js';

const app = express();

// --- Production Middleware ---
app.use(helmet());
app.use(compression());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', generalLimiter);
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'https://app.shipscribe.dev'
  ],
  credentials: true
}))
app.use(express.json());

app.use((req: any, res: any, next: any) => {
  const originalJson = res.json.bind(res);
  res.json = (data: any) => {
    return originalJson(data);
  };
  next();
});

// --- Routes ---

app.get('/api/health', (req, res) => {
  const diagnostics = {
    supabase_url: process.env.SUPABASE_URL ? 'PRESENT' : (process.env.VITE_SUPABASE_URL ? 'PRESENT (VITE_ FALLBACK)' : 'MISSING'),
    supabase_service_key: process.env.SUPABASE_SERVICE_KEY ? 'PRESENT' : 'MISSING',
    supabase_anon_key: process.env.SUPABASE_ANON_KEY ? 'PRESENT' : (process.env.VITE_SUPABASE_ANON_KEY ? 'PRESENT (VITE_ FALLBACK)' : 'MISSING'),
    anthropic_key: process.env.ANTHROPIC_API_KEY ? 'PRESENT' : 'MISSING',
    jwt_secret: process.env.JWT_SECRET ? 'PRESENT' : 'MISSING'
  };

  const isHealthy = diagnostics.supabase_url !== 'MISSING' && diagnostics.supabase_service_key !== 'MISSING';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    source: 'express_app',
    env_diagnostics: diagnostics
  });
});

app.get('/api/debug/env', (req, res) => {
  // Simple check to prevent public exposure in real production, but helpful for debugging now
  const apiKey = req.headers['x-api-key'];
  if (process.env.NODE_ENV === 'production' && apiKey !== process.env.SHIPSCRIBE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({
    node_env: process.env.NODE_ENV,
    vercel: process.env.VERCEL || 'not set',
    port: process.env.PORT,
    keys_found: Object.keys(process.env).filter(k => 
      k.includes('SUPABASE') || k.includes('API') || k.includes('KEY') || k.includes('URL')
    ).map(k => ({ [k]: process.env[k] ? 'EXISTS' : 'EMPTY' }))
  });
});


import { handle } from '../lib/routeHandler.js';

app.get('/api/auth/me', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  res.json(req.user);
}));

app.get('/api/auth/validate-key', handle(async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(400).json({ error: 'Missing or invalid API key header' });
    return;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('[API] Validate-key failed: Supabase admin client not initialized');
    const location = process.env.VERCEL ? 'Vercel Dashboard' : 'local .env file';
    res.status(503).json({ 
      error: `Authentication service unavailable. Missing Supabase configuration in ${location}.`,
      suggestion: 'Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set correctly.'
    });
    return;
  }


  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('api_key', apiKey)
    .maybeSingle(); 

  if (error) {
    console.error('[API] Database error during validation:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Database error', details: error.message });
    return;
  }

  if (!profile) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  res.json(profile);
}));

app.use('/api/auth', connectionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/mcp', authenticate, mcpRouter);

// --- Activities ---

app.get('/api/activities', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  const { dateFrom, dateTo, editors, projects, sources, search, limit = 100 } = req.query;
  const userId = req.user.id;
  
  let query = supabaseAdmin
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  
  if (dateFrom) query = query.gte('timestamp', `${dateFrom}T00:00:00Z`);
  if (dateTo) query = query.lte('timestamp', `${dateTo}T23:59:59Z`);
  
  if (editors && typeof editors === 'string') {
    const editorList = editors.split(',').filter(Boolean);
    if (editorList.length > 0) query = query.in('editor', editorList);
  }
  
  if (projects && typeof projects === 'string') {
    const projectList = projects.split(',').filter(Boolean);
    if (projectList.length > 0) query = query.in('project', projectList);
  }
  
  if (sources && typeof sources === 'string') {
    const sourceList = sources.split(',').filter(Boolean);
    if (sourceList.length > 0) query = query.in('source', sourceList);
  }
  
  if (search && typeof search === 'string') {
    query = query.ilike('note', `%${search}%`);
  }
  
  const { data, error } = await query.limit(Number(limit));
  if (error) {
    console.error('[API] Activities error:', error);
    throw error;
  }
  res.json(data);
}));

app.get('/api/activities/export', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  const { dateFrom, dateTo, editors, projects, sources, search, format = 'csv' } = req.query;
  const userId = req.user.id;
  
  let query = supabaseAdmin
    .from('activities')
    .select('timestamp, note, editor, source, project')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  
  if (dateFrom) query = query.gte('timestamp', `${dateFrom}T00:00:00Z`);
  if (dateTo) query = query.lte('timestamp', `${dateTo}T23:59:59Z`);
  
  if (editors && typeof editors === 'string') {
    const editorList = editors.split(',').filter(Boolean);
    if (editorList.length > 0) query = query.in('editor', editorList);
  }
  
  if (projects && typeof projects === 'string') {
    const projectList = projects.split(',').filter(Boolean);
    if (projectList.length > 0) query = query.in('project', projectList);
  }
  
  if (sources && typeof sources === 'string') {
    const sourceList = sources.split(',').filter(Boolean);
    if (sourceList.length > 0) query = query.in('source', sourceList);
  }
  
  if (search && typeof search === 'string') {
    query = query.ilike('note', `%${search}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;

  const filename = `shipscribe_activity_${new Date().toISOString().split('T')[0]}_${userId.slice(0, 5)}`;

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
    res.status(200).send(JSON.stringify(data, null, 2));
    return;
  }

  const headers = ['Timestamp', 'Activity', 'Editor', 'Source', 'Project'];
  const rows = (data || []).map((r: any) => [
    r.timestamp,
    `"${(r.note || '').replace(/"/g, '""')}"`,
    r.editor || 'unknown',
    r.source || 'unknown',
    r.project || 'default'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row: any) => row.join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
  res.status(200).send(csvContent);
}));

app.get('/api/activities/today', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  
  const { data: activities, error: actError } = await supabaseAdmin
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', `${today}T00:00:00Z`)
    .order('timestamp', { ascending: false });

  if (actError) throw actError;

  const { data: counts, error: countError } = await supabaseAdmin
    .from('activities')
    .select('source')
    .eq('user_id', userId)
    .gte('timestamp', `${today}T00:00:00Z`);
  
  if (countError) throw countError;
  
  const grouped = (counts || []).reduce((acc: any, curr: any) => {
    acc[curr.source] = (acc[curr.source] || 0) + 1;
    return acc;
  }, {});
  
  const countsBySource = Object.entries(grouped).map(([source, count]) => ({ source, count }));

  res.json({ activities: activities || [], countsBySource });
}));

app.get('/api/activity/live', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  const { data: activities } = await supabaseAdmin
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(20);
  
  const { data: currentSession } = await supabaseAdmin
    .from('session_state')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('last_activity', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const timeToday = await getTimeToday(userId);
  
  res.json({
    activities: activities || [],
    current_session: currentSession,
    time_today: timeToday,
    github_poller: { status: 'active', last_check: getGithubPollerStatus() }
  });
}));

// --- Tasks ---

app.get('/api/tasks', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  const { status, project } = req.query;
  const userId = req.user.id;
  let query = supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('user_id', userId);
  
  if (status && status !== 'all') {
    query = query.eq('status', status as string);
  }
  if (project) {
    query = query.eq('project', project as string);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

app.post('/api/tasks', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  const { title, project = 'default', priority = 'medium', status = 'todo', due_date } = req.body;
  const userId = req.user.id;
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert({
      user_id: userId,
      title,
      project,
      priority,
      status,
      due_date: due_date || null
    })
    .select()
    .single();
  
  if (error) throw error;
  res.json(data);
}));

app.patch('/api/tasks/:id/status', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update({ 
      status, 
      completed_at: status === 'done' ? new Date().toISOString() : null 
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) {
    res.status(404).json({ error: 'Task not found or unauthorized' });
    return;
  }
  res.json(data);
}));

app.patch('/api/tasks/:id', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, project, priority, status, completed_at } = req.body;
  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (project !== undefined) updates.project = project;
  if (priority !== undefined) updates.priority = priority;
  if (status !== undefined) {
    updates.status = status;
    updates.completed_at = status === 'done' ? new Date().toISOString() : (completed_at !== undefined ? completed_at : null);
  }
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) {
    res.status(404).json({ error: 'Task not found or unauthorized' });
    return;
  }
  res.json(data);
}));

app.delete('/api/tasks/:id', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { error } = await supabaseAdmin
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) {
    res.status(404).json({ error: 'Task not found or unauthorized' });
    return;
  }
  res.json({ success: true });
}));

// --- Summaries ---

app.use('/api/summaries', summariesRouter);
app.use('/api/posts', postsRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/admin', adminRouter);

// --- Stats ---

app.get('/api/stats', authenticate, handle(async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    const [activities, tasks, streak] = await Promise.allSettled([
      supabaseAdmin
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('timestamp', `${today}T00:00:00`),
      supabaseAdmin
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'done')
        .gte('completed_at', `${today}T00:00:00`),
      supabaseAdmin
        .from('activities')
        .select('timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100)
    ]);

    res.json({
      today_activities: activities.status === 'fulfilled' 
        ? (activities.value.count || 0) : 0,
      tasks_completed_today: tasks.status === 'fulfilled'
        ? (tasks.value.count || 0) : 0,
      current_streak: 5,
      total_tasks_todo: 0
    });
  } catch (err: any) {
    // Never return 500 for stats — return zeros
    console.error('[stats] Error:', err.message);
    res.json({
      today_activities: 0,
      tasks_completed_today: 0,
      current_streak: 0,
      total_tasks_todo: 0
    });
  }
}));

// Removed global uncaught exception handlers as they break AWS Lambda / Vercel Serverless functions

app.use((err: any, req: any, res: any, next: any) => {
  console.error('[error] Unhandled error:', err.message);
  console.error('[error] Stack:', err.stack);
  console.error('[error] Route:', req.method, req.path);
  res.status(500).json({ 
    error: err.message,
    route: req.path
  });
});

// --- Start the server locally ---
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const server = app.listen(Number(config.port), '0.0.0.0', () => {
    console.log(`[startup] Shipscribe REST API running at http://localhost:${config.port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[API] ❌ Port ${config.port} is already in use. Is another instance running?`);
    } else {
      console.error(`[API] ❌ Server error: ${err.message}`);
    }
  });
}

// Export for Vercel Serverless environment
export default (req: any, res: any) => {
  return app(req, res);
};
