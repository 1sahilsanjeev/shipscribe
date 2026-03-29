import fs from 'fs';
import path from 'path';
import os from 'os';
import { supabaseAdmin } from '../lib/supabase.js';
export async function syncClaudeCode(userId) {
    if (!supabaseAdmin)
        return { sessions_found: 0, sessions_synced: 0 };
    const logsDir = path.join(os.homedir(), '.claude', 'logs');
    if (!fs.existsSync(logsDir)) {
        return {
            message: "Claude Code logs directory not found.",
            sessions_found: 0,
            sessions_synced: 0
        };
    }
    const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.jsonl'));
    const sessions = {};
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const file of files) {
        const filePath = path.join(logsDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const entry = JSON.parse(line);
                    const timestamp = new Date(entry.timestamp).getTime();
                    if (timestamp < twentyFourHoursAgo)
                        continue;
                    const sessionId = entry.sessionId;
                    if (!sessions[sessionId]) {
                        sessions[sessionId] = {
                            startTime: timestamp,
                            endTime: timestamp,
                            files: new Set(),
                            id: sessionId
                        };
                    }
                    sessions[sessionId].startTime = Math.min(sessions[sessionId].startTime, timestamp);
                    sessions[sessionId].endTime = Math.max(sessions[sessionId].endTime, timestamp);
                    const possiblePath = entry.data?.filePath || entry.data?.path;
                    if (possiblePath && typeof possiblePath === 'string') {
                        sessions[sessionId].files.add(possiblePath);
                    }
                }
                catch (e) { }
            }
        }
        catch (e) { }
    }
    let sessionsSynced = 0;
    for (const session of Object.values(sessions)) {
        const durationMs = session.endTime - session.startTime;
        const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
        const filesArray = Array.from(session.files);
        let project = 'default';
        if (filesArray.length > 0) {
            const firstPath = filesArray[0];
            const parts = firstPath.replace(/\\/g, '/').split('/');
            project = parts.find(p => p !== '' && p !== '.' && p !== '..') || 'default';
        }
        const note = `Claude Code session: ${filesArray.length} files touched over ${durationMinutes} minutes in [${project}]`;
        const timestamp = new Date(session.startTime).toISOString();
        const sourceId = `cc_${session.id}`;
        try {
            // Dedup check via source_id
            const { data: exists } = await supabaseAdmin
                .from('activities')
                .select('id')
                .eq('source_id', sourceId)
                .maybeSingle();
            if (!exists) {
                const { error } = await supabaseAdmin.from('activities').insert({
                    user_id: userId,
                    note,
                    source: 'claude_code',
                    project,
                    timestamp,
                    source_id: sourceId
                });
                if (!error)
                    sessionsSynced++;
            }
        }
        catch (e) {
            console.error(`Error syncing Claude session ${session.id}:`, e);
        }
    }
    return {
        sessions_found: Object.keys(sessions).length,
        sessions_synced: sessionsSynced
    };
}
