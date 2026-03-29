
const HEARTBEAT_INTERVAL = 60_000      // 60 seconds normal
const RETRY_INTERVAL = 10_000          // 10 seconds when disconnected
const MAX_RETRIES = 5                  // before giving up
const RECONNECT_INTERVAL = 30_000     // retry after giving up

let isConnected = false
let retryCount = 0

export async function sendHeartbeat(apiKey: string, apiUrl: string): Promise<boolean> {
  if (!apiKey) {
    console.error(`[shipscribe] ✗ No SHIPSCRIBE_API_KEY provided (API URL: ${apiUrl})`)
    return false
  }

  try {
    const time = new Date().toLocaleTimeString()
    console.error(`[shipscribe] [${time}] Attempting heartbeat to ${apiUrl}...`)
    const response = await fetch(
      `${apiUrl}/mcp/heartbeat`, 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          editor: getDetectedEditor(),
          platform: process.platform,
          node_version: process.version,
          mcp_version: '1.0.0'
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    )

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (response.ok && isJson) {
      const data = (await response.json()) as any;
      
      const time = new Date().toLocaleTimeString()
      if (!isConnected) {
        // Just reconnected
        console.error(`[shipscribe] [${time}] ✓ Reconnected successfully!`)
        console.error(`[shipscribe] [${time}] ✓ Missed heartbeats: ${retryCount}`)
        console.error(`[shipscribe] [${time}] ✓ Connected as: ${data.email || 'unknown'}`)
        console.error(`[shipscribe] [${time}] ✓ Resuming normal operation`)
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
      console.error(`[shipscribe] [${time}] ✗ Lost connection to dashboard`)
      console.error(`[shipscribe] [${time}] Will retry every 10 seconds...`)
    }
    
    isConnected = false
    retryCount++
    
    if (err.code === 'ECONNREFUSED') {
      if (retryCount === 1) {
        console.error(`[shipscribe] [${time}] API server is not running`)
        console.error(`[shipscribe] [${time}] Start it with: cd D:\\shipscribe && pnpm dev`)
      }
    }

    if (retryCount <= MAX_RETRIES) {
      console.error(
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
    console.error(`[shipscribe] Editor detected: ${_cachedEditor}`);
  }
  return _cachedEditor;
}

export function startHeartbeat(apiKey: string, apiUrl: string) {
  const time = new Date().toLocaleTimeString()
  console.error(`[shipscribe] [${time}] Starting heartbeat system...`)
  
  // Send immediately on startup
  sendHeartbeat(apiKey, apiUrl).then(connected => {
    const now = new Date().toLocaleTimeString()
    if (connected) {
      console.error(`[shipscribe] [${now}] ✓ Dashboard connection established`)
    } else {
      console.error(`[shipscribe] [${now}] ✗ Dashboard not reachable — will keep trying`)
      console.error(`[shipscribe] [${now}] Make sure the API is running on ${apiUrl}`)
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
      await sendHeartbeat(apiKey, apiUrl)
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
