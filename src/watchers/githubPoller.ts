import { performGithubSync } from '../tools/github.js';
import { heartbeat } from '../lib/timeTracker.js';

let pollInterval: NodeJS.Timeout | null = null;
let lastCheck: Date | null = null;

export function startGithubPoller(userId: string) {
  const intervalSeconds = Math.max(30, parseInt(process.env.GITHUB_POLL_INTERVAL || '60'));
  const intervalMs = intervalSeconds * 1000;

  console.error(`[shipscribe] GitHub poller started — checking every ${intervalSeconds}s`);

  // Initial sync
  runSync(userId);

  pollInterval = setInterval(() => {
    runSync(userId);
  }, intervalMs);
}

async function runSync(userId: string) {
  try {
    const result = await performGithubSync(userId);
    lastCheck = new Date();
    
    if (result.synced > 0) {
      // Basic heartbeat for GitHub activity
      heartbeat(userId, 'github-sync', 'github'); 
      console.error(`[shipscribe] GitHub: ${result.synced} new events synced`);
    }
  } catch (e) {
    console.error(`[shipscribe] GitHub Poller Error:`, e);
  }
}

export function getGithubPollerStatus() {
  if (!lastCheck) return "Last checked: never";
  const diff = Math.floor((Date.now() - lastCheck.getTime()) / 60000);
  return `active, last checked ${diff} mins ago`;
}

export function stopGithubPoller() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
