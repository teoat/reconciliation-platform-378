# Centralized Configuration

This directory contains all centralized configuration files for the reconciliation platform.

## Directory Structure

```
config/
├── README.md                 # This file
├── formatting/               # Code formatting configurations
│   └── prettierrc.json       # Prettier configuration
├── linting/                  # Code linting configurations  
│   └── lintstagedrc.json     # Lint-staged configuration
├── mcp/                      # MCP (Model Context Protocol) configurations
│   └── mcp.json              # MCP service configuration
├── tooling/                  # Tooling configurations
│   ├── jscpd.json            # Copy-paste detection configuration
│   └── unimportedrc.json     # Unused imports detection configuration
└── *.env.example             # Environment variable templates
```

## Environment Files

- `dev.env.example` - Development environment template
- `production.env.example` - Production environment template
- `better-auth.env.example` - Better Auth configuration template
- `root.env.example` - Root-level environment template

## Backward Compatibility

All configuration files have symlinks in their original locations for backward compatibility:

| Original Location | Points To |
|-------------------|-----------|
| `.prettierrc.json` | `config/formatting/prettierrc.json` |
| `.lintstagedrc.json` | `config/linting/lintstagedrc.json` |
| `.jscpd.json` | `config/tooling/jscpd.json` |
| `.unimportedrc.json` | `config/tooling/unimportedrc.json` |
| `.cursor/mcp.json` | `config/mcp/mcp.json` |

## Usage

### Editing Configuration

Edit the files in the `config/` directory. Changes will be reflected in the symlinked locations.

```bash
# Edit Prettier configuration
vim config/formatting/prettierrc.json

# Edit lint-staged configuration
vim config/linting/lintstagedrc.json
```

### Environment Setup

Copy the appropriate environment template to the project root:

```bash
# For development
cp config/dev.env.example .env

# For production
cp config/production.env.example .env
```
