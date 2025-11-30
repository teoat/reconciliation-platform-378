# MCP Configuration

## Single Source of Truth

The canonical configuration file for the Model Context Protocol (MCP) server is located at `/.cursor/mcp.json`. This file is the single source of truth for all MCP-related settings used in local development and for powering integrated tooling.

Other `mcp.json` files in directories like `.roo/` or `.kilocode/` are deprecated and should not be used. They exist only as pointers to the canonical file to prevent tool errors.

## Overview

The `mcp.json` file defines the servers that the MCP client can connect to. Each server entry specifies:
- `command`: The command to execute to start the server (e.g., `node`, `npx`).
- `args`: An array of arguments to pass to the command.
- `env`: An object containing environment variables required by the server.

This configuration is critical for ensuring that development tools have access to the necessary backend services, databases, and other resources. Any changes to local development services should be reflected in this file.