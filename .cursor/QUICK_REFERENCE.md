# Cursor IDE Quick Reference

**Quick reference guide for common Cursor IDE operations and MCP tools**

---

## 🚀 Quick Setup

```bash
# Build and setup MCP servers
./scripts/setup-cursor-mcp.sh

# Validate configuration
./scripts/validate-cursor-config.sh
```

---

## 📋 MCP Servers Quick Reference

### Task Management
- **task-master-ai**: Project task management
  - `get_tasks` - List all tasks
  - `next_task` - Get next task to work on
  - `expand_task` - Break down complex tasks
  - `set_task_status` - Update task status

### File Operations
- **filesystem**: File system operations
  - Read/write files
  - List directories
  - Search files

### Version Control
- **git**: Git repository operations
  - Commit changes
  - View history
  - Branch management

### Database
- **postgres**: PostgreSQL operations
  - Query database
  - Execute SQL
  - View schema

- **sqlite**: SQLite operations
  - Query local database
  - Execute SQL

### Infrastructure
- **docker**: Docker container management
  - List containers
  - Manage images
  - View logs

- **prometheus**: Metrics and monitoring
  - Query metrics
  - View dashboards

### Web & Automation
- **puppeteer**: Browser automation
  - Take screenshots
  - Generate PDFs
  - E2E testing

- **fetch**: HTTP requests
  - Make API calls
  - Test endpoints

### Search & Integration
- **brave-search**: Web search
  - Search the web
  - Get current information

- **github**: GitHub integration
  - Manage issues
  - View PRs
  - Access repos

### Memory
- **memory**: Persistent memory
  - Store conversation context
  - Remember preferences

### Custom
- **reconciliation-platform**: Project-specific tools
  - Custom operations
  - Project management

---

## 🎯 Common Workflows

### Starting a New Feature
1. Use `task-master-ai` to create/expand tasks
2. Use `git` to create feature branch
3. Use `filesystem` to create new files
4. Use `postgres` to check database schema

### Debugging
1. Use `docker` to check container logs
2. Use `prometheus` to check metrics
3. Use `postgres` to query database state
4. Use `fetch` to test API endpoints

### Testing
1. Use `puppeteer` for E2E tests
2. Use `filesystem` to read test files
3. Use `git` to check test coverage

### Research
1. Use `brave-search` for current information
2. Use `github` to check similar implementations
3. Use `memory` to remember findings

---

## 📚 Rules Quick Reference

### Available Rules
- **cursor_rules.mdc**: General rule formatting
- **self_improve.mdc**: Rule improvement guidelines
- **rust_patterns.mdc**: Rust-specific patterns
- **typescript_patterns.mdc**: TypeScript/React patterns
- **testing.mdc**: Testing best practices
- **security.mdc**: Security guidelines
- **taskmaster/**: Taskmaster workflow rules

### Rule Locations
- Rules apply based on `globs` patterns
- Check rule files for specific patterns
- Rules with `alwaysApply: true` apply everywhere

---

## 🔧 Configuration Files

- **`.cursor/mcp.json`**: MCP server configuration
- **`.cursor/rules/*.mdc`**: Rule files
- **`mcp-server/`**: Custom MCP server source
- **`docs/CURSOR_OPTIMIZATION_GUIDE.md`**: Full documentation

---

## ⚡ Quick Commands

### Check MCP Server Status
```bash
# Validate configuration
./scripts/validate-cursor-config.sh

# List configured servers
jq '.mcpServers | keys' .cursor/mcp.json
```

### Update Rules
1. Edit `.cursor/rules/*.mdc` files
2. Restart Cursor IDE
3. Rules apply automatically

### Add New MCP Server
1. Edit `.cursor/mcp.json`
2. Add server configuration
3. Restart Cursor IDE

---

## 🐛 Troubleshooting

### MCP Server Not Working
1. Check JSON syntax: `jq . .cursor/mcp.json`
2. Verify paths are absolute and correct
3. Check API keys are set (not placeholders)
4. Restart Cursor IDE

### Rules Not Applying
1. Check `globs` patterns match your files
2. Verify frontmatter syntax
3. Restart Cursor IDE

### Custom MCP Server Issues
1. Build server: `cd mcp-server && npm run build`
2. Verify `dist/index.js` exists
3. Check path in `.cursor/mcp.json` is absolute

---

## 📖 Full Documentation

- **Optimization Guide**: `docs/CURSOR_OPTIMIZATION_GUIDE.md`
- **Taskmaster Docs**: `.cursor/rules/taskmaster/taskmaster.mdc`
- **Summary**: `.cursor/OPTIMIZATION_SUMMARY.md`

---

**Last Updated**: January 2025

