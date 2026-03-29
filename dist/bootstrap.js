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
// Configure dotenv immediately before any other module imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
try {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}
catch (e) { }
process.on("unhandledRejection", (reason, promise) => {
    console.error("[shipscribe-mcp] FATAL UNHANDLED REJECTION at:", promise, "reason:", reason);
    process.exit(1);
});
