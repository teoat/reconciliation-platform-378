# MCP Server Implementation Guide

**Date**: 2025-01-XX  
**Status**: In Progress - Priority 1 Servers Configured  
**Location**: `.cursor/mcp.json`

---

## ✅ Implementation Status

### Priority 1: Core Infrastructure (✅ Configured)
- [x] **Filesystem MCP** - Configured for `/Users/Arief/Desktop/378`
- [x] **PostgreSQL MCP** - Configured (connection string needed)
- [x] **Git MCP** - Configured for repository at `/Users/Arief/Desktop/378`
- [x] **Docker MCP** - Configured (Unix socket)

### Priority 2: Development Tools (✅ Configured)
- [x] **GitHub MCP** - Configured (token needed)
- [x] **Brave Search MCP** - Configured (API key needed)
- [x] **Prometheus MCP** - Configured (defaults to localhost:9090)

---

## 🔧 Configuration Requirements

### Required API Keys & Tokens

1. **GitHub Personal Access Token**
   - Location: GitHub Settings → Developer settings → Personal access tokens
   - Permissions: `repo`, `read:org` (minimal required scopes)
   - Update in: `.cursor/mcp.json` → `GITHUB_PERSONAL_ACCESS_TOKEN`

2. **Brave Search API Key**
   - Location: https://brave.com/search/api/
   - Update in: `.cursor/mcp.json` → `BRAVE_API_KEY`

3. **PostgreSQL Connection String**
   - Format: `postgresql://user:password@localhost:5432/dbname`
   - Update in: `.cursor/mcp.json` → `POSTGRES_CONNECTION_STRING`

---

## 🚀 Quick Start

### 1. Verify MCP Server Installation

The servers will auto-install via `npx` when first used. To verify:

```bash
# Test Filesystem MCP
npx -y @modelcontextprotocol/server-filesystem --help

# Test PostgreSQL MCP
npx -y @modelcontextprotocol/server-postgres --help

# Test Git MCP
npx -y @modelcontextprotocol/server-git --help
```

### 2. Update Configuration Values

Edit `.cursor/mcp.json` and replace placeholder values:

```json
{
  "POSTGRES_CONNECTION_STRING": "postgresql://your_user:your_password@localhost:5432/reconciliation_db",
  "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here",
  "BRAVE_API_KEY": "your_brave_api_key_here"
}
```

### 3. Restart IDE

After configuration changes, restart Cursor/IDE to load new MCP servers.

---

## 📋 MCP Server Capabilities

### Filesystem MCP
- **Purpose**: Navigate and manage 3,655 files efficiently
- **Capabilities**:
  - List directories and files
  - Read file contents
  - Search files by pattern
  - Get file metadata
- **Use Cases**:
  - "List all TypeScript files in frontend/src"
  - "Find all files larger than 500 lines"
  - "Show structure of backend/src/services"

### PostgreSQL MCP
- **Purpose**: Direct database operations
- **Capabilities**:
  - Query database schema
  - Execute SQL queries
  - Analyze indexes
  - Validate migrations
- **Use Cases**:
  - "Show all indexes in the database"
  - "List all tables in the schema"
  - "Analyze slow queries"

### Git MCP
- **Purpose**: Version control operations
- **Capabilities**:
  - Git operations (commit, push, pull, merge)
  - Branch management
  - Diff analysis
  - History exploration
- **Use Cases**:
  - "Show diff for last commit"
  - "List all branches"
  - "Create feature branch for reconciliation"

### Docker MCP
- **Purpose**: Container management
- **Capabilities**:
  - Container lifecycle management
  - Image operations
  - Compose orchestration
  - Log analysis
- **Use Cases**:
  - "Start all Docker Compose services"
  - "Show logs for backend container"
  - "Check container resource usage"

### GitHub MCP
- **Purpose**: Issue tracking and PR management
- **Capabilities**:
  - Issue management
  - Pull request operations
  - Repository analytics
  - Release management
- **Use Cases**:
  - "Create issue for technical debt"
  - "List open pull requests"
  - "Show repository statistics"

### Brave Search MCP
- **Purpose**: Research and documentation
- **Capabilities**:
  - Web search
  - Technology research
  - Best practice discovery
  - Troubleshooting assistance
- **Use Cases**:
  - "Search for Actix-Web 4.4 best practices"
  - "Find React 18 performance tips"
  - "Research TypeScript 5.2 features"

### Prometheus MCP
- **Purpose**: Performance monitoring
- **Capabilities**:
  - Query Prometheus metrics
  - Analyze performance trends
  - Alert management
  - Dashboard data
- **Use Cases**:
  - "Query API response time metrics"
  - "Show error rate trends"
  - "Analyze database connection pool usage"

---

## 🧪 Testing MCP Servers

### Test Filesystem MCP
```
Ask IDE: "List all files in frontend/src/services"
Expected: Directory listing of services folder
```

### Test Git MCP
```
Ask IDE: "Show current git branch"
Expected: Current branch name
```

### Test PostgreSQL MCP (after connection string configured)
```
Ask IDE: "List all tables in the database"
Expected: Table listing from PostgreSQL
```

### Test Docker MCP
```
Ask IDE: "List all running containers"
Expected: Container list from Docker
```

---

## 🔒 Security Best Practices

1. **Never Commit Secrets**
   - Add `.cursor/mcp.json` to `.gitignore` (if not already)
   - Use environment variables for sensitive values

2. **Use Minimal Permissions**
   - GitHub token: Only required scopes
   - PostgreSQL: Use read-only user when possible
   - Filesystem: Restricted to project directory

3. **Rotate Keys Regularly**
   - Update API keys quarterly
   - Revoke unused tokens immediately

---

## 📚 Documentation

- **MCP Official Docs**: https://modelcontextprotocol.io/
- **MCP Server Registry**: https://github.com/modelcontextprotocol/servers
- **This Guide**: `MCP_IMPLEMENTATION_GUIDE.md`
- **Full Proposal**: `docs/MCP_SERVER_PROPOSAL.md`

---

## 🆘 Troubleshooting

### MCP Server Not Loading
1. Check `npx` is available: `which npx`
2. Verify package name is correct
3. Check IDE logs for errors
4. Try manual install: `npm install -g @modelcontextprotocol/server-filesystem`

### Connection Issues
1. **PostgreSQL**: Verify connection string format and database is running
2. **Docker**: Ensure Docker daemon is running (`docker ps`)
3. **GitHub**: Verify token has correct permissions

### Performance Issues
1. Large file operations: Use Filesystem MCP filters
2. Database queries: Add timeouts in queries
3. Docker operations: Monitor container resources

---

## ✅ Next Steps

1. [ ] Update all API keys and connection strings
2. [ ] Test each MCP server with basic operations
3. [ ] Create team documentation
4. [ ] Train team on MCP capabilities
5. [ ] Monitor usage and optimize configuration

---

**Last Updated**: 2025-01-XX  
**Maintainer**: Development Team

