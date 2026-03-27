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

export function getOneCommandInstall(apiKey: string): string {
  return `npx -y github:1sahilsanjeev/shipscribe shipscribe-setup --key ${apiKey}`;
}

export function getConfigBlock(
  apiKey: string
): string {
  return JSON.stringify({
    mcpServers: {
      shipscribe: {
        command: "npx",
        args: ["-y", "github:1sahilsanjeev/shipscribe", "shipscribe-mcp"],
        env: {
          SHIPSCRIBE_API_KEY: apiKey,
          SHIPSCRIBE_API_URL: "https://www.shipscribe.pro/api"
        }
      }
    }
  }, null, 2);
}
