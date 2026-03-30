// This file absolutely must be the very first import to ensure it runs before any other module's top-level code.
// 5. Add a single console.error("[MCP] Server starting...") at the top
console.error("[MCP] Server starting...");
// 1. Redirect ALL stdout-bound console methods to stderr
const redirectConsole = () => {
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalDebug = console.debug;
    const originalDir = console.dir;
    console.log = function (...args) { console.error("[redirected-log]", ...args); };
    console.info = function (...args) { console.error("[redirected-info]", ...args); };
    console.warn = function (...args) { console.error("[redirected-warn]", ...args); };
    console.debug = function (...args) { console.error("[redirected-debug]", ...args); };
    console.dir = function (...args) { console.error("[redirected-dir]", ...args); };
};
redirectConsole();
// Catch early fatal errors before EOF
process.on("uncaughtException", (error) => {
    console.error("[shipscribe-mcp] FATAL UNCAUGHT EXCEPTION:", error);
    process.exit(1);
});
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
try {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error(`[bootstrap] Warning: Could not load .env from ${envPath}: ${result.error.message}`);
    }
    else {
        console.error(`[bootstrap] ✓ Loaded environment from ${envPath}`);
    }
}
catch (e) {
    console.error(`[bootstrap] Exception during env load: ${e.message}`);
}
// Quick pre-check for key variables
if (!process.env.SHIPSCRIBE_API_KEY) {
    console.error('[bootstrap] ✗ SHIPSCRIBE_API_KEY is missing from environment');
}
process.on("unhandledRejection", (reason, promise) => {
    console.error("[shipscribe-mcp] FATAL UNHANDLED REJECTION at:", promise, "reason:", reason);
    process.exit(1);
});
