import { supabaseAdmin } from '../lib/supabase.js';

interface ActiveSession {
  userId: string;
  project: string;
  startTime: number;
  lastActivity: number;
  source: string;
  filesTouched: Set<string>;
}

const SESSION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const activeSessions = new Map<string, ActiveSession>();

export function heartbeat(userId: string, project: string, source: string, file?: string) {
  const key = `${userId}:${project}`;
  let session = activeSessions.get(key);
  const now = Date.now();

  if (session) {
    if (now - session.lastActivity < SESSION_WINDOW_MS) {
      session.lastActivity = now;
      if (file) session.filesTouched.add(file);
      return;
    } else {
      saveSession(session);
    }
  }

  session = {
    userId,
    project,
    startTime: now,
    lastActivity: now,
    source,
    filesTouched: new Set(file ? [file] : [])
  };
  activeSessions.set(key, session);
}

export function startStaleSessionCleaner() {
  setInterval(() => {
    const now = Date.now();
    for (const [key, session] of activeSessions.entries()) {
      if (now - session.lastActivity > SESSION_WINDOW_MS) {
        saveSession(session);
        activeSessions.delete(key);
      }
    }
  }, 60000);
}

async function saveSession(session: ActiveSession) {
  const durationMins = Math.max(1, Math.round((session.lastActivity - session.startTime) / 60000));
  const filesArray = Array.from(session.filesTouched);

  try {
    const { error } = await supabaseAdmin.from('time_sessions').insert({
      user_id: session.userId,
      project: session.project,
      start_time: new Date(session.startTime).toISOString(),
      end_time: new Date(session.lastActivity).toISOString(),
      duration_mins: durationMins,
      source: session.source,
      files_touched: filesArray
    });
    if (error) throw error;
    console.error(`[shipscribe] Saved time session: ${session.project} (${durationMins} mins)`);
  } catch (error) {
    console.error(`[shipscribe] Error saving time session:`, error);
  }
}

export async function getTimeToday(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('time_sessions')
      .select('project, duration_mins')
      .eq('user_id', userId)
      .gte('start_time', `${today}T00:00:00Z`);

    if (error) throw error;

    const summary: Record<string, { mins: number, sessions: number }> = {};
    let totalMins = 0;
    
    sessions.forEach(s => {
      if (!summary[s.project]) summary[s.project] = { mins: 0, sessions: 0 };
      summary[s.project].mins += s.duration_mins || 0;
      summary[s.project].sessions += 1;
      totalMins += s.duration_mins || 0;
    });

    const byProject = Object.entries(summary).map(([project, stats]) => ({
      project,
      hours: parseFloat((stats.mins / 60).toFixed(1)),
      sessions: stats.sessions
    }));

    // Most productive hour (requires a more complex query or multiple lookups)
    // For now, let's return a placeholder or do a quick lookup in activities
    const { data: activities } = await supabaseAdmin
      .from('activities')
      .select('timestamp')
      .eq('user_id', userId)
      .gte('timestamp', `${today}T00:00:00Z`);
    
    const hours = (activities || []).map(a => new Date(a.timestamp).getHours());
    const counts = hours.reduce((acc: any, h) => { acc[h] = (acc[h] || 0) + 1; return acc; }, {});
    let maxHour = 0;
    let maxCount = 0;
    Object.entries(counts).forEach(([h, c]) => {
      if ((c as number) > maxCount) {
        maxCount = c as number;
        maxHour = Number(h);
      }
    });

    const ampm = maxHour >= 12 ? 'PM' : 'AM';
    const displayH = maxHour % 12 || 12;
    const mostProductiveHour = maxCount > 0 ? `${displayH}-${(displayH % 12) + 1} ${ampm} (${maxCount} events)` : "No activity yet";

    return {
      total_hours: parseFloat((totalMins / 60).toFixed(1)),
      by_project: byProject,
      most_productive_hour: mostProductiveHour
    };
  } catch (error) {
    return { total_hours: 0, by_project: [], most_productive_hour: 'N/A' };
  }
}

export async function getTimeWeek(userId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('time_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', weekAgo.toISOString());

    if (error) throw error;

    return {
      total_hours: parseFloat((sessions.reduce((acc, s) => acc + (s.duration_mins || 0), 0) / 60).toFixed(1)),
      sessions_count: sessions.length
    };
  } catch (error) {
    return { total_hours: 0, sessions_count: 0 };
  }
}
