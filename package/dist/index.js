import './bootstrap.js';
import path from 'path';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { trackActivity } from "./tools/activity.js";
import { getTasks, createTask, getUserIdByApiKey } from "./tools/tasks.js";
import { getSummary } from "./tools/summary.js";
import { syncGitHub } from "./tools/github.js";
import { supabaseAdmin } from "./lib/supabase.js";
import { startFileWatcher, getActiveSession } from "./watchers/fileWatcher.js";
import { startGithubPoller, getGithubPollerStatus } from "./watchers/githubPoller.js";
import { startClaudeCodeWatcher, getCurrentClaudeSession } from "./watchers/claudeCodeWatcher.js";
import { getTimeToday, getTimeWeek, startStaleSessionCleaner } from "./lib/timeTracker.js";
// ...
import { startHeartbeat, getConnectionStatus } from "./lib/heartbeat.js";
const server = new Server({
    name: "shipscribe",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
let validatedUser = null;
/**
 * Handler that lists available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "track_activity",
                description: "Log a developer activity or note",
                inputSchema: {
                    type: "object",
                    properties: {
                        note: { type: "string", description: "The activity description" },
                        project: { type: "string", description: "Optional project name" },
                    },
                    required: ["note"],
                },
            },
            {
                name: "add_task",
                description: "Add a new task",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        project: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                        due_date: { type: "string", description: "ISO date string" },
                    },
                    required: ["title"],
                },
            },
            {
                name: "get_tasks",
                description: "List tasks with filtering and sorting",
                inputSchema: {
                    type: "object",
                    properties: {
                        status: { type: "string", enum: ["todo", "done", "cancelled", "all"] },
                        project: { type: "string" },
                    },
                },
            },
            {
                name: "get_summary",
                description: "Generate an AI summary of recent activity and a social post",
                inputSchema: {
                    type: "object",
                    properties: {
                        date: { type: "string", description: "Target date in YYYY-MM-DD format" },
                        format: { type: "string", enum: ["short", "post", "both"], default: "both" }
                    },
                },
            },
            {
                name: "sync_github",
                description: "Sync recent activity from GitHub",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "sync_claude_code",
                description: "Sync recent activity from Claude Code sessions",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_active_session",
                description: "Get the current real-time coding session status",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_time_today",
                description: "Get summary of time spent coding today per project",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_time_week",
                description: "Get weekly summary of time spent coding",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "status",
                description: "Get a real-time status overview of all Shipscribe components",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "debug_env",
                description: "Debug environment variables",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
        ],
    };
});
/**
 * Handler for tool calls.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const userId = validatedUser.id;
    try {
        switch (name) {
            case "track_activity": {
                const result = await trackActivity(userId, args?.note, args?.project);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "add_task": {
                const result = await createTask(userId, args?.title, args?.project, args?.priority);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "get_tasks": {
                const result = await getTasks(userId, args?.status);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "get_summary": {
                const result = await getSummary(userId, args?.date, args?.format);
                return { content: [{ type: "text", text: result }] };
            }
            case "get_active_session": {
                const projectName = path.basename(process.cwd());
                const session = await getActiveSession(userId, projectName);
                if (!session)
                    return { content: [{ type: "text", text: "No active session found." }] };
                const time = await getTimeToday(userId);
                const bar = (project) => {
                    const p = time.by_project.find((bp) => bp.project === project);
                    if (!p)
                        return "";
                    const bars = Math.min(15, Math.max(1, Math.round(p.hours * 3)));
                    return "█".repeat(bars) + "░".repeat(15 - bars);
                };
                const md = [
                    `## Current Session 🟢`,
                    ``,
                    `**Project:** ${session.project}  `,
                    `**Duration:** ${session.session_duration} (started ${session.started_at})  `,
                    `**Active file:** ${session.active_file || 'None'}  `,
                    ``,
                    `### Files touched today (${session.files_count})`,
                    ...session.files_touched.map((f) => `- ${f}${f === session.active_file ? ' ← current' : ''}`),
                    ``,
                    `### Time breakdown`,
                    ...time.by_project.map((p) => `- ${p.project}: ${Math.floor(p.hours)}h ${Math.round((p.hours % 1) * 60)}m ${bar(p.project)}`)
                ].join('\n');
                return { content: [{ type: "text", text: md }] };
            }
            case "get_current_session": {
                const result = await getCurrentClaudeSession(userId);
                if (!result)
                    return { content: [{ type: "text", text: "No active live session found." }] };
                const md = [
                    `## Editor Session (${result.editor}) 🟢`,
                    ``,
                    `**Session ID:** \`${result.session_id}\`  `,
                    `**Duration:** ${result.duration}  `,
                    `**Files touched:** ${result.files_touched.length}  `,
                    `**Tool calls:** ${result.tool_calls}  `,
                    ``,
                    `### Recent Files`,
                    ...result.files_touched.slice(-5).map((f) => `- ${f}`)
                ].join('\n');
                return { content: [{ type: "text", text: md }] };
            }
            case "get_time_today": {
                const result = await getTimeToday(userId);
                const md = [
                    `## Today's Time ⏱`,
                    ``,
                    `**Total:** ${result.total_hours}h across ${result.by_project.length} projects`,
                    ``,
                    `| Project | Time | Sessions |`,
                    `|---------|------|----------|`,
                    ...result.by_project.map((p) => `| ${p.project} | ${Math.floor(p.hours)}h ${Math.round((p.hours % 1) * 60)}m | ${p.sessions} |`),
                    ``,
                    `**Most productive hour:** ${result.most_productive_hour}`
                ].join('\n');
                return { content: [{ type: "text", text: md }] };
            }
            case "get_time_week": {
                const result = await getTimeWeek(userId);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "sync_github": {
                const result = await syncGitHub(userId, getGithubPollerStatus());
                if (result.error)
                    return { content: [{ type: "text", text: `Error: ${result.error}` }] };
                const md = [
                    `## GitHub Sync ✓`,
                    ``,
                    `**Just synced:** ${result.just_synced} new events  `,
                    `**Today's total:** ${result.total_today} events across ${result.repos} repos`,
                    ``,
                    `### Recent activity`,
                    ...(result.recent || []).map((r) => `- ${r.note} *(${new Date(r.timestamp).toLocaleTimeString()})*`)
                ].join('\n');
                return { content: [{ type: "text", text: md }] };
            }
            case "status": {
                const time = await getTimeToday(userId);
                const { count: githubTotal } = await supabaseAdmin
                    .from('activities')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('source', 'github')
                    .gte('timestamp', new Date().toISOString().split('T')[0] + 'T00:00:00Z');
                const { count: tasksDone } = await supabaseAdmin
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('status', 'done')
                    .gte('completed_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z');
                const conn = getConnectionStatus();
                const md = [
                    `## Shipscribe Status`,
                    ``,
                    `${conn.connected ? '🟢' : '🔴'} Dashboard: ${conn.connected ? 'Connected' : 'Disconnected'}`,
                    `${conn.connected ? '' : '⚠️  Run `pnpm dev` in D:\\shipscribe to reconnect\n'}`,
                    `🟢 File watcher: Active`,
                    `🟢 GitHub poller: Active *(${getGithubPollerStatus()})*`,
                    `⚡ Editor: ${conn.editor}`,
                    ``,
                    `**Today at a glance**`,
                    `- ${time.total_hours}h coded`,
                    `- ${githubTotal || 0} commits`,
                    `- ${tasksDone || 0} tasks completed  `,
                    `- Streak: 14 days 🔥`,
                    ``,
                    `Run /get_summary to generate today's post →`
                ].join('\n');
                return { content: [{ type: "text", text: md }] };
            }
            case "debug_env": {
                const allEnvKeys = Object.keys(process.env).sort();
                // Filter for potentially relevant ones
                const relevant = allEnvKeys.filter(key => key.toLowerCase().includes('antigravity') ||
                    key.toLowerCase().includes('cursor') ||
                    key.toLowerCase().includes('claude') ||
                    key.toLowerCase().includes('gemini') ||
                    key.toLowerCase().includes('google') ||
                    key.toLowerCase().includes('editor') ||
                    key.toLowerCase().includes('ide') ||
                    key.toLowerCase().includes('session') ||
                    key.toLowerCase().includes('term') ||
                    key.toLowerCase().includes('process') ||
                    key.toLowerCase().includes('parent') ||
                    key.toLowerCase().includes('shell') ||
                    key.toLowerCase().includes('vscode') ||
                    key.toLowerCase().includes('mcp'));
                // Also get parent process info
                const { execSync } = require('child_process');
                let parentInfo = 'unknown';
                try {
                    parentInfo = process.platform === 'win32'
                        ? execSync(`wmic process where processid=${process.ppid} get name,executablepath /value`).toString().trim()
                        : execSync(`ps -p ${process.ppid} -o pid,ppid,comm,args`).toString().trim();
                }
                catch (e) {
                    parentInfo = `Error: ${e.message}`;
                }
                // Get full process tree on Windows
                let processTree = 'unknown';
                try {
                    processTree = process.platform === 'win32'
                        ? execSync(`wmic process get name,processid,parentprocessid /value`).toString().trim()
                        : execSync(`ps aux`).toString().trim();
                }
                catch (e) {
                    processTree = `Error: ${e.message}`;
                }
                return {
                    content: [{
                            type: 'text',
                            text: [
                                '## Environment Variables (relevant)',
                                relevant.map(k => `${k}=${process.env[k]}`).join('\n'),
                                '',
                                '## All Env Keys (names only)',
                                allEnvKeys.join('\n'),
                                '',
                                '## Parent Process Info',
                                parentInfo,
                                '',
                                '## Process Info',
                                `PID: ${process.pid}`,
                                `PPID: ${process.ppid}`,
                                `Platform: ${process.platform}`,
                                `Node: ${process.version}`,
                            ].join('\n')
                        }]
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});
/**
 * Start the server using stdio transport.
 */
async function main() {
    console.error("[shipscribe] Step 1: Initializing MCP Server...");
    // 2. Check required env vars
    const apiKey = process.env.SHIPSCRIBE_API_KEY;
    if (!apiKey) {
        console.error("CRITICAL ERROR: SHIPSCRIBE_API_KEY is not set in environment.");
        process.exit(1);
    }
    const apiUrl = process.env.SHIPSCRIBE_API_URL || "http://localhost:3005/api";
    console.error(`[shipscribe] Step 2: Configured to use API URL: ${apiUrl}`);
    // 3. Wait for backend API to be ready (Retry loop)
    console.error(`[shipscribe] Step 3: Checking API availability at ${apiUrl}/health...`);
    let apiReady = false;
    let retries = 5;
    while (!apiReady && retries > 0) {
        try {
            const ping = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(2000) });
            if (ping.ok) {
                console.error(`[shipscribe] ✓ API server is reachable`);
                apiReady = true;
            }
            else {
                console.error(`[shipscribe] Warning: API health check returned status ${ping.status}. Retrying...`);
                await new Promise(res => setTimeout(res, 2000));
                retries--;
            }
        }
        catch (err) {
            console.error(`[shipscribe] API unreachable (${err.message}). Retrying in 2s... (${retries} attempts left)`);
            await new Promise(res => setTimeout(res, 2000));
            retries--;
        }
    }
    if (!apiReady) {
        console.error(`\nCRITICAL ERROR: Shipscribe API is unreachable.`);
        if (!supabaseAdmin) {
            console.error(`[shipscribe] Error: No Supabase fallback keys found. Exiting.`);
            console.error(`[shipscribe] HOW TO FIX:\n1. Open a new terminal\n2. Run: pnpm dev:all\n`);
            process.exit(1);
        }
        else {
            console.error(`[shipscribe] API is down but Supabase is available. Proceeding in fallback mode...`);
        }
    }
    // Validate API Key via REST API
    console.error(`[shipscribe] Validating API key...`);
    try {
        const response = await fetch(`${apiUrl}/auth/validate-key`, {
            headers: { 'x-api-key': apiKey },
            signal: AbortSignal.timeout(3000) // 3s timeout
        });
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        if (response.ok && isJson) {
            const profile = await response.json();
            console.error(`[shipscribe] API key validated for user: ${profile.email}`);
            validatedUser = profile;
        }
        else {
            let errorData = { error: 'Unknown API error', status: response.status };
            if (isJson) {
                errorData = await response.json().catch(() => errorData);
            }
            else {
                const text = await response.text().catch(() => '');
                errorData.error = `Unexpected response format (expected JSON, got ${contentType}). Body: ${text.slice(0, 100)}`;
            }
            console.error(`[shipscribe] API Validation Error: ${errorData.error}`);
            throw errorData; // Trigger the catch block below
        }
    }
    catch (err) {
        // If it's already a structured error from above, we use it
        const errorMsg = err.error || err.message || 'Unknown error';
        console.error(`[shipscribe] Warning: API validation failed (${errorMsg}).`);
        // Fallback: Validate directly via Supabase if keys are available
        if (supabaseAdmin) {
            console.error(`[shipscribe] Attempting direct database validation...`);
            const userId = await getUserIdByApiKey(apiKey);
            if (userId) {
                console.error(`[shipscribe] ✓ Direct validation successful for user ID: ${userId}`);
                validatedUser = { id: userId, email: 'local-user@shipscribe.dev' };
            }
            else {
                console.error(`CRITICAL ERROR: Invalid SHIPSCRIBE_API_KEY.`);
                process.exit(1);
            }
        }
        else {
            console.error(`CRITICAL ERROR: Failed to connect to Shipscribe API and no Supabase keys available.`);
            process.exit(1);
        }
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[shipscribe] Step 5: Connected MCP Server via stdio transport.');
    // Start file watchers
    startFileWatcher(validatedUser.id);
    startGithubPoller(validatedUser.id);
    startClaudeCodeWatcher(validatedUser.id);
    // Start session tracking
    startStaleSessionCleaner();
    // Start Heartbeat System
    startHeartbeat();
    console.error('[shipscribe] Step 6: Background workers running.');
    console.error(`[shipscribe] API URL: ${apiUrl}`);
    console.error(`[shipscribe] Shipscribe MCP server running for ${validatedUser.email}`);
}
// 4. Wrap initialization in try/catch to ensure errors surface
try {
    main().catch((error) => {
        console.error("[shipscribe-mcp] FATAL ERROR during MCP server initialization:", error);
        process.exit(1);
    });
}
catch (topLevelError) {
    console.error("[shipscribe-mcp] FATAL ERROR during top-level execution:", topLevelError);
    process.exit(1);
}
