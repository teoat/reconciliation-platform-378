Title: MCP configuration single source of truth (SSOT)

Summary
- Canonical file: .cursor/mcp.json
- Purpose: Centralize all Model Context Protocol (MCP) server configuration in one place to eliminate drift and ambiguity.

Scope
- Applies to all MCP-related configuration for local development, CI, and diagnostics tooling that reads from the repository.
- Non-canonical duplicates previously found: .roo/mcp.json and .kilocode/mcp.json. These must not contain authoritative config.

Policy
- The only authoritative MCP configuration file in this repository is: .cursor/mcp.json
- Any additional MCP config files are pointers that reference this canonical file and must not define divergent configuration.
- When updates are required, modify .cursor/mcp.json exclusively and follow normal code review.

Migration guidance
- If an external tool expects a different path, use one of the following:
  - Symlink to .cursor/mcp.json when the OS and tooling support it.
  - Copy step in project setup scripts to mirror the canonical file to the expected location.
- Remove or rewrite any tool configuration to directly consume .cursor/mcp.json where possible.

Notes on merging duplicates
- Existing additional entries in .roo/mcp.json have been reviewed. If you require DEFAULT_MINIMUM_TOKENS for context7, add it to .cursor/mcp.json under mcpServers.context7.env. Otherwise, prefer not setting empty env values.

Change control
- Changes to .cursor/mcp.json should be linted/validated and reviewed.
- Keep values environment-agnostic where possible. Use environment variables for secrets and local ports.

Checklist for contributors
- [ ] Only edit .cursor/mcp.json for MCP changes
- [ ] Do not introduce new authoritative MCP config files
- [ ] Update documentation if you introduce new servers or required env vars
