#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
const args = process.argv.slice(2);
let apiKey = '';
let apiUrl = 'https://www.shipscribe.pro/api';
// Simple arg parser
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key' || args[i] === '-k') {
        apiKey = args[i + 1];
    }
    if (args[i] === '--url' || args[i] === '-u') {
        apiUrl = args[i + 1];
    }
}
console.log('\n🚢 Shipscribe MCP Setup\n');
if (!apiKey) {
    console.error('❌ Error: API Key is required.');
    console.error('\nUsage:');
    console.error('  npx shipscribe-setup --key sk_live_your_key_here\n');
    console.log('You can find your API key at: https://www.shipscribe.pro/dashboard/integrations\n');
    process.exit(1);
}
const homedir = os.homedir();
const platform = os.platform();
// Determine config paths based on OS
const configPaths = {
    'Antigravity': path.join(homedir, '.gemini', 'antigravity', 'mcp_config.json'),
    'Windsurf': path.join(homedir, '.codeium', 'windsurf', 'mcp_config.json'),
};
if (platform === 'win32') {
    configPaths['Claude Desktop'] = path.join(process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
    configPaths['Cursor (Roo/Cline)'] = path.join(process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming'), 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
    configPaths['Cursor (Native)'] = path.join(process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming'), 'Cursor', 'User', 'globalStorage', 'mcp_config.json');
}
else if (platform === 'darwin') {
    configPaths['Claude Desktop'] = path.join(homedir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    configPaths['Cursor (Roo/Cline)'] = path.join(homedir, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
    configPaths['Cursor (Native)'] = path.join(homedir, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'mcp_config.json');
}
else {
    // Linux configs
    configPaths['Claude Desktop'] = path.join(homedir, '.config', 'Claude', 'claude_desktop_config.json');
    configPaths['Cursor (Roo/Cline)'] = path.join(homedir, '.config', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
    configPaths['Cursor (Native)'] = path.join(homedir, '.config', 'Cursor', 'User', 'globalStorage', 'mcp_config.json');
}
const shipscribeConfig = {
    command: "npx",
    args: ["-y", "github:1sahilsanjeev/shipscribe", "shipscribe-mcp"],
    env: {
        SHIPSCRIBE_API_KEY: apiKey,
        SHIPSCRIBE_API_URL: apiUrl
    }
};
let installedCount = 0;
for (const [editorName, configPath] of Object.entries(configPaths)) {
    const dirPath = path.dirname(configPath);
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        catch (e) {
            continue; // Skip if directory cannot be created
        }
    }
    let config = {};
    let fileExisted = false;
    if (fs.existsSync(configPath)) {
        fileExisted = true;
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            config = content.trim() ? JSON.parse(content) : {};
        }
        catch (e) {
            console.warn(`⚠️  Warning: Could not parse existing config at ${configPath}. Replacing it.`);
            config = {};
        }
    }
    if (!config.mcpServers) {
        config.mcpServers = {};
    }
    // Inject our server config
    config.mcpServers.shipscribe = shipscribeConfig;
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        installedCount++;
        console.log(`✅ Configured for ${editorName}`);
        console.log(`   -> ${configPath}`);
    }
    catch (e) {
        console.error(`❌ Failed to write config for ${editorName}: ${e.message}`);
    }
}
console.log(`\n🎉 Setup Complete! (API URL: ${apiUrl})\n`);
console.log(`Successfully injected Shipscribe into ${installedCount} editor configurations.`);
// Connectivity test
console.log('\n🔍 Verifying connection to Shipscribe API...');
try {
    const healthUrl = `${apiUrl.replace(/\/$/, '')}/health`;
    const response = await fetch(healthUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (response.ok) {
        console.log('✨ Connection Verified! Your MCP server is talking to the Shipscribe API.');
    }
    else {
        console.log('⚠️  Warning: Configured but could not verify API connection (Status: ' + response.status + ').');
        console.log('   Check your API Key and URL in the dashboard.');
    }
}
catch (e) {
    console.log('⚠️  Warning: Configured but API is currently unreachable.');
    console.log('   Make sure your local server is running at ' + apiUrl);
}
console.log('\nPlease restart your editors (or reload the MCP servers) to begin tracking your activity.\n');
