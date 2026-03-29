// Proxied through fetch
let pollInterval = null;
let lastCheck = null;
export function startGithubPoller(apiKey, apiUrl) {
    const intervalSeconds = Math.max(30, parseInt(process.env.GITHUB_POLL_INTERVAL || '60'));
    const intervalMs = intervalSeconds * 1000;
    console.error(`[shipscribe] GitHub poller started — checking every ${intervalSeconds}s`);
    // Initial sync
    runSync(apiKey, apiUrl);
    pollInterval = setInterval(() => {
        runSync(apiKey, apiUrl);
    }, intervalMs);
}
async function runSync(apiKey, apiUrl) {
    try {
        const res = await fetch(`${apiUrl}/mcp/invoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({ name: 'sync_github', args: {} })
        });
        if (res.ok) {
            lastCheck = new Date();
            // The backend handles the heartbeat and logging directly for syncs now, or we can just ignore it over here.
        }
    }
    catch (e) {
        console.error(`[shipscribe] GitHub Poller Error:`, e);
    }
}
export function getGithubPollerStatus() {
    if (!lastCheck)
        return "Last checked: never";
    const diff = Math.floor((Date.now() - lastCheck.getTime()) / 60000);
    return `active, last checked ${diff} mins ago`;
}
export function stopGithubPoller() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}
