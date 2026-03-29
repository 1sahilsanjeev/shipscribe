import fs from 'fs';
import path from 'path';
import os from 'os';

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

let apiKeyRef = '';
let apiUrlRef = '';

export function startClaudeCodeWatcher(apiKey: string, apiUrl: string) {
  apiKeyRef = apiKey;
  apiUrlRef = apiUrl;
  
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
        startTailing(filePath);
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
      startTailing(filePath);
    }
  }

  // Periodic inactivity check
  setInterval(() => {
    const now = Date.now();
    for (const [sessionId, info] of activeSessions.entries()) {
      if (now - info.lastActivity > INACTIVITY_TIMEOUT_MS) {
        completeSession(sessionId);
      }
    }
  }, 60000); // Check every minute
}

function startTailing(filePath: string) {
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
      processNewContent(sessionId);
    }
  });

  processNewContent(sessionId, true);
}

async function processNewContent(sessionId: string, isInitial = false) {
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
      await updateSessionState(info);
    }
  } catch (error: any) {
    console.error(`Error processing Claude log ${sessionId}:`, error);
  }
}

async function updateSessionState(info: ClaudeSessionInfo) {
  const filesArray = Array.from(info.filesTouched);
  let project = 'default';
  if (filesArray.length > 0) {
    const parts = filesArray[0].split('/');
    project = parts.find(p => p !== '' && p !== '.' && p !== '..') || 'default';
  }

  try {
    const args = {
      info: {
        ...info,
        filesTouched: Array.from(info.filesTouched)
      },
      project
    };

    await fetch(`${apiUrlRef}/mcp/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKeyRef },
      body: JSON.stringify({ name: 'claude_code_update', args })
    });
  } catch (e: any) {
    console.error(`Error updating Claude session state ${info.sessionId}:`, e);
  }
}

async function completeSession(sessionId: string) {
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
    const args = {
      info: {
        ...info,
        filesTouched: Array.from(info.filesTouched)
      },
      project,
      durationMins,
      note
    };

    await fetch(`${apiUrlRef}/mcp/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKeyRef },
      body: JSON.stringify({ name: 'claude_code_complete', args })
    });
  } catch (e: any) {
    console.error(`Error completing Claude session ${sessionId}:`, e);
  }

  fs.unwatchFile(info.filePath);
  activeSessions.delete(sessionId);
  console.error(`[shipscribe] Claude Code session completed: ${sessionId}`);
}

export async function getCurrentClaudeSession(userId: string) {
  // Not used from the plugin side.
  return null;
}
