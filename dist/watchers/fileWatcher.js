import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../lib/supabase.js';
import { heartbeat } from '../lib/timeTracker.js';
// Hardcoded editor detection for immediate reliability
const EDITOR_NAME = (() => {
    if (process.env.ANTIGRAVITY_AGENT === '1')
        return 'antigravity';
    if (process.env.CURSOR_TRACE_ID)
        return 'cursor';
    if (process.env.CLAUDE_CODE_ENTRYPOINT)
        return 'claude_code';
    return process.env.SHIPSCRIBE_EDITOR || 'unknown';
})();
console.log('[fileWatcher] editor detected:', EDITOR_NAME);
const IGNORE_DIRS = ['node_modules', '.git', 'dist', '.next', '.gemini', 'brain'];
const IGNORE_FILES = ['pnpm-lock.yaml', '.env'];
const IGNORE_EXTENSIONS = ['.log'];
const DEBOUNCE_MS = 3000;
const lastSave = new Map();
export async function startFileWatcher(userId) {
    const cwd = process.cwd();
    const projectName = path.basename(cwd);
    console.error(`Starting file watcher for project: ${projectName} at ${cwd}`);
    // Initialize or get session in session_state table
    const { data: existingSession } = await supabaseAdmin
        .from('session_state')
        .select('*')
        .eq('user_id', userId)
        .eq('project', projectName)
        .maybeSingle();
    if (!existingSession) {
        await supabaseAdmin.from('session_state').insert({
            user_id: userId,
            project: projectName,
            files_touched: [],
            total_files_count: 0,
            session_start: new Date().toISOString(),
            is_active: true
        });
    }
    else {
        await supabaseAdmin.from('session_state').update({ is_active: true })
            .eq('user_id', userId)
            .eq('project', projectName);
    }
    fs.watch(cwd, { recursive: true }, async (eventType, filename) => {
        if (!filename)
            return;
        const parts = filename.split(path.sep);
        if (parts.some(part => IGNORE_DIRS.includes(part)))
            return;
        if (IGNORE_FILES.includes(path.basename(filename)))
            return;
        if (IGNORE_EXTENSIONS.includes(path.extname(filename)))
            return;
        const fullPath = path.join(cwd, filename);
        const relativePath = filename.replace(/\\/g, '/');
        const now = Date.now();
        const lastTime = lastSave.get(relativePath) || 0;
        if (now - lastTime < DEBOUNCE_MS)
            return;
        lastSave.set(relativePath, now);
        if (!fs.existsSync(fullPath))
            return;
        try {
            heartbeat(userId, projectName, 'file_watcher', relativePath);
            console.log('[fileWatcher] saving activity with editor:', EDITOR_NAME);
            await supabaseAdmin.from('activities').insert({
                user_id: userId,
                note: `Edited ${path.basename(filename)} in ${projectName}`,
                source: 'file_watcher',
                editor: EDITOR_NAME,
                project: projectName,
                timestamp: new Date().toISOString()
            });
            // Update session state
            const { data: session } = await supabaseAdmin
                .from('session_state')
                .select('files_touched')
                .eq('user_id', userId)
                .eq('project', projectName)
                .single();
            let filesTouched = session?.files_touched || [];
            if (!filesTouched.includes(relativePath)) {
                filesTouched.push(relativePath);
            }
            await supabaseAdmin.from('session_state')
                .update({
                active_file: relativePath,
                last_activity: new Date().toISOString(),
                files_touched: filesTouched,
                total_files_count: filesTouched.length
            })
                .eq('user_id', userId)
                .eq('project', projectName);
            console.error(`File watcher: recorded change to ${relativePath}`);
        }
        catch (error) {
            console.error('Error in file watcher database update:', error);
        }
    });
}
export async function getActiveSession(userId, projectName) {
    const { data: session } = await supabaseAdmin
        .from('session_state')
        .select('*')
        .eq('user_id', userId)
        .eq('project', projectName)
        .single();
    if (!session)
        return null;
    const start = new Date(session.session_start || session.created_at);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return {
        project: session.project,
        active_file: session.active_file,
        session_duration: `${diffMins} mins`,
        files_touched: session.files_touched || [],
        files_count: session.total_files_count,
        started_at: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
}
