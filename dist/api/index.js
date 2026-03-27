import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../lib/supabase.js';
import { getTimeToday } from '../lib/timeTracker.js';
import { authenticate } from '../middleware/authenticate.js';
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
}));
app.use(express.json());
// --- Routes ---
app.get('/api/auth/me', authenticate, (req, res) => {
    res.json(req.user);
});
app.use('/api/auth', connectionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/chat', chatRouter);
// --- Activities ---
app.get('/api/activities', authenticate, async (req, res) => {
    const { dateFrom, dateTo, editors, projects, sources, search, limit = 100 } = req.query;
    const userId = req.user.id;
    try {
        let query = supabaseAdmin
            .from('activities')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
        if (dateFrom)
            query = query.gte('timestamp', `${dateFrom}T00:00:00Z`);
        if (dateTo)
            query = query.lte('timestamp', `${dateTo}T23:59:59Z`);
        if (editors && typeof editors === 'string') {
            const editorList = editors.split(',').filter(Boolean);
            if (editorList.length > 0)
                query = query.in('editor', editorList);
        }
        if (projects && typeof projects === 'string') {
            const projectList = projects.split(',').filter(Boolean);
            if (projectList.length > 0)
                query = query.in('project', projectList);
        }
        if (sources && typeof sources === 'string') {
            const sourceList = sources.split(',').filter(Boolean);
            if (sourceList.length > 0)
                query = query.in('source', sourceList);
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/activities/export', authenticate, async (req, res) => {
    const { dateFrom, dateTo, editors, projects, sources, search, format = 'csv' } = req.query;
    const userId = req.user.id;
    try {
        let query = supabaseAdmin
            .from('activities')
            .select('timestamp, note, editor, source, project')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });
        // ... filtering logic ...
        if (dateFrom)
            query = query.gte('timestamp', `${dateFrom}T00:00:00Z`);
        if (dateTo)
            query = query.lte('timestamp', `${dateTo}T23:59:59Z`);
        if (editors && typeof editors === 'string') {
            const editorList = editors.split(',').filter(Boolean);
            if (editorList.length > 0)
                query = query.in('editor', editorList);
        }
        if (projects && typeof projects === 'string') {
            const projectList = projects.split(',').filter(Boolean);
            if (projectList.length > 0)
                query = query.in('project', projectList);
        }
        if (sources && typeof sources === 'string') {
            const sourceList = sources.split(',').filter(Boolean);
            if (sourceList.length > 0)
                query = query.in('source', sourceList);
        }
        if (search && typeof search === 'string') {
            query = query.ilike('note', `%${search}%`);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        const filename = `shipscribe_activity_${new Date().toISOString().split('T')[0]}_${userId.slice(0, 5)}`;
        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
            return res.status(200).send(JSON.stringify(data, null, 2));
        }
        // Default to CSV
        const headers = ['Timestamp', 'Activity', 'Editor', 'Source', 'Project'];
        const rows = (data || []).map(r => [
            r.timestamp,
            `"${(r.note || '').replace(/"/g, '""')}"`,
            r.editor || 'unknown',
            r.source || 'unknown',
            r.project || 'default'
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
        res.status(200).send(csvContent);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/activities/today', authenticate, async (req, res) => {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    try {
        const { data: activities, error: actError } = await supabaseAdmin
            .from('activities')
            .select('*')
            .eq('user_id', userId)
            .gte('timestamp', `${today}T00:00:00Z`)
            .order('timestamp', { ascending: false });
        if (actError)
            throw actError;
        // PostgREST grouping equivalent
        const { data: counts, error: countError } = await supabaseAdmin
            .from('activities')
            .select('source')
            .eq('user_id', userId)
            .gte('timestamp', `${today}T00:00:00Z`);
        if (countError)
            throw countError;
        const grouped = (counts || []).reduce((acc, curr) => {
            acc[curr.source] = (acc[curr.source] || 0) + 1;
            return acc;
        }, {});
        const countsBySource = Object.entries(grouped).map(([source, count]) => ({ source, count }));
        res.json({ activities: activities || [], countsBySource });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/activity/live', authenticate, async (req, res) => {
    const userId = req.user.id;
    try {
        const { data: activities } = await supabaseAdmin
            .from('activities')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(20);
        const { data: currentSession } = await supabaseAdmin
            .from('session_state') // Assuming updated table name
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- Tasks ---
app.get('/api/tasks', authenticate, async (req, res) => {
    const { status, project } = req.query;
    const userId = req.user.id;
    try {
        let query = supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', userId);
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (project) {
            query = query.eq('project', project);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/tasks', authenticate, async (req, res) => {
    const { title, project = 'default', priority = 'medium', status = 'todo', due_date } = req.body;
    const userId = req.user.id;
    try {
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
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/tasks/:id/status', authenticate, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    try {
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
        if (error)
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/tasks/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, project, priority, status, completed_at } = req.body;
    try {
        const updates = {};
        if (title !== undefined)
            updates.title = title;
        if (project !== undefined)
            updates.project = project;
        if (priority !== undefined)
            updates.priority = priority;
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
        if (error)
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/tasks/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const { error } = await supabaseAdmin
            .from('tasks')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error)
            return res.status(404).json({ error: 'Task not found or unauthorized' });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- Summaries ---
app.use('/api/summaries', summariesRouter);
app.use('/api/posts', postsRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/waitlist', waitlistRouter);
app.use('/api/admin', adminRouter);
// --- Stats ---
app.get('/api/stats', authenticate, async (req, res) => {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    try {
        const { count: actCount } = await supabaseAdmin
            .from('activities')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('timestamp', `${today}T00:00:00Z`);
        const { count: doneCount } = await supabaseAdmin
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'done')
            .gte('completed_at', `${today}T00:00:00Z`);
        const { count: todoCount } = await supabaseAdmin
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'todo');
        res.json({
            today_activities: actCount || 0,
            tasks_completed_today: doneCount || 0,
            current_streak: 5, // Hardcoded for now
            total_tasks_todo: todoCount || 0
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(config.port, () => { console.log(`Shipscribe REST API running at http://localhost:${config.port}`); });
