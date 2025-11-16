# Cursor IDE Optimization Guide

**Last Updated**: January 2025  
**Status**: ✅ Optimized Configuration

---

## 📋 Overview

This guide documents the optimized Cursor IDE configuration for the Reconciliation Platform, including MCP servers, rules, and tools setup.

---

## 🔧 MCP Servers Configuration

### Current Active Servers

1. **filesystem** - File system operations
   - **Status**: ✅ Active (Path Fixed)
   - **Path**: `/Users/Arief/Documents/GitHub/reconciliation-platform-378`
   - **Note**: Previously pointing to wrong directory, now corrected

2. **postgres** - PostgreSQL database operations
   - **Status**: ✅ Active
   - **Connection**: `postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app`

3. **git** - Git repository operations
   - **Status**: ✅ Active (Path Fixed)
   - **Repository**: `/Users/Arief/Documents/GitHub/reconciliation-platform-378`

4. **docker** - Docker container management
   - **Status**: ✅ Active
   - **Socket**: `unix:///var/run/docker.sock`

5. **github** - GitHub API integration
   - **Status**: ⚠️ Requires API Token
   - **Token**: Set `GITHUB_PERSONAL_ACCESS_TOKEN` in `.cursor/mcp.json`

6. **brave-search** - Web search capabilities
   - **Status**: ⚠️ Requires API Key
   - **Key**: Set `BRAVE_API_KEY` in `.cursor/mcp.json`

7. **prometheus** - Metrics and monitoring
   - **Status**: ✅ Active
   - **URL**: `http://localhost:9090`

8. **reconciliation-platform** - Custom MCP server
   - **Status**: ⚠️ Requires Build
   - **Location**: `mcp-server/`
   - **Build Command**: `cd mcp-server && npm install && npm run build`

9. **sqlite** - SQLite database operations
    - **Status**: ✅ Active (Optional)
    - **DB Path**: `./data/reconciliation.db`

10. **puppeteer** - Browser automation
    - **Status**: ✅ Active
    - **Use Case**: E2E testing, screenshots, PDF generation

---

## 🛠️ Setup Instructions

### 1. Build Custom MCP Server

```bash
cd mcp-server
npm install
npm run build
```

### 2. Configure API Keys

Edit `.cursor/mcp.json` and replace placeholder values:

```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      }
    },
    "brave-search": {
      "env": {
        "BRAVE_API_KEY": "BSA_..."
      }
    }
  }
}
```

### 3. Restart Cursor IDE

After making changes to `.cursor/mcp.json`, restart Cursor IDE to load the new configuration.

---

## 📚 Rules Structure

### Current Rules

1. **cursor_rules.mdc** (52 lines)
   - Rule formatting guidelines
   - File reference patterns
   - Code example standards

2. **self_improve.mdc** (72 lines)
   - Rule improvement triggers
   - Pattern recognition guidelines
   - Continuous improvement process

### Rule Optimization Tips

1. **Keep Rules Focused**: Each rule should cover one specific area
2. **Use Examples**: Include real code examples from the codebase
3. **Cross-Reference**: Link related rules using `[filename](mdc:path)`
4. **Regular Updates**: Update rules when patterns change
5. **Avoid Duplication**: Reference other rules instead of repeating content

---

## 🎯 Project-Specific Patterns

### Rust Backend Patterns

- **Error Handling**: Use `AppError` enum with `AppResult<T>`
- **Database**: Diesel ORM for queries, SQLx for migrations
- **Async**: Actix-Web 4.4 with async/await patterns
- **Logging**: Structured JSON logging with PII masking
- **Middleware**: Custom middleware for auth, logging, CORS

### TypeScript/React Frontend Patterns

- **State Management**: Redux Toolkit with unified store
- **Type Safety**: TypeScript 5.2 strict mode
- **Styling**: Tailwind CSS with component-based design
- **API Calls**: Static service classes (check pattern consistency)
- **Routing**: React Router + Next.js App Router hybrid

---

## 🔍 Troubleshooting

### MCP Server Not Starting

1. **Check Node Version**: Requires Node.js 18+
2. **Verify Paths**: Ensure all paths are absolute and correct
3. **Check Build**: Custom MCP server must be built first
4. **Review Logs**: Check Cursor IDE logs for errors

### Rules Not Applying

1. **Check File Paths**: Verify `globs` patterns match your files
2. **Restart IDE**: Rules are loaded on startup
3. **Check Syntax**: Ensure proper markdown frontmatter
4. **Verify alwaysApply**: Some rules only apply to specific files

### API Key Issues

1. **Environment Variables**: Keys must be in `.cursor/mcp.json` `env` section
2. **No Placeholders**: Replace all `YOUR_*_KEY_HERE` values
3. **Valid Keys**: Ensure keys are active and have correct permissions
4. **Restart Required**: Changes require IDE restart

---

## 📊 Performance Optimization

### MCP Server Performance

1. **Lazy Loading**: Only enable servers you actively use
2. **Connection Pooling**: Database servers use connection pools
3. **Caching**: Filesystem and git servers cache results
4. **Rate Limiting**: External APIs (GitHub, Brave) respect rate limits

### Rules Performance

1. **Specific Globs**: Use specific file patterns, not `**/*`
2. **Avoid Redundancy**: Don't duplicate rules across files
3. **Efficient Patterns**: Use targeted rules instead of broad ones
4. **Regular Cleanup**: Remove outdated or unused rules

---

## 🚀 Recommended Additions

### Optional MCP Servers

1. **slack** - Slack integration for notifications
2. **linear** - Linear issue tracking integration
3. **notion** - Notion database access
4. **memory** - Persistent memory for conversations
5. **fetch** - HTTP request capabilities

### Additional Rules to Consider

1. **rust_patterns.mdc** - Rust-specific coding patterns
2. **typescript_patterns.mdc** - TypeScript/React patterns
3. **testing.mdc** - Testing guidelines and patterns
4. **security.mdc** - Security best practices
5. **performance.mdc** - Performance optimization patterns

---

## 📝 Maintenance Checklist

- [ ] All MCP server paths are correct and absolute
- [ ] API keys are set (not placeholders)
- [ ] Custom MCP server is built and working
- [ ] Rules are up-to-date with current codebase patterns
- [ ] No duplicate or conflicting rules
- [ ] All rules have proper frontmatter
- [ ] Cross-references between rules are valid
- [ ] Examples in rules match actual codebase

---

## 🔗 Related Documentation

- [MCP Server Proposal](docs/MCP_SERVER_PROPOSAL.md)
- [Master Documentation](MASTER_DOCUMENTATION.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

## 💡 Tips for Maximum Efficiency

1. **Custom MCP Server**: Build and use the custom reconciliation-platform server for project-specific operations
2. **Rule Examples**: Always include real code examples from your codebase
3. **Regular Updates**: Review and update rules quarterly or after major refactors
4. **Selective Servers**: Only enable MCP servers you actually use to reduce overhead
5. **Code Organization**: Follow SSOT principles and code organization rules

---

**Last Review**: January 2025  
**Next Review**: April 2025

