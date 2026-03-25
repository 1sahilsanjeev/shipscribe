#!/bin/bash

echo "🚀 Setting up Shipscribe..."

# Install dependencies
pnpm install

# Build the project
pnpm build

# Get absolute path
ABSOLUTE_PATH=$(pwd)/dist/index.js

echo ""
echo "✅ Setup complete! Add the following to your MCP settings:"
echo ""
echo "----------------------------------------------------------"
cat <<EOF
{
  "mcpServers": {
    "shipscribe": {
      "command": "node",
      "args": ["$ABSOLUTE_PATH"],
      "env": {
        "ANTHROPIC_API_KEY": "your-key-here",
        "GITHUB_TOKEN": "your-token-here",
        "GITHUB_USERNAME": "your-username-here"
      }
    }
  }
}
EOF
echo "----------------------------------------------------------"
