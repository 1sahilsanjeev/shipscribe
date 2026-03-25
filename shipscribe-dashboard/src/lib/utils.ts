import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function detectOS(): 'windows' | 'mac' | 'linux' {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'windows';
  if (ua.includes('Mac')) return 'mac';
  return 'linux';
}

export function getConfigPath(
  editor: 'antigravity' | 'cursor' | 'claude_code',
  os: 'windows' | 'mac' | 'linux',
  username?: string
): string {
  const user = username || '{username}';
  const paths = {
    antigravity: {
      windows: `C:\\Users\\${user}\\.gemini\\antigravity\\mcp_config.json`,
      mac: '~/.gemini/antigravity/mcp_config.json',
      linux: '~/.gemini/antigravity/mcp_config.json'
    },
    claude_code: {
      windows: `C:\\Users\\${user}\\.claude\\claude_desktop_config.json`,
      mac: '~/.claude/claude_desktop_config.json',
      linux: '~/.claude/claude_desktop_config.json'
    },
    cursor: {
      windows: `C:\\Users\\${user}\\.cursor\\mcp.json`,
      mac: '~/.cursor/mcp.json',
      linux: '~/.cursor/mcp.json'
    }
  };
  return paths[editor][os];
}

export function getOneCommandInstall(apiKey: string, editor?: string): string {
  const base = `npx add-mcp https://mcp.shipscribe.dev/mcp -e SHIPSCRIBE_API_KEY=${apiKey || 'sk_live_xxxx'}`;
  return editor ? `${base} -a ${editor}` : base;
}

export function getConfigBlock(
  apiKey: string,
  os: 'windows' | 'mac' | 'linux',
  editor: string
): string {
  // Windows needs double backslashes in paths
  return JSON.stringify({
    mcpServers: {
      shipscribe: {
        command: "node",
        args: os === 'windows' 
          ? ["C:\\Users\\{username}\\shipscribe\\dist\\index.js"]
          : ["/home/{username}/shipscribe/dist/index.js"],
        env: {
          SHIPSCRIBE_API_KEY: apiKey,
          SHIPSCRIBE_API_URL: "http://localhost:3001",
          SHIPSCRIBE_EDITOR: editor || 'unknown'
        }
      }
    }
  }, null, 2);
}
