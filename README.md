# Shipscribe MCP Server (Testing editor detection fix...)

Shipscribe is a developer's personal activity tracker and personal scribe. It automatically gathers your work from GitHub and Claude Code, manages your tasks, and uses AI to write clear, honest summaries of your day—perfect for building in public or keeping a personal log.

## Features
- **Auto-Sync**: Pulls Push, PR, and Issue events from GitHub.
- **Session Tracking**: Parses local Claude Code logs to track work duration and files touched.
- **Task Management**: A full-featured task list with priority sorting and due dates.
- **AI Scribe**: Uses Claude 3.5 Sonnet to generate accomplishments and social media posts.

## ✨ Getting Started

Shipscribe now uses single-key authentication. To get started:

1. **Sign up** at [shipscribe.dev](https://shipscribe.dev) (or use your local REST API).
2. **Copy your API Key** from your Account Settings.
3. **Configure your editor** using the block below.
4. **Restart your editor** — your work will now sync automatically under your account.

## Installation (Self-Hosted)

1. **Clone and Install**:
   ```bash
   pnpm install
   pnpm build
   ```
2. **Start the API**:
   ```bash
   pnpm api
   ```
3. **Create Account**: Use the dashboard or `POST /api/auth/signup` to get your `sk_live_...` key.

## Configuration for Claude Code / Cursor

Add this block to your MCP settings. You only need **one** environment variable now:

```json
{
  "mcpServers": {
    "shipscribe": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/shipscribe/dist/index.js"],
      "env": {
        "SHIPSCRIBE_API_KEY": "sk_live_your_unique_key_here"
      }
    }
  }
}
```

## Available Tools

All tools are now **scoped to your user account**.

### 📥 Tracking
- `track_activity(note: string, project?: string)`: Log a manual note.
- `sync_github()`: Sync events using your encrypted GitHub token.
- `sync_claude_code()`: Sync sessions from your local machine.

### ✅ Task Management
- `add_task(title: string, project?: string, priority: "low"|"medium"|"high", due_date?: string)`
- `complete_task(id: number)`
- `cancel_task(id: number)`
- `get_tasks(status: "todo"|"done"|"cancelled"|"all", project?: string)`
- `quick_complete(title: string, project?: string)`

### ✍️ AI Summaries
- `get_summary(date?: string, format: "short"|"post"|"both")`: Generate an AI summary and social media draft for a specific date.

## Example Usage

**Log a quick note**:
`track_activity(note: "Started refactoring the auth module", project: "shipscribe")`

**Sync everything**:
`sync_github()`
`sync_claude_code()`

**Generate a build-in-public post**:
`get_summary(format: "post")`

# shipscribe

# final test sync
