# Quick Start Guide - 378 Reconciliation Platform

**Version**: 1.0.0
**Last Updated**: January 2025
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Setup (Recommended)](#docker-setup-recommended)
3. [Local Development Setup](#local-development-setup)
4. [Post-Setup Commands](#post-setup-commands)
5. [Troubleshooting](#troubleshooting)
6. [MCP Server Setup (Optional)](#mcp-server-setup-optional)
7. [Verification](#verification)

---

## 🔧 Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **Docker & Docker Compose**: Latest stable version
- **Git**: Latest version
- **Rust**: 1.70+ (for local backend development)

### Verify Prerequisites

```bash
# Check Node.js
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher

# Check Docker
docker --version
docker compose version

# Check Git
git --version
```

---

## 🐳 Docker Setup (Recommended)

### Quick Start with Docker

```bash
# 1. Clone repository
git clone <repository-url>
cd 378

# 2. Copy environment file
cp env.example .env

# 3. Start all services
docker-compose up --build -d

# 4. Access the application
# Frontend: http://localhost:1000
# Backend: http://localhost:2000
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000
```

### Default Credentials

- **Database**: `postgres` / `postgres_pass`
- **Redis**: No password required
- **Grafana**: `admin` / `admin`

### Health Checks

```bash
# Backend health
curl http://localhost:2000/health

# Backend readiness
curl http://localhost:2000/ready
```

---

## 💻 Local Development Setup

### Backend Setup (Rust)

```bash
# Navigate to backend
cd backend

# Install dependencies
cargo build

# Run backend
cargo run
```

### Frontend Setup (Node.js)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Full Local Development

```bash
# Terminal 1: Backend
cd backend && cargo run

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Database (if not using Docker)
# Ensure PostgreSQL and Redis are running locally
```

---

## 🚀 Post-Setup Commands

After initial setup, use these commands for development:

```bash
# Install/update dependencies
npm install

# Replace console statements (recommended for production)
npm run remove-console-logs:replace

# Build the application
npm run build

# Check bundle size
npm run check-bundle-size

# Run quality checks
npm run quality:check

# Run tests with coverage
npm run test:coverage

# Start development server
npm run dev

# Analyze bundle
npm run analyze-bundle

# Run linting
npm run lint
```

---

## 🔧 Troubleshooting

### Common Issues and Fixes

#### 1. Missing healthCheck Method

**Issue**: `apiClient.healthCheck()` method doesn't exist

**Fix**: The method has been added to the ApiClient class. If you're getting errors, ensure you're using the latest version.

**Code**:

```typescript
async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
  const config = this.requestBuilder.method('GET').skipAuth().noCache().timeout(5000).build();
  return this.makeRequest<{ status: string; timestamp: string }>('/api/health', config);
}
```

#### 2. Missing pkg-dir Dependency

**Issue**: Jest requires `pkg-dir` but it's not in dependencies

**Fix**: This has been added to `package.json`. Run:

```bash
npm install
```

#### 3. ESLint Build Configuration Issues

**Issue**: Next.js build failing with ESLint configuration errors

**Fix**: ESLint is temporarily disabled during builds to avoid config conflicts. Run linting separately:

```bash
npm run lint
```

#### 4. Backend Won't Start

```bash
# Check database connectivity
docker compose ps postgres
docker compose logs postgres

# Check backend logs
docker compose logs backend

# Test health endpoints
curl http://localhost:2000/health
curl http://localhost:2000/ready
```

#### 5. Frontend Won't Load

```bash
# Check container status
docker compose ps frontend
docker compose logs frontend

# Verify API connection
curl http://localhost:2000/health
```

#### 6. Database Connection Issues

```bash
# Check PgBouncer
docker compose ps pgbouncer
docker compose logs pgbouncer

# Direct database test
docker exec -it reconciliation-postgres psql -U postgres -d reconciliation_app
```

#### 7. Build Issues

```bash
# Clear caches
cd frontend && rm -rf node_modules .vite-cache dist
cd backend && cargo clean

# Rebuild
docker compose build --no-cache
```

---

## 🤖 MCP Server Setup (Optional)

The Model Context Protocol (MCP) server enables AI assistant integration for enhanced development workflow.

### Prerequisites Check

```bash
./scripts/comprehensive-diagnostic.sh
```

### Install Node.js (if needed)

```bash
# macOS with Homebrew
brew install node

# Or use helper script
./scripts/install-nodejs.sh

# Verify
node --version  # Should show v18.x.x or higher
```

### Setup MCP Server

```bash
# Make script executable
chmod +x scripts/setup-mcp-server.sh

# Run setup
./scripts/setup-mcp-server.sh
```

### Configure Environment

Edit `mcp-server/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
REDIS_URL=redis://:redis_pass@localhost:6379
PROJECT_ROOT=/Users/Arief/Documents/GitHub/reconciliation-platform-378
BACKEND_URL=http://localhost:2000
```

### Test MCP Server

```bash
cd mcp-server
npm start
# Should see: "Reconciliation Platform MCP Server running on stdio"
# Press Ctrl+C to stop
```

### Configure AI Assistant

#### Claude Desktop (macOS)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reconciliation-platform": {
      "command": "node",
      "args": ["/Users/Arief/Documents/GitHub/reconciliation-platform-378/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app",
        "REDIS_URL": "redis://:redis_pass@localhost:6379",
        "PROJECT_ROOT": "/Users/Arief/Documents/GitHub/reconciliation-platform-378"
      }
    }
  }
}
```

#### Cursor IDE

1. Open Settings (Cmd+,)
2. Search for "MCP" or "Model Context Protocol"
3. Add server configuration similar to Claude Desktop

### Test with AI Assistant

Try asking your AI assistant:

- "Check the status of all Docker containers"
- "Show me the backend health status"
- "What Redis keys are cached?"
- "Read the backend main.rs file"
- "Run diagnostics on the application"

### MCP Troubleshooting

```bash
# Dependencies install failed
cd mcp-server
rm -rf node_modules package-lock.json
npm install

# Build failed
cd mcp-server
npm run build

# Server not starting
# Check .env file and Docker services
```

---

## ✅ Verification

### Test Build

```bash
npm run build
```

**Expected**: Build succeeds without errors

### Test Health Check

```typescript
const response = await apiClient.healthCheck();
if (response.success && response.data) {
  console.log('Health check passed:', response.data);
}
```

### Test Dependencies

```bash
npm list pkg-dir
```

**Expected**: pkg-dir is installed

### Test MCP Server (if configured)

```bash
cd mcp-server && npm start
```

**Expected**: Server starts successfully

---

## 🎯 Next Steps

### Immediate Actions

1. **Install Dependencies**: `npm install`
2. **Test Build**: `npm run build`
3. **Run Tests**: `npm run test:coverage`
4. **Start Development**: `npm run dev`

### Optional Enhancements

1. **Setup MCP Server**: Follow the MCP section above
2. **Run Quality Checks**: `npm run quality:check`
3. **Analyze Bundle**: `npm run analyze-bundle`

### Development Workflow

- Use `npm run dev` for development
- Run `npm run test:coverage` before commits
- Use `npm run quality:check` for code quality
- Setup MCP server for AI-assisted development

---

## 📚 Additional Resources

- **[START_HERE.md](./START_HERE.md)** - Alternative quick start guide
- **[MASTER_DOCUMENTATION.md](./MASTER_DOCUMENTATION.md)** - Complete documentation
- **[MCP_INSTALLATION_GUIDE.md](./MCP_INSTALLATION_GUIDE.md)** - Detailed MCP setup
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment
- **[docs/README.md](./docs/README.md)** - Detailed documentation index

---

**Status**: ✅ **Ready for Development**
**Version**: 1.0.0
**Last Updated**: January 2025</content>
</xai:function_call">Now I'll archive the duplicate quick start files and mark this task as complete. Then move on to the next optimization task.

I'll archive QUICK_START_FIXED.md and QUICK_START_MCP.md since their content has been consolidated into the main QUICK_START.md file. The consolidated version now includes:

- Basic setup instructions
- Troubleshooting section with the fixes from QUICK_START_FIXED.md
- MCP server setup section from QUICK_START_MCP.md
- Comprehensive verification steps
- Additional resources section

This creates a single, comprehensive quick start guide that covers all the essential information from the three separate files.

Let me archive the duplicates and update the todo status.

<xai:function_call name="bash">
<parameter name="command">mv QUICK_START_FIXED.md QUICK_START_MCP.md docs/archive/completion_summaries/
