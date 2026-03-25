
const HEARTBEAT_INTERVAL = 60_000      // 60 seconds normal
const RETRY_INTERVAL = 10_000          // 10 seconds when disconnected
const MAX_RETRIES = 5                  // before giving up
const RECONNECT_INTERVAL = 30_000     // retry after giving up

let isConnected = false
let retryCount = 0

export async function sendHeartbeat(): Promise<boolean> {
  const apiUrl = process.env.SHIPSCRIBE_API_URL 
    || 'http://127.0.0.1:3001'
  const apiKey = process.env.SHIPSCRIBE_API_KEY

  if (!apiKey) {
    console.log(`[shipscribe] ✗ No SHIPSCRIBE_API_KEY set (API URL: ${apiUrl})`)
    return false
  }

  try {
    const time = new Date().toLocaleTimeString()
    console.log(`[shipscribe] [${time}] Attempting heartbeat to ${apiUrl}...`)
    const response = await fetch(
      `${apiUrl}/api/auth/heartbeat`, 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          editor: getDetectedEditor(),
          platform: process.platform,
          node_version: process.version,
          mcp_version: '1.0.0'
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    )

    if (response.ok) {
      const data = (await response.json()) as any;
      
      const time = new Date().toLocaleTimeString()
      if (!isConnected) {
        // Just reconnected
        console.log(`[shipscribe] [${time}] ✓ Reconnected successfully!`)
        console.log(`[shipscribe] [${time}] ✓ Missed heartbeats: ${retryCount}`)
        console.log(`[shipscribe] [${time}] ✓ Connected as: ${data.email || 'unknown'}`)
        console.log(`[shipscribe] [${time}] ✓ Resuming normal operation`)
      }
      
      isConnected = true
      retryCount = 0
      return true
    } else {
      throw new Error(`HTTP ${response.status}`)
    }

  } catch (err: any) {
    const time = new Date().toLocaleTimeString()
    if (isConnected) {
      // Just lost connection
      console.log(`[shipscribe] [${time}] ✗ Lost connection to dashboard`)
      console.log(`[shipscribe] [${time}] Will retry every 10 seconds...`)
    }
    
    isConnected = false
    retryCount++
    
    if (err.code === 'ECONNREFUSED') {
      if (retryCount === 1) {
        console.log(`[shipscribe] [${time}] API server is not running`)
        console.log(`[shipscribe] [${time}] Start it with: cd D:\\shipscribe && pnpm dev`)
      }
    }

    if (retryCount <= MAX_RETRIES) {
      console.log(
        `[shipscribe] [${time}] Retry ${retryCount}/${MAX_RETRIES} — ${err.message}`
      )
    }
    
    return false
  }
}

export function detectEditor(): string {
  // Antigravity — sets ANTIGRAVITY_AGENT=1
  if (process.env.ANTIGRAVITY_AGENT === '1') return 'antigravity'
  
  // Antigravity fallback — exe path contains Antigravity
  if (process.env.VSCODE_GIT_ASKPASS_NODE?.toLowerCase()
      .includes('antigravity')) return 'antigravity'

  // Cursor — sets CURSOR_TRACE_ID or CURSOR_SESSION_ID
  if (process.env.CURSOR_TRACE_ID) return 'cursor'
  if (process.env.CURSOR_SESSION_ID) return 'cursor'
  
  // Cursor fallback — exe path contains Cursor
  if (process.env.VSCODE_GIT_ASKPASS_NODE?.toLowerCase()
      .includes('cursor')) return 'cursor'

  // Claude Code — sets CLAUDE_CODE_ENTRYPOINT
  if (process.env.CLAUDE_CODE_ENTRYPOINT) return 'claude_code'
  if (process.env.CLAUDE_MCP_SERVER) return 'claude_code'

  // VS Code fallback
  if (process.env.VSCODE_GIT_ASKPASS_NODE?.toLowerCase()
      .includes('code')) return 'vscode'

  // Manual override from .env always wins if set
  if (process.env.SHIPSCRIBE_EDITOR) {
    return process.env.SHIPSCRIBE_EDITOR
  }

  return 'unknown'
}

let _cachedEditor: string | null = null;

export function getDetectedEditor(): string {
  if (!_cachedEditor) {
    _cachedEditor = detectEditor();
    console.log(`[shipscribe] Editor detected: ${_cachedEditor}`);
  }
  return _cachedEditor;
}

export function startHeartbeat() {
  const time = new Date().toLocaleTimeString()
  console.log(`[shipscribe] [${time}] Starting heartbeat system...`)
  
  // Send immediately on startup
  sendHeartbeat().then(connected => {
    const now = new Date().toLocaleTimeString()
    if (connected) {
      console.log(`[shipscribe] [${now}] ✓ Dashboard connection established`)
    } else {
      console.log(`[shipscribe] [${now}] ✗ Dashboard not reachable — will keep trying`)
      console.log(`[shipscribe] [${now}] Make sure the API is running on ${
        process.env.SHIPSCRIBE_API_URL || 'http://localhost:3001'
      }`)
    }
  })

  // Smart interval — checks every 5 seconds
  // but only sends heartbeat at the right time
  let lastHeartbeat = Date.now()
  
  setInterval(async () => {
    const now = Date.now()
    const timeSinceLastHeartbeat = now - lastHeartbeat
    
    // If disconnected: retry every 10 seconds
    // If connected: heartbeat every 60 seconds
    const targetInterval = isConnected 
      ? HEARTBEAT_INTERVAL 
      : RETRY_INTERVAL
    
    if (timeSinceLastHeartbeat >= targetInterval) {
      lastHeartbeat = now
      await sendHeartbeat()
    }
  }, 5000) // check every 5 seconds
}

export function getConnectionStatus() {
  return {
    connected: isConnected,
    retryCount,
    editor: getDetectedEditor()
  }
}
