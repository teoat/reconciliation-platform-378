# Quick Start: MCP Server Setup

This guide will help you quickly set up the Model Context Protocol (MCP) server for enhanced AI agent controls.

## Prerequisites Check

Run this to check your current setup:

```bash
./scripts/comprehensive-diagnostic.sh
```

## Step 1: Install Node.js (if needed)

If Node.js is not installed or version < 18:

### macOS

**Option A: Via Homebrew (Recommended)**
```bash
brew install node
```

**Option B: Manual download**
1. Visit https://nodejs.org/
2. Download macOS installer
3. Run installer

### Verify Installation
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

Or use the helper script:
```bash
./scripts/install-nodejs.sh
```

## Step 2: Setup MCP Server

Once Node.js is installed, run:

```bash
chmod +x scripts/setup-mcp-server.sh
./scripts/setup-mcp-server.sh
```

This will:
1. ✅ Check Node.js version
2. ✅ Install dependencies
3. ✅ Build TypeScript
4. ✅ Create .env configuration file

## Step 3: Configure Environment

Edit the `.env` file in `mcp-server/`:

```bash
cd mcp-server
nano .env  # or use your preferred editor
```

Ensure these values are correct:
```env
DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
REDIS_URL=redis://:redis_pass@localhost:6379
PROJECT_ROOT=/Users/Arief/Desktop/378
BACKEND_URL=http://localhost:2000
```

## Step 4: Test MCP Server

```bash
cd mcp-server
npm start
```

You should see:
```
Reconciliation Platform MCP Server running on stdio
```

Press `Ctrl+C` to stop.

## Step 5: Configure AI Assistant

### Claude Desktop (macOS)

1. Open `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add this configuration:

```json
{
  "mcpServers": {
    "reconciliation-platform": {
      "command": "node",
      "args": ["/Users/Arief/Desktop/378/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app",
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "PROJECT_ROOT": "/Users/Arief/Desktop/378"
      }
    }
  }
}
```

3. Restart Claude Desktop

### Cursor IDE

1. Open Settings (Cmd+,)
2. Search for "MCP" or "Model Context Protocol"
3. Add server configuration similar to Claude Desktop above

## Step 6: Test with AI Assistant

Once configured, try asking your AI assistant:

- "Check the status of all Docker containers"
- "Show me the backend health status"
- "What Redis keys are cached?"
- "Read the backend main.rs file"
- "Run diagnostics on the application"

## Troubleshooting

### Node.js not found
```bash
./scripts/install-nodejs.sh
```

### Dependencies install failed
```bash
cd mcp-server
rm -rf node_modules package-lock.json
npm install
```

### Build failed
```bash
cd mcp-server
npm run build
# Check for TypeScript errors
```

### Server not starting
1. Check `.env` file exists and has correct values
2. Verify Docker is running
3. Check database and Redis are accessible

### AI Assistant not connecting
1. Verify MCP server test works: `cd mcp-server && npm start`
2. Check configuration file syntax (JSON)
3. Restart AI assistant application
4. Check logs for connection errors

## Next Steps

After setup is complete:

1. ✅ Run diagnostics: `./scripts/comprehensive-diagnostic.sh`
2. ✅ Test MCP tools through AI assistant
3. ✅ Explore available tools (see `mcp-server/README.md`)
4. ✅ Integrate MCP into your workflow

## Support

- See `MCP_INSTALLATION_GUIDE.md` for detailed documentation
- Check `COMPREHENSIVE_DIAGNOSTIC_REPORT.md` for system status
- Review `mcp-server/README.md` for tool documentation

---

**Ready to use?** Run the setup script:
```bash
./scripts/setup-mcp-server.sh
```

