#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
const args = process.argv.slice(2);
let apiKey = '';
// Simple arg parser
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key' || args[i] === '-k') {
        apiKey = args[i + 1];
        break;
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
};
if (platform === 'win32') {
    configPaths['Claude Desktop'] = path.join(process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
    configPaths['Cursor (Roo/Cline)'] = path.join(process.env.APPDATA || path.join(homedir, 'AppData', 'Roaming'), 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
}
else if (platform === 'darwin') {
    configPaths['Claude Desktop'] = path.join(homedir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    configPaths['Cursor (Roo/Cline)'] = path.join(homedir, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
}
else {
    // Linux configs
    configPaths['Claude Desktop'] = path.join(homedir, '.config', 'Claude', 'claude_desktop_config.json');
    configPaths['Cursor (Roo/Cline)'] = path.join(homedir, '.config', 'Cursor', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
}
const shipscribeConfig = {
    command: "npx",
    args: ["-y", "github:1sahilsanjeev/shipscribe", "shipscribe-mcp"],
    env: {
        SHIPSCRIBE_API_KEY: apiKey,
        SHIPSCRIBE_API_URL: "https://www.shipscribe.pro/api"
    }
};
let installedCount = 0;
for (const [editorName, configPath] of Object.entries(configPaths)) {
    const dirPath = path.dirname(configPath);
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
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
console.log('\n🎉 Setup Complete!');
console.log(`Successfully injected Shipscribe into ${installedCount} editor configurations.`);
console.log('\nPlease restart your editors (or reload the MCP servers) to begin tracking your activity.\n');
