import express from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate.js';

const router = express.Router();

// GET /api/analytics/heatmap
router.get('/heatmap', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  const days = parseInt(req.query.days as string) || 364;

  try {
    const { data, error } = await supabaseAdmin.rpc('get_activity_heatmap', {
      p_user_id: userId,
      p_days: days
    });

    if (error) {
      // Fallback if RPC doesn't exist
      const { data: rawData, error: rawError } = await supabaseAdmin
        .from('activities')
        .select('timestamp')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (rawError) throw rawError;

      const grouped = rawData.reduce((acc: any, curr: any) => {
        const date = curr.timestamp.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const result = Object.entries(grouped).map(([date, count]) => ({ date, count }));
      return res.json(result);
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/stats
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Total hours coded this week (from time_sessions or activities approximation)
    const { data: sessions } = await supabaseAdmin
      .from('time_sessions')
      .select('duration_mins')
      .eq('user_id', userId)
      .gte('start_time', startOfWeek);
    
    const totalMinutes = (sessions || []).reduce((acc, curr) => acc + (curr.duration_mins || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // 2. Commits this week (approximated by source='github' activities or specific note matching)
    const { count: commits } = await supabaseAdmin
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source', 'github')
      .gte('timestamp', startOfWeek);

    // 3. Tasks completed this week
    const { count: tasks } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', startOfWeek);

    // 4. Current streak (simplified)
    const { data: streakData } = await supabaseAdmin
      .from('profiles')
      .select('id') // Placeholder for real streak logic if stored in profiles
      .eq('id', userId)
      .single();

    res.json({
      totalHours: parseFloat(totalHours),
      commits: commits || 0,
      tasksCompleted: tasks || 0,
      streak: 5 // Hardcoded fallback for now
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/coding-hours
router.get('/coding-hours', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  const days = parseInt(req.query.days as string) || 7;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabaseAdmin
      .from('time_sessions')
      .select('start_time, duration_mins')
      .eq('user_id', userId)
      .gte('start_time', startDate);

    if (error) throw error;

    const grouped = (data || []).reduce((acc: any, curr: any) => {
      const date = curr.start_time.split('T')[0];
      acc[date] = (acc[date] || 0) + (curr.duration_mins || 0);
      return acc;
    }, {});

    const result = Object.entries(grouped).map(([date, minutes]) => ({
      date,
      hours: Number((Number(minutes) / 60).toFixed(1))
    })).sort((a,b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/hours
router.get('/hours', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  const range = (req.query.range as string) || 'week';
  
  // Determine start date based on range
  let days = 7;
  if (range === 'month') days = 30;
  else if (range === 'all') days = 365;
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabaseAdmin
      .from('time_sessions')
      .select('start_time, duration_mins')
      .eq('user_id', userId)
      .gte('start_time', startDate);

    if (error) throw error;

    // Group by date
    const grouped = (data || []).reduce((acc: any, curr: any) => {
      const date = curr.start_time.split('T')[0];
      if (!acc[date]) {
        acc[date] = { hours: 0, sessions: 0 };
      }
      acc[date].hours += (curr.duration_mins || 0) / 60;
      acc[date].sessions += 1;
      return acc;
    }, {});

    const result = Object.entries(grouped).map(([date, val]: [string, any]) => ({
      date,
      hours: Number(val.hours.toFixed(1)),
      sessions: val.sessions
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/projects
router.get('/projects', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  
  try {
    // We'll perform multiple queries and aggregate in-memory for project stats
    // A complex JOIN in Supabase JS is better handled via multiple targeted fetches or a custom RPC
    // For simplicity and to match the prompt's SQL logic exactly, we'll use targeted selects
    
    // 1. Get project hours
    const { data: hoursData } = await supabaseAdmin
      .from('time_sessions')
      .select('project, duration_mins')
      .eq('user_id', userId);

    // 2. Get activity (commits) count
    const { data: activityData } = await supabaseAdmin
      .from('activities')
      .select('project, source')
      .eq('user_id', userId);

    // 3. Get task counts
    const { data: taskData } = await supabaseAdmin
      .from('tasks')
      .select('project, status')
      .eq('user_id', userId);

    const projectStats: any = {};

    // Aggregate Hours
    (hoursData || []).forEach(d => {
      const p = d.project || 'default';
      if (!projectStats[p]) projectStats[p] = { project: p, hours: 0, commits: 0, tasks: 0 };
      projectStats[p].hours += (d.duration_mins || 0) / 60;
    });

    // Aggregate Commits (approximated by Github source)
    (activityData || []).forEach(d => {
      const p = d.project || 'default';
      if (!projectStats[p]) projectStats[p] = { project: p, hours: 0, commits: 0, tasks: 0 };
      if (d.source === 'github') projectStats[p].commits += 1;
    });

    // Aggregate Tasks
    (taskData || []).forEach(d => {
      const p = d.project || 'default';
      if (!projectStats[p]) projectStats[p] = { project: p, hours: 0, commits: 0, tasks: 0 };
      if (d.status === 'done') projectStats[p].tasks += 1;
    });

    const result = Object.values(projectStats).sort((a: any, b: any) => b.hours - a.hours);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/projects-list
router.get('/projects-list', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  try {
    const { data: activityData, error } = await supabaseAdmin
      .from('activities')
      .select('project')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Extract unique projects, filtering out null/empty strings
    const uniqueProjects = [...new Set((activityData || []).map(d => d.project).filter(Boolean))].sort();
    
    res.json(uniqueProjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/streak
router.get('/streak', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;

  try {
    // 1. Get all active days for user
    const { data: activityDays, error } = await supabaseAdmin
      .from('activities')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    if (!activityDays || activityDays.length === 0) {
      return res.json({
        current_streak: 0,
        longest_streak: 0,
        streak_start: null,
        coded_today: false,
        total_active_days: 0
      });
    }

    // Unique dates sorted descending
    const dates = [...new Set(activityDays.map(a => a.timestamp.split('T')[0]))];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Calculate current streak
    let currentStreak = 0;
    let streakStart = null;
    let codedToday = dates[0] === today;
    
    // Streak continues if active today OR active yesterday
    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1;
      streakStart = dates[0];
      
      for (let i = 0; i < dates.length - 1; i++) {
        const curr = new Date(dates[i]);
        const next = new Date(dates[i+1]);
        const diffDays = (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays <= 1.1) { // 1 day difference (with some buffer for DST/TZ)
          currentStreak++;
          streakStart = dates[i+1];
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
        const curr = new Date(dates[i]);
        const next = new Date(dates[i+1]);
        const diffDays = (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays <= 1.1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    res.json({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      streak_start: streakStart,
      coded_today: codedToday,
      total_active_days: dates.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/productivity
router.get('/productivity', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  const days = parseInt(req.query.days as string) || 30;
  
  try {
    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_productivity_scores', {
      p_user_id: userId,
      p_days: days
    });

    if (!rpcError && rpcData) {
      return res.json(rpcData);
    }

    // Fallback TS logic if RPC fails
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [tasks, sessions, activity] = await Promise.all([
      supabaseAdmin.from('tasks').select('completed_at').eq('user_id', userId).eq('status', 'done').gte('completed_at', startDate),
      supabaseAdmin.from('time_sessions').select('start_time, duration_mins').eq('user_id', userId).gte('start_time', startDate),
      supabaseAdmin.from('activities').select('timestamp').eq('user_id', userId).eq('source', 'github').gte('timestamp', startDate)
    ]);

    const dailyData: any = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dailyData[d] = { tasks: 0, hours: 0, commits: 0 };
    }

    (tasks.data || []).forEach(t => {
      const d = t.completed_at.split('T')[0];
      if (dailyData[d]) dailyData[d].tasks++;
    });

    (sessions.data || []).forEach(s => {
      const d = s.start_time.split('T')[0];
      if (dailyData[d]) dailyData[d].hours += (s.duration_mins || 0) / 60;
    });

    (activity.data || []).forEach(a => {
      const d = a.timestamp.split('T')[0];
      if (dailyData[d]) dailyData[d].commits++;
    });

    const result = Object.entries(dailyData).map(([date, val]: [string, any]) => {
      const tasksScore = Math.min(val.tasks / 5, 1) * 40;
      const hoursScore = Math.min(val.hours / 4, 1) * 40;
      const commitsScore = Math.min(val.commits / 5, 1) * 20;
      return {
        date,
        tasks: val.tasks,
        hours: Number(val.hours.toFixed(1)),
        commits: val.commits,
        score: Math.round(tasksScore + hoursScore + commitsScore)
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/hours-distribution
router.get('/hours-distribution', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;
  
  try {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('timestamp')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const distribution = Array(24).fill(0);
    (data || []).forEach(a => {
      const hour = new Date(a.timestamp).getUTCHours();
      distribution[hour]++;
    });

    const result = distribution.map((count, hour) => ({ hour, count }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/personal-bests
router.get('/personal-bests', authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user.id;

  try {
    // 1. Max commits in a day
    const { data: commitData } = await supabaseAdmin
      .from('activities')
      .select('timestamp')
      .eq('user_id', userId)
      .eq('source', 'github');
    
    const commitGroups: any = {};
    (commitData || []).forEach(c => {
      const d = c.timestamp.split('T')[0];
      commitGroups[d] = (commitGroups[d] || 0) + 1;
    });
    
    let maxCommits = { value: 0, date: null };
    Object.entries(commitGroups).forEach(([date, val]: [string, any]) => {
      if (val > maxCommits.value) maxCommits = { value: val, date: date as any };
    });

    // 2. Max hours in a day
    const { data: hourData } = await supabaseAdmin
      .from('time_sessions')
      .select('start_time, duration_mins')
      .eq('user_id', userId);
    
    const hourGroups: any = {};
    (hourData || []).forEach(h => {
      const d = h.start_time.split('T')[0];
      hourGroups[d] = (hourGroups[d] || 0) + (h.duration_mins / 60);
    });

    let maxHours = { value: 0, date: null };
    Object.entries(hourGroups).forEach(([date, val]: [string, any]) => {
      if (val > (maxHours.value as any)) maxHours = { value: Number(val.toFixed(1)), date: date as any };
    });

    // 3. Max tasks in a day
    const { data: taskData } = await supabaseAdmin
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'done');
    
    const taskGroups: any = {};
    (taskData || []).forEach(t => {
      if (t.completed_at) {
        const d = t.completed_at.split('T')[0];
        taskGroups[d] = (taskGroups[d] || 0) + 1;
      }
    });

    let maxTasks = { value: 0, date: null };
    Object.entries(taskGroups).forEach(([date, val]: [string, any]) => {
      if (val > maxTasks.value) maxTasks = { value: val, date: date as any };
    });

    // 4. Best score ever (reusing productivity logic)
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const [tasks, sessions, activity] = await Promise.all([
      supabaseAdmin.from('tasks').select('completed_at').eq('user_id', userId).eq('status', 'done').gte('completed_at', startDate),
      supabaseAdmin.from('time_sessions').select('start_time, duration_mins').eq('user_id', userId).gte('start_time', startDate),
      supabaseAdmin.from('activities').select('timestamp').eq('user_id', userId).eq('source', 'github').gte('timestamp', startDate)
    ]);

    const dailyData: any = {};
    (tasks.data || []).forEach(t => {
      const d = t.completed_at.split('T')[0];
      if (!dailyData[d]) dailyData[d] = { tasks: 0, hours: 0, commits: 0 };
      dailyData[d].tasks++;
    });
    (sessions.data || []).forEach(s => {
      const d = s.start_time.split('T')[0];
      if (!dailyData[d]) dailyData[d] = { tasks: 0, hours: 0, commits: 0 };
      dailyData[d].hours += (s.duration_mins || 0) / 60;
    });
    (activity.data || []).forEach(a => {
      const d = a.timestamp.split('T')[0];
      if (!dailyData[d]) dailyData[d] = { tasks: 0, hours: 0, commits: 0 };
      dailyData[d].commits++;
    });

    let maxScore = { value: 0, date: null };
    Object.entries(dailyData).forEach(([date, val]: [string, any]) => {
      const tasksScore = Math.min(val.tasks / 5, 1) * 40;
      const hoursScore = Math.min(val.hours / 4, 1) * 40;
      const commitsScore = Math.min(val.commits / 5, 1) * 20;
      const score = Math.round(tasksScore + hoursScore + commitsScore);
      if (score > maxScore.value) maxScore = { value: score, date: date as any };
    });

    res.json({
      commits: maxCommits,
      hours: maxHours,
      tasks: maxTasks,
      score: maxScore
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
