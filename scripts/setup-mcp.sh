#!/bin/bash
# scripts/setup-mcp.sh
# Generates or updates the .cursor/mcp.json configuration for the IDE agent.

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Setting up MCP configuration...${NC}"

MCP_CONFIG_DIR=".cursor"
MCP_CONFIG_FILE="${MCP_CONFIG_DIR}/mcp.json"
MCP_SERVER_PATH="mcp-server/dist/index.js" # Path to the custom Node.js MCP server

# Ensure the .cursor directory exists
mkdir -p "${MCP_CONFIG_DIR}"

# Get the absolute path to the project root
PROJECT_ROOT="$(pwd)"

# Construct the mcp.json content
cat > "${MCP_CONFIG_FILE}" << EOF
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${PROJECT_ROOT}"],
      "env": {}
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@ahmetkca/mcp-server-postgres", "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"],
      "env": {}
    },
    "prometheus": {
      "command": "npx",
      "args": ["-y", "@wkronmiller/prometheus-mcp-server"],
      "env": {
        "PROMETHEUS_URL": "http://localhost:9090",
        "PROMETHEUS_TIMEOUT": "10000",
        "PROMETHEUS_RETRIES": "3"
      }
    },
    "reconciliation-platform": {
      "command": "node",
      "args": ["${PROJECT_ROOT}/${MCP_SERVER_PATH}"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app",
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "PROJECT_ROOT": "${PROJECT_ROOT}"
      }
    },
    "agent-coordination": {
      "command": "node",
      "args": ["${PROJECT_ROOT}/mcp-server/dist/agent-coordination.js"],
      "env": {
        "NODE_ENV": "development",
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "COORDINATION_TTL": "3600",
        "PROJECT_ROOT": "${PROJECT_ROOT}"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {}
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {}
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {}
    }
  }
}
EOF

echo -e "${GREEN}✅ MCP configuration generated at ${MCP_CONFIG_FILE}${NC}"
echo -e "${BLUE}Please restart your IDE to apply the new configuration.${NC}"
