import fs from 'fs';
import path from 'path';
import os from 'os';
import { supabaseAdmin } from '../lib/supabase.js';
import { heartbeat } from '../lib/timeTracker.js';

// Hardcoded editor detection
const EDITOR_NAME = (() => {
  if (process.env.ANTIGRAVITY_AGENT === '1') return 'antigravity'
  if (process.env.CURSOR_TRACE_ID) return 'cursor'
  if (process.env.CLAUDE_CODE_ENTRYPOINT) return 'claude_code'
  return process.env.SHIPSCRIBE_EDITOR || 'unknown'
})()


interface ClaudeSessionInfo {
  sessionId: string;
  filePath: string;
  lastSize: number;
  lastActivity: number;
  filesTouched: Set<string>;
  toolCalls: number;
  startTime: number;
}

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const activeSessions = new Map<string, ClaudeSessionInfo>();

export function startClaudeCodeWatcher(userId: string) {
  const logsDir = path.join(os.homedir(), '.claude', 'logs');

  if (!fs.existsSync(logsDir)) {
    console.error(`[shipscribe] Claude Code logs directory not found at ${logsDir}. Monitoring skipped.`);
    return;
  }

  console.error(`[shipscribe] Claude Code watcher started — monitoring ${logsDir}`);

  // Watch for new files
  fs.watch(logsDir, (eventType, filename) => {
    if (filename?.endsWith('.jsonl') && eventType === 'rename') {
      const filePath = path.join(logsDir, filename);
      if (fs.existsSync(filePath)) {
        startTailing(userId, filePath);
      }
    }
  });

  // Check for existing files modified in last 24h
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.jsonl'));
  
  for (const file of files) {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);
    if (stats.mtimeMs > twentyFourHoursAgo) {
      startTailing(userId, filePath);
    }
  }

  // Periodic inactivity check
  setInterval(() => {
    const now = Date.now();
    for (const [sessionId, info] of activeSessions.entries()) {
      if (now - info.lastActivity > INACTIVITY_TIMEOUT_MS) {
        completeSession(userId, sessionId);
      }
    }
  }, 60000); // Check every minute
}

function startTailing(userId: string, filePath: string) {
  const sessionId = path.basename(filePath, '.jsonl');
  if (activeSessions.has(sessionId)) return;

  const stats = fs.statSync(filePath);
  const info: ClaudeSessionInfo = {
    sessionId,
    filePath,
    lastSize: stats.size,
    lastActivity: Date.now(),
    filesTouched: new Set(),
    toolCalls: 0,
    startTime: Date.now()
  };

  activeSessions.set(sessionId, info);

  fs.watchFile(filePath, { interval: 5000 }, (curr, prev) => {
    if (curr.size > prev.size) {
      processNewContent(userId, sessionId);
    }
  });

  processNewContent(userId, sessionId, true);
}

async function processNewContent(userId: string, sessionId: string, isInitial = false) {
  const info = activeSessions.get(sessionId);
  if (!info) return;

  try {
    const fd = fs.openSync(info.filePath, 'r');
    const start = isInitial ? 0 : info.lastSize;
    const end = fs.fstatSync(fd).size;
    
    if (end <= start) {
      fs.closeSync(fd);
      return;
    }

    const buffer = Buffer.alloc(end - start);
    fs.readSync(fd, buffer, 0, end - start, start);
    fs.closeSync(fd);

    const content = buffer.toString('utf-8');
    const lines = content.split('\n');

    let updated = false;

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        info.lastActivity = new Date(entry.timestamp).getTime();
        
        if (entry.type === 'tool_use' || entry.type === 'call') {
          info.toolCalls++;
          updated = true;
        }

        const possiblePath = entry.data?.filePath || entry.data?.path || entry.params?.path;
        if (possiblePath && typeof possiblePath === 'string') {
          const normalizedPath = possiblePath.replace(/\\/g, '/');
          if (!info.filesTouched.has(normalizedPath)) {
            info.filesTouched.add(normalizedPath);
            updated = true;
          }
        }
      } catch (e) { }
    }

    info.lastSize = end;

    if (updated || isInitial) {
      await updateSessionState(userId, info);
    }
  } catch (error) {
    console.error(`Error processing Claude log ${sessionId}:`, error);
  }
}

async function updateSessionState(userId: string, info: ClaudeSessionInfo) {
  const filesArray = Array.from(info.filesTouched);
  let project = 'default';
  if (filesArray.length > 0) {
    const parts = filesArray[0].split('/');
    project = parts.find(p => p !== '' && p !== '.' && p !== '..') || 'default';
  }

  heartbeat(userId, project, 'claude_code', filesArray[filesArray.length - 1]);

  try {
    const { data: existing } = await supabaseAdmin
      .from('session_state')
      .select('id')
      .eq('user_id', userId)
      .eq('project', project)
      .eq('external_session_id', info.sessionId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from('session_state')
        .update({
          last_activity: new Date(info.lastActivity).toISOString(),
          files_touched: filesArray,
          total_files_count: filesArray.length,
          tool_calls: info.toolCalls,
          active_file: filesArray[filesArray.length - 1] || null,
          is_active: true
        })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin.from('session_state').insert({
        user_id: userId,
        project,
        editor: EDITOR_NAME,
        external_session_id: info.sessionId,
        active_file: filesArray[filesArray.length - 1] || null,
        session_start: new Date(info.startTime).toISOString(),
        last_activity: new Date(info.lastActivity).toISOString(),
        files_touched: filesArray,
        total_files_count: filesArray.length,
        tool_calls: info.toolCalls,
        is_active: true
      });
    }
  } catch (e) {
    console.error(`Error updating Claude session state ${info.sessionId}:`, e);
  }
}

async function completeSession(userId: string, sessionId: string) {
  const info = activeSessions.get(sessionId);
  if (!info) return;

  const filesArray = Array.from(info.filesTouched);
  const durationMins = Math.max(1, Math.round((info.lastActivity - info.startTime) / 60000));
  
  let project = 'default';
  if (filesArray.length > 0) {
    const parts = filesArray[0].split('/');
    project = parts.find(p => p !== '' && p !== '.' && p !== '..') || 'default';
  }

  const note = `Claude Code session: ${durationMins} mins, ${filesArray.length} files, ${info.toolCalls} tool calls`;

  try {
    await supabaseAdmin.from('activities').insert({
      user_id: userId,
      note,
      source: 'claude_code',
      editor: EDITOR_NAME,
      project,
      timestamp: new Date(info.startTime).toISOString(),
      source_id: `cc_${info.sessionId}`
    });

    await supabaseAdmin.from('session_state')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('external_session_id', info.sessionId);
  } catch (e) {
    console.error(`Error completing Claude session ${sessionId}:`, e);
  }

  fs.unwatchFile(info.filePath);
  activeSessions.delete(sessionId);
  console.error(`[shipscribe] Claude Code session completed: ${sessionId}`);
}

export async function getCurrentClaudeSession(userId: string) {
  const { data: session } = await supabaseAdmin
    .from('session_state')
    .select('*')
    .eq('user_id', userId)
    .eq('editor', 'Claude Code')
    .eq('is_active', true)
    .order('last_activity', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) return null;

  const start = new Date(session.session_start || session.created_at);
  const last = new Date(session.last_activity);
  const durationMins = Math.max(1, Math.round((last.getTime() - start.getTime()) / 60000));

  return {
    editor: "Claude Code",
    session_id: session.external_session_id,
    duration: `${durationMins} mins`,
    files_touched: session.files_touched || [],
    tool_calls: session.tool_calls,
    active: true,
    last_activity: "just now"
  };
}
