#!/usr/bin/env node
import './bootstrap.js';
import path from 'path';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { startFileWatcher } from "./watchers/fileWatcher.js";
import { startGithubPoller } from "./watchers/githubPoller.js";
import { startClaudeCodeWatcher } from "./watchers/claudeCodeWatcher.js";
import { startHeartbeat } from "./lib/heartbeat.js";
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
    const apiKey = process.env.SHIPSCRIBE_API_KEY;
    const apiUrl = process.env.SHIPSCRIBE_API_URL || "http://127.0.0.1:3005/api";
    // Inject local client-context info that the API server cannot know
    const editorName = (() => {
        if (process.env.ANTIGRAVITY_AGENT === '1')
            return 'antigravity';
        if (process.env.CURSOR_TRACE_ID)
            return 'cursor';
        if (process.env.CLAUDE_CODE_ENTRYPOINT)
            return 'claude_code';
        return process.env.SHIPSCRIBE_EDITOR || 'unknown';
    })();
    const clientContext = {
        cwd: process.cwd(),
        projectName: path.basename(process.cwd()),
        editor: editorName
    };
    try {
        const response = await fetch(`${apiUrl}/mcp/invoke`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({ name, args, clientContext })
        });
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            }
            catch (e) {
                errorData = { error: response.statusText };
            }
            return {
                content: [{ type: "text", text: `Error: ${errorData.error || 'Unknown API Error'}` }],
                isError: true,
            };
        }
        const json = await response.json();
        return { content: json.content };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error connecting to API: ${error.message}` }],
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
        console.error(`\n[shipscribe] ✗ CRITICAL ERROR: Shipscribe API is unreachable.`);
        console.error(`[shipscribe] HOW TO FIX (Local Dev):`);
        console.error(`1. Check if the local API is running in another terminal: 'npm run api:dev'`);
        console.error(`2. Ensure http://localhost:3005/api/health is accessible.`);
        console.error(`\n[shipscribe] HOW TO FIX (Production):`);
        console.error(`1. Check the status at https://www.shipscribe.pro/api/health`);
        console.error(`2. If health is 'degraded', add SUPABASE_URL and SUPABASE_SERVICE_KEY to Vercel.`);
        process.exit(1);
    }
    // Validate API Key via REST API
    const isProduction = apiUrl.includes('shipscribe.pro');
    console.error(`[shipscribe] Validating API key against ${isProduction ? 'PRODUCTION' : 'LOCAL'} API...`);
    try {
        const response = await fetch(`${apiUrl}/auth/validate-key`, {
            headers: { 'x-api-key': apiKey },
            signal: AbortSignal.timeout(5000) // 5s timeout
        });
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        if (response.ok && isJson) {
            const profile = await response.json();
            console.error(`[shipscribe] ✓ API key validated for: ${profile.email}`);
            validatedUser = profile;
        }
        else {
            let errorData = { error: 'Unknown API error', status: response.status };
            if (isJson) {
                errorData = await response.json().catch(() => errorData);
            }
            else {
                const text = await response.text().catch(() => '');
                errorData.error = `Unexpected response format (${contentType}). Body: ${text.slice(0, 100)}`;
            }
            console.error(`[shipscribe] API Validation Error: ${errorData.error}`);
            // Provide diagnostic hints based on the specific error
            if (errorData.error.includes('[supabase]') || response.status === 503) {
                const location = isProduction ? 'Vercel Dashboard' : 'local .env file';
                console.error(`\n[shipscribe] DIAGNOSTIC: The API at ${apiUrl} is missing Supabase keys.`);
                console.error(`ACTION: Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in the ${location}.`);
            }
            throw errorData;
        }
    }
    catch (err) {
        const errorMsg = err.error || err.message || 'Unknown error';
        console.error(`\n[shipscribe] CRITICAL ERROR: API validation failed (${errorMsg}).`);
        if (isProduction) {
            console.error(`\n[shipscribe] PRODUCTION TROUBLESHOOTING:`);
            console.error(`1. GOAL: Fix the API configuration on Vercel.`);
            console.error(`2. CHECK: Go to Vercel Dashboard > Settings > Environment Variables.`);
            console.error(`3. ADD: SUPABASE_URL and SUPABASE_SERVICE_KEY (from your Supabase project).`);
            console.error(`4. REDEPLOY: The API must be redeployed for changes to take effect.`);
            console.error(`\n5. ALTERNATIVE: Use the local backend. In Claude Desktop config:`);
            console.error(`   Change SHIPSCRIBE_API_URL to: http://127.0.0.1:3005/api`);
        }
        else {
            console.error(`\n[shipscribe] LOCAL DEV TROUBLESHOOTING:`);
            console.error(`1. run 'npm run api:dev' to start the local backend.`);
            console.error(`2. Check 'd:/shipscribe/.env' for correct Supabase and Anthropic keys.`);
        }
        process.exit(1);
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[shipscribe] Step 5: Connected MCP Server via stdio transport.');
    // Start background API sync watchers
    startFileWatcher(apiKey, apiUrl);
    startGithubPoller(apiKey, apiUrl);
    startClaudeCodeWatcher(apiKey, apiUrl);
    // Start Heartbeat System
    startHeartbeat(apiKey, apiUrl);
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
