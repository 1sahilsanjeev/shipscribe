import fs from 'fs';
import path from 'path';
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
console.error('[fileWatcher] editor detected:', EDITOR_NAME);
const IGNORE_DIRS = ['node_modules', '.git', 'dist', '.next', '.gemini', 'brain'];
const IGNORE_FILES = ['pnpm-lock.yaml', '.env'];
const IGNORE_EXTENSIONS = ['.log'];
const DEBOUNCE_MS = 3000;
const lastSave = new Map();
export async function startFileWatcher(apiKey, apiUrl) {
    const cwd = process.cwd();
    const projectName = path.basename(cwd);
    console.error(`Starting file watcher for project: ${projectName} at ${cwd}`);
    try {
        await fetch(`${apiUrl}/mcp/invoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({
                name: 'init_session',
                clientContext: { projectName, editor: EDITOR_NAME }
            })
        });
    }
    catch (e) {
        // ignore startup failure
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
            await fetch(`${apiUrl}/mcp/file_change`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
                body: JSON.stringify({
                    editor: EDITOR_NAME,
                    project: projectName,
                    relativePath
                })
            });
            console.error(`File watcher: recorded change to ${relativePath}`);
        }
        catch (error) {
            console.error('Error in file watcher network update:', error);
        }
    });
}
export async function getActiveSession(userId, projectName) {
    // Not used on the client plugin. Backend implements this internally.
    return null;
}
