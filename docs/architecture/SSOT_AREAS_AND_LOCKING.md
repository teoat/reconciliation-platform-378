# SSOT Areas and File Locking System

**Last Updated**: November 2025  
**Status**: ✅ Active  
**Version**: 1.0.0

---

## Overview

This document defines all areas where Single Source of Truth (SSOT) principles are applied, and how file locking via agent coordination prevents conflicts when multiple agents work on SSOT files.

---

## SSOT Areas

### 1. **Passwords and Secrets** 🔐

**SSOT Location**: `.env` file (git-ignored)

**Files**:
- `.env` - Active configuration (SSOT)
- `.env.example` - Template (reference only)
- `env.consolidated` - Legacy consolidated file (deprecated)

**Management**:
- Use `scripts/manage-passwords.sh` for all password operations
- All Docker services read from `.env`
- All MCP servers read from `.env`
- Backend reads from `.env` via `SecretsService`

**Locking**: Required before editing `.env`

---

### 2. **Configuration Files** ⚙️

**SSOT Locations**:

#### Frontend Configuration
- **SSOT**: `frontend/src/config/AppConfig.ts`
- **Deprecated**: `frontend/src/config/index.ts`
- **Exports**: `APP_CONFIG`, `API_ENDPOINTS`, `WEBSOCKET_EVENTS`

#### Backend Configuration
- **SSOT**: `backend/src/config/mod.rs`
- **Sub-configs**:
  - `backend/src/config/email_config.rs`
  - `backend/src/config/monitoring.rs`
  - `backend/src/config/billing_config.rs`
  - `backend/src/config/shard_config.rs`

#### Docker Configuration
- **SSOT**: `docker-compose.yml` (production)
- **Variants** (for specific use cases):
  - `docker-compose.base.yml` - Base configuration
  - `docker-compose.staging.yml` - Staging environment
  - `docker-compose.dev.yml` - Development
  - `docker-compose.test.yml` - Testing
  - `docker-compose.monitoring.yml` - Monitoring stack
  - `docker-compose.optimized.yml` - Optimized build
  - `docker-compose.fast.yml` - Fast development
  - `docker-compose.simple.yml` - Minimal setup
  - `docker-compose.backend.yml` - Backend only

**Locking**: Required before editing any config file

---

### 3. **Type Definitions** 📝

**SSOT Locations**:

#### Frontend Types
- **SSOT**: `frontend/src/types/backend-aligned.ts` - Backend-aligned types
- **SSOT**: `frontend/src/types/index.ts` - Type exports (re-exports only)
- **Feature Types**:
  - `frontend/src/types/auth.ts`
  - `frontend/src/types/service.ts`
  - `frontend/src/types/forms.ts`
  - `frontend/src/types/ingestion/index.ts`

**Rules**:
- All backend-aligned types MUST be in `backend-aligned.ts`
- `index.ts` only re-exports, no new definitions
- Feature-specific types in their respective files

**Locking**: Required before editing type definitions

---

### 4. **API Endpoints** 🌐

**SSOT Locations**:

#### Frontend API Endpoints
- **SSOT**: `frontend/src/config/AppConfig.ts` (API_ENDPOINTS)
- **Legacy**: `constants/index.ts` (being phased out)

#### Backend API Routes
- **SSOT**: `backend/src/handlers/mod.rs` - Route configuration
- **Handler Modules**: Each handler module defines its routes

**Consistency Rules**:
- Frontend endpoints must match backend routes
- Use `/api/v1/` prefix for versioned endpoints
- Document breaking changes

**Locking**: Required before editing endpoint definitions

---

### 5. **Docker Compose Files** 🐳

**SSOT**: `docker-compose.yml` (production)

**Variants** (for specific environments):
- `docker-compose.base.yml` - Base services
- `docker-compose.staging.yml` - Staging environment
- `docker-compose.dev.yml` - Development
- `docker-compose.test.yml` - Testing
- `docker-compose.monitoring.yml` - Monitoring stack
- `docker-compose.optimized.yml` - Optimized build
- `docker-compose.fast.yml` - Fast development
- `docker-compose.simple.yml` - Minimal setup
- `docker-compose.backend.yml` - Backend only

**Rules**:
- All variants inherit from base
- Production uses `docker-compose.yml`
- Environment-specific overrides only

**Locking**: Required before editing any docker-compose file

---

### 6. **Documentation** 📚

**SSOT Locations**:

#### Architecture Documentation
- **SSOT**: `docs/architecture/SSOT_GUIDANCE.md` - SSOT principles
- **SSOT**: `docs/architecture/SSOT_AREAS_AND_LOCKING.md` - This document
- **SSOT**: `SSOT_LOCK.yml` - SSOT registry

#### Feature Documentation
- **SSOT**: `docs/features/[feature]/` - Feature-specific docs
- **SSOT**: `docs/api/` - API documentation
- **SSOT**: `docs/deployment/` - Deployment guides

**Rules**:
- One document per topic
- Archive outdated docs to `docs/archive/`
- Cross-reference related docs

**Locking**: Required before editing documentation

---

### 7. **Shared Scripts** 🔧

**SSOT Locations**:

- **SSOT**: `scripts/lib/common-functions.sh` - Shared functions
- **Scripts**: `scripts/` - Individual scripts

**Rules**:
- All scripts MUST source `common-functions.sh`
- No duplicate function definitions
- Shared functions in `common-functions.sh` only

**Locking**: Required before editing shared scripts

---

## File Locking System

### Integration with Agent Coordination

The SSOT management system integrates with the Agent Coordination MCP server to provide file locking:

1. **Lock Before Edit**: All SSOT files must be locked before editing
2. **Check Before Lock**: Verify file is not already locked
3. **Release After Edit**: Unlock file after changes complete
4. **TTL**: Locks expire after 1 hour (3600 seconds)

### Locking Workflow

```bash
# 1. Register agent
scripts/manage-ssot.sh lock <file> "Reason for editing"

# 2. Edit file
# ... make changes ...

# 3. Validate changes
scripts/manage-ssot.sh validate <file>

# 4. Unlock file
scripts/manage-ssot.sh unlock <file>
```

### Automatic Locking

The `edit` command automatically handles locking:

```bash
scripts/manage-ssot.sh edit .env
# Automatically:
# - Registers agent
# - Locks file
# - Opens editor
# - Validates after edit
# - Unlocks file
```

---

## SSOT Management Commands

### List SSOT Files

```bash
scripts/manage-ssot.sh list
```

Lists all SSOT files organized by category.

### Check Consistency

```bash
scripts/manage-ssot.sh check
```

Checks for inconsistencies across SSOT files (e.g., password mismatches, endpoint mismatches).

### Validate SSOT File

```bash
scripts/manage-ssot.sh validate <file>
```

Validates syntax of SSOT file (YAML, JSON, TypeScript).

### Edit SSOT File

```bash
scripts/manage-ssot.sh edit <file> [EDITOR]
```

Edits SSOT file with automatic locking/unlocking.

### Lock/Unlock Files

```bash
scripts/manage-ssot.sh lock <file> [REASON]
scripts/manage-ssot.sh unlock <file>
```

Manual lock/unlock operations.

### Create Registry

```bash
scripts/manage-ssot.sh registry
```

Creates JSON registry of all SSOT files with metadata.

---

## Agent Coordination Integration

### Required Agent Capabilities

When working with SSOT files, agents must have:
- `ssot-management` capability
- `file-locking` capability
- `configuration` capability

### Agent Registration

Agents are automatically registered when using SSOT management commands:

```bash
# Agent ID format: ssot-manager-<timestamp>
AGENT_ID="ssot-manager-$(date +%s)"
```

### Lock TTL

- **Default**: 3600 seconds (1 hour)
- **Minimum**: 60 seconds
- **Maximum**: 86400 seconds (24 hours)

### Conflict Detection

Before locking, the system checks for:
- Existing locks by other agents
- Lock expiration
- Agent availability

---

## Best Practices

### 1. Always Lock Before Editing

```bash
# ✅ DO: Lock before editing
scripts/manage-ssot.sh edit .env

# ❌ DON'T: Edit without locking
nano .env  # May conflict with other agents
```

### 2. Check Consistency Regularly

```bash
# Run consistency checks before deployments
scripts/manage-ssot.sh check
```

### 3. Use SSOT Management Scripts

```bash
# ✅ DO: Use management scripts
scripts/manage-passwords.sh set REDIS_PASSWORD new_password
scripts/manage-ssot.sh edit docker-compose.yml

# ❌ DON'T: Edit directly
echo "REDIS_PASSWORD=new" >> .env
```

### 4. Validate After Changes

```bash
# Always validate after editing
scripts/manage-ssot.sh validate <file>
```

### 5. Document SSOT Changes

When adding new SSOT areas:
1. Update `SSOT_LOCK.yml`
2. Update this document
3. Add to `scripts/manage-ssot.sh` categories
4. Create registry entry

---

## SSOT File Registry

The SSOT registry (`SSOT_LOCK.yml`) is the authoritative source for:
- SSOT file locations
- Deprecated paths
- Enforcement rules
- Migration status

**Location**: `SSOT_LOCK.yml` (root)

**Locking**: Required before editing

---

## Related Documentation

- [SSOT Guidance](SSOT_GUIDANCE.md) - Core SSOT principles
- [Agent Coordination](../development/AGENT_COORDINATION_IMPLEMENTATION_COMPLETE.md) - Agent coordination system
- [Password Management](../development/REDIS_AND_TOOLS_CONFIGURATION.md) - Password SSOT system

---

## Maintenance

### Regular Tasks

1. **Weekly**: Run consistency checks
2. **Monthly**: Review SSOT registry
3. **Quarterly**: Audit SSOT file usage
4. **As Needed**: Update SSOT areas when adding new features

### Adding New SSOT Areas

1. Identify the SSOT location
2. Update `SSOT_LOCK.yml`
3. Add to `scripts/manage-ssot.sh` categories
4. Update this document
5. Create validation rules if needed

---

## Deep Diagnostic System

### Overview

The SSOT system includes comprehensive diagnostic capabilities to ensure proper synchronization, detect inconsistencies, and monitor integration health across all systems.

### Diagnostic Levels

#### Level 1: File-Level Diagnostics

**Purpose**: Validate individual SSOT files

**Checks**:
- File existence and accessibility
- Syntax validation (YAML, JSON, TypeScript)
- Schema compliance
- Lock status
- Last modification time
- File size and integrity

**Command**:
```bash
scripts/manage-ssot.sh diagnose file <SSOT_FILE>
```

**Output**:
```json
{
  "file": ".env",
  "exists": true,
  "readable": true,
  "writable": true,
  "size": 2048,
  "modified": "2025-11-26T14:30:00Z",
  "locked": false,
  "syntax_valid": true,
  "schema_compliant": true,
  "issues": []
}
```

#### Level 2: Category-Level Diagnostics

**Purpose**: Validate all files in a SSOT category

**Checks**:
- All files in category exist
- Consistency across category files
- Cross-file references valid
- No duplicate definitions

**Command**:
```bash
scripts/manage-ssot.sh diagnose category <CATEGORY>
```

**Categories**:
- `passwords` - Password and secret files
- `config` - Configuration files
- `types` - Type definition files
- `api` - API endpoint definitions
- `docker` - Docker compose files
- `documentation` - Documentation files
- `scripts` - Shared scripts

#### Level 3: System-Level Diagnostics

**Purpose**: Validate entire SSOT system integration

**Checks**:
- MCP server connectivity
- Redis connection status
- Agent coordination availability
- Docker service synchronization
- Backend/frontend config alignment
- Cross-system consistency

**Command**:
```bash
scripts/manage-ssot.sh diagnose system
```

---

### MCP Integration Diagnostics

#### MCP Server Health Checks

**Checks**:
- MCP server process status
- Redis connection (for coordination servers)
- Tool availability
- Response times
- Error rates

**Command**:
```bash
scripts/manage-ssot.sh diagnose mcp [SERVER_NAME]
```

**MCP Servers Monitored**:
- `reconciliation-platform` - Main platform tools
- `agent-coordination` - Agent coordination
- `postgres` - Database queries
- `prometheus` - Monitoring
- `filesystem` - File operations
- `sequential-thinking` - Problem solving
- `memory` - Knowledge graph

**Health Check Output**:
```json
{
  "server": "agent-coordination",
  "status": "healthy",
  "redis_connected": true,
  "tools_available": 18,
  "response_time_ms": 45,
  "last_check": "2025-11-26T14:30:00Z",
  "errors": []
}
```

#### MCP Synchronization Status

**Checks**:
- File lock synchronization across agents
- Task coordination status
- Conflict detection accuracy
- Lock expiration handling

**Command**:
```bash
scripts/manage-ssot.sh diagnose sync
```

---

### Redis Integration Diagnostics

#### Redis Connection Health

**Checks**:
- Connection status
- Authentication
- Response time
- Memory usage
- Key count
- Lock key patterns

**Command**:
```bash
scripts/manage-ssot.sh diagnose redis
```

**Output**:
```json
{
  "connected": true,
  "authenticated": true,
  "response_time_ms": 2,
  "memory_used_mb": 128,
  "total_keys": 1543,
  "lock_keys": 12,
  "task_keys": 8,
  "agent_keys": 3,
  "health": "healthy"
}
```

#### Redis Lock Synchronization

**Checks**:
- Active file locks
- Lock expiration times
- Orphaned locks
- Lock conflicts

**Command**:
```bash
scripts/manage-ssot.sh diagnose locks
```

---

### Docker Integration Diagnostics

#### Docker Service Synchronization

**Checks**:
- Container status
- Environment variable consistency
- Password synchronization
- Service health

**Command**:
```bash
scripts/manage-ssot.sh diagnose docker
```

**Services Checked**:
- `reconciliation-redis` - Redis service
- `reconciliation-postgres` - Database service
- `reconciliation-backend` - Backend API
- `reconciliation-frontend` - Frontend app

**Output**:
```json
{
  "services": {
    "reconciliation-redis": {
      "status": "running",
      "health": "healthy",
      "env_synced": true,
      "password_match": true
    },
    "reconciliation-postgres": {
      "status": "running",
      "health": "healthy",
      "env_synced": true,
      "password_match": true
    }
  },
  "overall_health": "healthy"
}
```

---

### Backend/Frontend Synchronization

#### Configuration Alignment

**Checks**:
- API endpoint consistency
- Type definition alignment
- Environment variable usage
- Config value synchronization

**Command**:
```bash
scripts/manage-ssot.sh diagnose alignment
```

**Checks Performed**:
- Frontend `API_ENDPOINTS` vs Backend routes
- Type definitions match between frontend/backend
- Environment variables used consistently
- Config values synchronized

---

## Synchronization Mechanisms

### Real-Time Synchronization

#### File Change Detection

The SSOT system monitors file changes and automatically synchronizes across systems:

**Monitoring Methods**:
- File system watchers (inotify on Linux, FSEvents on macOS)
- Git hooks (pre-commit, post-commit)
- Periodic checks (every 30 seconds)
- Manual sync triggers

**Synchronization Flow**:
```
File Change Detected
    ↓
Validate Change (syntax, schema)
    ↓
Check for Locks
    ↓
Lock File (if not locked)
    ↓
Apply Change
    ↓
Sync to Dependent Systems:
    - Docker services (restart if needed)
    - MCP servers (reload config)
    - Backend (restart if needed)
    - Frontend (rebuild if needed)
    ↓
Unlock File
    ↓
Log Synchronization
```

#### Automatic Sync Triggers

**When Changes Are Detected**:

1. **`.env` Changes**:
   - Sync to Docker containers (restart services)
   - Update MCP server environment
   - Reload backend configuration
   - Clear frontend cache

2. **Config File Changes**:
   - Validate syntax
   - Check for breaking changes
   - Update dependent systems
   - Rebuild if necessary

3. **Type Definition Changes**:
   - Validate TypeScript compilation
   - Check frontend/backend alignment
   - Update type exports
   - Trigger type checking

**Command**:
```bash
scripts/manage-ssot.sh sync [FILE]
```

---

### Cross-System Synchronization

#### MCP Server Synchronization

**Synchronization Points**:

1. **Agent Coordination Server**:
   - File locks synchronized via Redis
   - Task assignments shared across agents
   - Status updates broadcast to all agents

2. **Reconciliation Platform Server**:
   - Configuration changes trigger reload
   - Health checks synchronized
   - Tool availability updated

3. **Postgres Server**:
   - Connection string updates
   - Query cache invalidation
   - Schema change notifications

**Sync Status Check**:
```bash
scripts/manage-ssot.sh sync status
```

**Output**:
```json
{
  "mcp_servers": {
    "agent-coordination": {
      "synced": true,
      "last_sync": "2025-11-26T14:30:00Z",
      "pending_changes": 0
    },
    "reconciliation-platform": {
      "synced": true,
      "last_sync": "2025-11-26T14:30:00Z",
      "pending_changes": 0
    }
  },
  "overall_status": "synchronized"
}
```

#### Docker Service Synchronization

**Synchronization Process**:

1. **Environment Variable Sync**:
   ```bash
   # Read from .env
   source .env
   
   # Update docker-compose.yml
   # Restart affected services
   docker-compose up -d --force-recreate [service]
   ```

2. **Password Synchronization**:
   - Extract passwords from `.env`
   - Update Docker service environment
   - Restart services with new passwords
   - Verify service health

3. **Configuration Sync**:
   - Update docker-compose.yml
   - Validate YAML syntax
   - Apply changes
   - Restart services

**Command**:
```bash
scripts/manage-ssot.sh sync docker
```

#### Backend/Frontend Synchronization

**Synchronization Areas**:

1. **API Endpoints**:
   - Frontend `API_ENDPOINTS` must match backend routes
   - Version consistency
   - Parameter alignment

2. **Type Definitions**:
   - Backend types → Frontend `backend-aligned.ts`
   - Type exports synchronized
   - Breaking changes detected

3. **Configuration**:
   - Environment variables aligned
   - Feature flags synchronized
   - API URLs consistent

**Validation Command**:
```bash
scripts/manage-ssot.sh sync validate
```

---

### Conflict Resolution

#### Lock Conflicts

**Detection**:
- Check Redis for existing locks
- Verify lock expiration
- Identify conflicting agents

**Resolution**:
1. **Wait and Retry**: If lock expires soon (< 5 minutes)
2. **Notify Agent**: Send notification to locking agent
3. **Force Unlock**: If agent is unresponsive (after timeout)
4. **Queue Request**: Add to lock queue

**Command**:
```bash
scripts/manage-ssot.sh sync resolve <FILE>
```

#### Configuration Conflicts

**Detection**:
- Compare `.env` with docker-compose.yml
- Check MCP server configs
- Validate backend/frontend alignment

**Resolution**:
1. **Identify Source of Truth**: `.env` is always SSOT
2. **Propagate Changes**: Update all dependent systems
3. **Validate**: Run consistency checks
4. **Log Resolution**: Document conflict and resolution

---

### Health Monitoring Integration

#### Continuous Health Checks

**Monitoring Frequency**:
- **File System**: Every 30 seconds
- **MCP Servers**: Every 60 seconds
- **Docker Services**: Every 120 seconds
- **Redis**: Every 30 seconds
- **Backend/Frontend**: Every 60 seconds

**Health Check Command**:
```bash
scripts/manage-ssot.sh health [COMPONENT]
```

**Components**:
- `all` - All components (default)
- `files` - SSOT files
- `mcp` - MCP servers
- `docker` - Docker services
- `redis` - Redis connection
- `sync` - Synchronization status

#### Health Metrics

**Tracked Metrics**:
- File lock count
- Sync latency
- Error rates
- Conflict frequency
- System availability

**Metrics Export**:
```bash
scripts/manage-ssot.sh health metrics
```

**Output Format**: Prometheus-compatible metrics

---

## Advanced Integration Details

### MCP Server Deep Integration

#### Agent Coordination Integration

**Integration Points**:

1. **File Locking**:
   - SSOT files automatically locked via agent coordination
   - Lock status synchronized across all agents
   - Lock expiration handled gracefully

2. **Task Management**:
   - SSOT changes tracked as tasks
   - Task dependencies managed
   - Progress tracking enabled

3. **Conflict Detection**:
   - Automatic conflict detection before changes
   - Agent overlap warnings
   - Coordination suggestions

**Integration Code Example**:
```typescript
// In SSOT management script
const lockResult = await mcp.agent_lock_file({
  file: '.env',
  agentId: 'ssot-manager-123',
  reason: 'Password update',
  ttl: 3600
});

if (lockResult.locked) {
  // Proceed with changes
  await updateEnvFile();
  await mcp.agent_unlock_file({
    file: '.env',
    agentId: 'ssot-manager-123'
  });
}
```

#### Reconciliation Platform Integration

**Integration Points**:

1. **Configuration Reload**:
   - SSOT changes trigger MCP config reload
   - Health checks updated
   - Tool availability refreshed

2. **Redis Synchronization**:
   - Shared Redis connection
   - Cache invalidation coordination
   - Lock key namespace separation

3. **Event Broadcasting**:
   - SSOT changes broadcast to MCP servers
   - Health status updates
   - Error notifications

---

### Redis Deep Integration

#### Lock Management

**Redis Key Structure**:
```
agent:coord:lock:<file_path>     # File locks
agent:coord:task:<task_id>       # Task assignments
agent:coord:status:<agent_id>    # Agent status
agent:coord:conflicts:<agent_id> # Conflict logs
ssot:sync:<file_path>            # Sync status
ssot:health:<component>          # Health checks
```

**Lock Operations**:
```bash
# Set lock with TTL
SET agent:coord:lock:.env '{"agentId":"ssot-1","reason":"Update","expires":1732638000}' EX 3600

# Check lock
GET agent:coord:lock:.env

# Extend lock
EXPIRE agent:coord:lock:.env 3600

# Release lock
DEL agent:coord:lock:.env
```

#### Synchronization State

**State Management**:
- Last sync timestamp per file
- Pending changes queue
- Sync error logs
- Conflict resolution history

**State Commands**:
```bash
# Get sync state
scripts/manage-ssot.sh sync state

# Clear sync state
scripts/manage-ssot.sh sync clear

# View sync history
scripts/manage-ssot.sh sync history
```

---

### Docker Deep Integration

#### Service Lifecycle Management

**Integration Flow**:
```
SSOT Change Detected
    ↓
Identify Affected Services
    ↓
Backup Current State
    ↓
Update Service Configuration
    ↓
Validate Configuration
    ↓
Restart Services (if needed)
    ↓
Verify Service Health
    ↓
Rollback on Failure
```

**Service Management Commands**:
```bash
# Sync and restart specific service
scripts/manage-ssot.sh sync docker redis

# Sync all services
scripts/manage-ssot.sh sync docker all

# Dry-run sync (preview changes)
scripts/manage-ssot.sh sync docker --dry-run
```

#### Environment Variable Propagation

**Propagation Process**:

1. **Extract from .env**:
   ```bash
   source .env
   ```

2. **Update docker-compose.yml**:
   ```yaml
   services:
     redis:
       environment:
         REDIS_PASSWORD: ${REDIS_PASSWORD}
   ```

3. **Apply to Running Containers**:
   ```bash
   docker-compose up -d --force-recreate redis
   ```

4. **Verify**:
   ```bash
   docker exec reconciliation-redis redis-cli -a $REDIS_PASSWORD ping
   ```

---

### Backend Integration

#### Configuration Loading

**Backend SSOT Integration**:

1. **Environment Variables**:
   - Loaded from `.env` via `dotenv`
   - Validated on startup
   - Cached in `Config` struct

2. **Secrets Service**:
   - Single source: Environment variables
   - Validation on access
   - Error handling

3. **Hot Reload** (Development):
   - Watch `.env` for changes
   - Reload configuration
   - Restart affected services

**Integration Code**:
```rust
// backend/src/config/mod.rs
impl Config {
    pub fn from_env() -> Result<Self, AppError> {
        dotenvy::dotenv().ok();
        
        // Validate all required secrets
        SecretsService::validate_required_secrets()?;
        
        // Load configuration
        Ok(Config {
            database_url: SecretsService::get_database_url()?,
            redis_url: SecretsService::get_redis_url()?,
            // ...
        })
    }
}
```

---

### Frontend Integration

#### Configuration Loading

**Frontend SSOT Integration**:

1. **AppConfig.ts**:
   - Single source for all configuration
   - Environment variable reading
   - Type-safe configuration

2. **Build-Time Configuration**:
   - Vite environment variables
   - Build-time validation
   - Type checking

3. **Runtime Configuration**:
   - API endpoint configuration
   - Feature flags
   - Environment detection

**Integration Code**:
```typescript
// frontend/src/config/AppConfig.ts
export const APP_CONFIG = {
  API_URL: getEnvVar('VITE_API_URL', 'http://localhost:2000/api'),
  WS_URL: getEnvVar('VITE_WS_URL', 'ws://localhost:2000'),
  // ...
};
```

---

### Monitoring and Alerting

#### Health Check Integration

**Health Check Endpoints**:

1. **SSOT Health**:
   ```
   GET /api/health/ssot
   ```

2. **Sync Status**:
   ```
   GET /api/health/sync
   ```

3. **MCP Integration**:
   ```
   GET /api/health/mcp
   ```

**Health Check Response**:
```json
{
  "status": "healthy",
  "components": {
    "ssot_files": "healthy",
    "mcp_servers": "healthy",
    "docker_services": "healthy",
    "redis": "healthy",
    "synchronization": "healthy"
  },
  "last_check": "2025-11-26T14:30:00Z"
}
```

#### Alerting Integration

**Alert Triggers**:
- SSOT file inconsistency detected
- Sync failure
- MCP server unavailable
- Redis connection lost
- Docker service unhealthy
- Lock conflict unresolved

**Alert Channels**:
- Log files
- Monitoring dashboard
- Email notifications (optional)
- Slack webhooks (optional)

---

## Diagnostic Tools and Commands Reference

### Comprehensive Diagnostic Commands

#### File-Level Diagnostics

```bash
# Diagnose specific SSOT file
scripts/manage-ssot.sh diagnose file <FILE>

# Examples:
scripts/manage-ssot.sh diagnose file .env
scripts/manage-ssot.sh diagnose file docker-compose.yml
scripts/manage-ssot.sh diagnose file frontend/src/config/AppConfig.ts
```

**Output Includes**:
- File existence and permissions
- Syntax validation
- Schema compliance
- Lock status
- Last modification
- Size and integrity

#### Category-Level Diagnostics

```bash
# Diagnose entire category
scripts/manage-ssot.sh diagnose category <CATEGORY>

# Available categories:
scripts/manage-ssot.sh diagnose category passwords
scripts/manage-ssot.sh diagnose category config
scripts/manage-ssot.sh diagnose category types
scripts/manage-ssot.sh diagnose category api
scripts/manage-ssot.sh diagnose category docker
scripts/manage-ssot.sh diagnose category documentation
scripts/manage-ssot.sh diagnose category scripts
```

**Output Includes**:
- All files in category
- Consistency checks
- Cross-file validation
- Duplicate detection

#### System-Level Diagnostics

```bash
# Full system diagnostic
scripts/manage-ssot.sh diagnose system

# Specific system component
scripts/manage-ssot.sh diagnose system mcp
scripts/manage-ssot.sh diagnose system docker
scripts/manage-ssot.sh diagnose system redis
scripts/manage-ssot.sh diagnose system sync
```

**Output Includes**:
- All SSOT files status
- MCP server health
- Docker service status
- Redis connection status
- Synchronization status
- Overall health score

---

### MCP Integration Diagnostics

#### MCP Server Health

```bash
# All MCP servers
scripts/manage-ssot.sh diagnose mcp

# Specific server
scripts/manage-ssot.sh diagnose mcp agent-coordination
scripts/manage-ssot.sh diagnose mcp reconciliation-platform
scripts/manage-ssot.sh diagnose mcp postgres
```

**Checks Performed**:
- Server process status
- Redis connection (if applicable)
- Tool availability
- Response times
- Error rates
- Last successful operation

#### MCP Synchronization Status

```bash
# Check sync status
scripts/manage-ssot.sh diagnose sync

# Detailed sync report
scripts/manage-ssot.sh diagnose sync --detailed

# Sync history
scripts/manage-ssot.sh diagnose sync --history
```

---

### Redis Integration Diagnostics

#### Redis Connection Health

```bash
# Basic Redis health
scripts/manage-ssot.sh diagnose redis

# Detailed Redis info
scripts/manage-ssot.sh diagnose redis --detailed

# Redis lock status
scripts/manage-ssot.sh diagnose locks

# Redis key analysis
scripts/manage-ssot.sh diagnose redis --keys
```

**Information Provided**:
- Connection status
- Authentication status
- Response time
- Memory usage
- Key statistics
- Lock key patterns
- Task key patterns
- Agent key patterns

---

### Docker Integration Diagnostics

#### Docker Service Status

```bash
# All Docker services
scripts/manage-ssot.sh diagnose docker

# Specific service
scripts/manage-ssot.sh diagnose docker redis
scripts/manage-ssot.sh diagnose docker postgres
scripts/manage-ssot.sh diagnose docker backend
```

**Checks Performed**:
- Container status
- Health check status
- Environment variable sync
- Password synchronization
- Service logs (recent errors)

#### Docker Configuration Sync

```bash
# Check sync status
scripts/manage-ssot.sh sync docker status

# Sync specific service
scripts/manage-ssot.sh sync docker redis

# Dry-run sync
scripts/manage-ssot.sh sync docker --dry-run
```

---

### Synchronization Commands

#### Manual Synchronization

```bash
# Sync all systems
scripts/manage-ssot.sh sync all

# Sync specific system
scripts/manage-ssot.sh sync mcp
scripts/manage-ssot.sh sync docker
scripts/manage-ssot.sh sync backend
scripts/manage-ssot.sh sync frontend

# Sync specific file
scripts/manage-ssot.sh sync file .env
```

#### Sync Status and History

```bash
# Current sync status
scripts/manage-ssot.sh sync status

# Sync history
scripts/manage-ssot.sh sync history

# Sync state (detailed)
scripts/manage-ssot.sh sync state

# Clear sync state
scripts/manage-ssot.sh sync clear
```

---

### Health Monitoring Commands

#### Health Checks

```bash
# All components
scripts/manage-ssot.sh health

# Specific component
scripts/manage-ssot.sh health files
scripts/manage-ssot.sh health mcp
scripts/manage-ssot.sh health docker
scripts/manage-ssot.sh health redis
scripts/manage-ssot.sh health sync
```

#### Health Metrics

```bash
# Export metrics (Prometheus format)
scripts/manage-ssot.sh health metrics

# Metrics for specific component
scripts/manage-ssot.sh health metrics mcp

# Continuous monitoring
scripts/manage-ssot.sh health watch
```

---

### Advanced Diagnostic Options

#### Verbose Output

```bash
# Verbose diagnostic output
scripts/manage-ssot.sh diagnose system --verbose

# Include debug information
scripts/manage-ssot.sh diagnose system --debug
```

#### Output Formats

```bash
# JSON output
scripts/manage-ssot.sh diagnose system --format json

# YAML output
scripts/manage-ssot.sh diagnose system --format yaml

# Human-readable (default)
scripts/manage-ssot.sh diagnose system --format text
```

#### Filtering and Sorting

```bash
# Filter by status
scripts/manage-ssot.sh diagnose system --filter healthy
scripts/manage-ssot.sh diagnose system --filter unhealthy

# Sort by component
scripts/manage-ssot.sh diagnose system --sort component

# Limit output
scripts/manage-ssot.sh diagnose system --limit 10
```

---

### Troubleshooting Commands

#### Conflict Resolution

```bash
# Detect conflicts
scripts/manage-ssot.sh diagnose conflicts

# Resolve specific conflict
scripts/manage-ssot.sh sync resolve <FILE>

# Force unlock (if agent unresponsive)
scripts/manage-ssot.sh unlock <FILE> --force
```

#### Recovery Operations

```bash
# Restore from backup
scripts/manage-ssot.sh restore <FILE>

# Reset sync state
scripts/manage-ssot.sh sync reset

# Clear all locks (emergency)
scripts/manage-ssot.sh unlock all --force
```

---

### Integration Testing Commands

#### Test SSOT Integration

```bash
# Test file locking
scripts/manage-ssot.sh test locks

# Test synchronization
scripts/manage-ssot.sh test sync

# Test MCP integration
scripts/manage-ssot.sh test mcp

# Full integration test
scripts/manage-ssot.sh test all
```

---

## Best Practices for Deep Integration

### SSOT File Management

#### 1. Always Use Management Scripts

```bash
# ✅ DO: Use management scripts
scripts/manage-ssot.sh edit .env
scripts/manage-passwords.sh set REDIS_PASSWORD new_password

# ❌ DON'T: Edit directly
nano .env  # Bypasses locking and validation
```

#### 2. Run Diagnostics Before Changes

```bash
# Check current state
scripts/manage-ssot.sh diagnose system

# Check specific file
scripts/manage-ssot.sh diagnose file .env

# Verify consistency
scripts/manage-ssot.sh check
```

#### 3. Validate After Changes

```bash
# Always validate after editing
scripts/manage-ssot.sh validate <FILE>

# Check consistency
scripts/manage-ssot.sh check

# Verify synchronization
scripts/manage-ssot.sh sync status
```

---

### MCP Integration Best Practices

#### 1. Register Agent Before Operations

```bash
# Automatic registration via scripts
scripts/manage-ssot.sh edit .env  # Auto-registers

# Manual registration if needed
# (handled automatically by scripts)
```

#### 2. Check Lock Status Before Editing

```bash
# Check if file is locked
scripts/manage-ssot.sh diagnose file .env

# Lock before editing
scripts/manage-ssot.sh lock .env "Reason for editing"
```

#### 3. Monitor MCP Server Health

```bash
# Regular health checks
scripts/manage-ssot.sh health mcp

# Monitor continuously
scripts/manage-ssot.sh health watch
```

---

### Synchronization Best Practices

#### 1. Sync After Configuration Changes

```bash
# After editing .env
scripts/manage-ssot.sh sync docker

# After editing config files
scripts/manage-ssot.sh sync all
```

#### 2. Verify Sync Status

```bash
# Check sync status
scripts/manage-ssot.sh sync status

# View sync history
scripts/manage-ssot.sh sync history
```

#### 3. Handle Sync Failures

```bash
# Diagnose sync issues
scripts/manage-ssot.sh diagnose sync

# Retry failed syncs
scripts/manage-ssot.sh sync retry

# Clear sync state if needed
scripts/manage-ssot.sh sync clear
```

---

### Troubleshooting Guide

#### Common Issues and Solutions

##### Issue 1: File Lock Conflicts

**Symptoms**:
- Error: "File is already locked by another agent"
- Cannot edit SSOT file

**Diagnosis**:
```bash
scripts/manage-ssot.sh diagnose locks
```

**Solutions**:
```bash
# Check lock details
scripts/manage-ssot.sh diagnose file <FILE>

# Wait for lock expiration (if soon)
# Or contact locking agent

# Force unlock (if agent unresponsive)
scripts/manage-ssot.sh unlock <FILE> --force
```

##### Issue 2: MCP Server Unavailable

**Symptoms**:
- MCP operations fail
- Agent coordination unavailable
- Redis connection errors

**Diagnosis**:
```bash
scripts/manage-ssot.sh diagnose mcp
scripts/manage-ssot.sh diagnose redis
```

**Solutions**:
```bash
# Check Redis connection
docker ps | grep redis
docker exec reconciliation-redis redis-cli ping

# Restart MCP server
# (if using HTTP bridge)
# Restart agent coordination

# Check Redis password
scripts/manage-ssot.sh diagnose redis
```

##### Issue 3: Configuration Inconsistencies

**Symptoms**:
- Password mismatches
- Endpoint mismatches
- Type definition conflicts

**Diagnosis**:
```bash
scripts/manage-ssot.sh check
scripts/manage-ssot.sh diagnose alignment
```

**Solutions**:
```bash
# Fix password inconsistencies
scripts/manage-passwords.sh sync

# Fix endpoint mismatches
# Update AppConfig.ts or constants/index.ts
scripts/manage-ssot.sh sync all

# Fix type definition conflicts
scripts/manage-ssot.sh diagnose category types
```

##### Issue 4: Docker Service Sync Failures

**Symptoms**:
- Docker services not updated
- Environment variables not applied
- Service restart failures

**Diagnosis**:
```bash
scripts/manage-ssot.sh diagnose docker
scripts/manage-ssot.sh sync docker status
```

**Solutions**:
```bash
# Manual sync
scripts/manage-ssot.sh sync docker <SERVICE>

# Restart service
docker-compose restart <SERVICE>

# Verify sync
scripts/manage-ssot.sh diagnose docker
```

##### Issue 5: Synchronization Delays

**Symptoms**:
- Changes not reflected immediately
- Sync status shows pending
- Health checks fail

**Diagnosis**:
```bash
scripts/manage-ssot.sh diagnose sync
scripts/manage-ssot.sh sync status
```

**Solutions**:
```bash
# Force sync
scripts/manage-ssot.sh sync all --force

# Clear sync state
scripts/manage-ssot.sh sync clear

# Retry failed syncs
scripts/manage-ssot.sh sync retry
```

---

### Emergency Procedures

#### Complete System Reset

**Use Case**: Complete SSOT system corruption or major inconsistency

**Procedure**:
```bash
# 1. Backup current state
scripts/manage-ssot.sh backup

# 2. Clear all locks
scripts/manage-ssot.sh unlock all --force

# 3. Clear sync state
scripts/manage-ssot.sh sync clear

# 4. Restore from backup
scripts/manage-ssot.sh restore

# 5. Re-sync all systems
scripts/manage-ssot.sh sync all

# 6. Verify health
scripts/manage-ssot.sh health
```

#### Lock Recovery

**Use Case**: Orphaned locks or agent unresponsive

**Procedure**:
```bash
# 1. Identify orphaned locks
scripts/manage-ssot.sh diagnose locks

# 2. Check lock expiration
# (locks expire after TTL)

# 3. Force unlock if needed
scripts/manage-ssot.sh unlock <FILE> --force

# 4. Verify unlock
scripts/manage-ssot.sh diagnose file <FILE>
```

---

### Monitoring and Maintenance

#### Regular Maintenance Tasks

**Daily**:
```bash
# Quick health check
scripts/manage-ssot.sh health

# Check for inconsistencies
scripts/manage-ssot.sh check
```

**Weekly**:
```bash
# Full system diagnostic
scripts/manage-ssot.sh diagnose system

# Review sync history
scripts/manage-ssot.sh sync history

# Check for orphaned locks
scripts/manage-ssot.sh diagnose locks
```

**Monthly**:
```bash
# Comprehensive audit
scripts/manage-ssot.sh diagnose system --verbose

# Review SSOT registry
scripts/manage-ssot.sh registry

# Update documentation
# (if SSOT areas changed)
```

#### Performance Monitoring

```bash
# Monitor sync performance
scripts/manage-ssot.sh health metrics

# Track response times
scripts/manage-ssot.sh diagnose mcp --metrics

# Monitor Redis performance
scripts/manage-ssot.sh diagnose redis --detailed
```

---

### Integration Checklist

Before deploying SSOT changes:

- [ ] Run full diagnostic: `scripts/manage-ssot.sh diagnose system`
- [ ] Check consistency: `scripts/manage-ssot.sh check`
- [ ] Verify locks: `scripts/manage-ssot.sh diagnose locks`
- [ ] Test synchronization: `scripts/manage-ssot.sh sync all --dry-run`
- [ ] Validate changes: `scripts/manage-ssot.sh validate <FILE>`
- [ ] Check MCP health: `scripts/manage-ssot.sh health mcp`
- [ ] Verify Docker sync: `scripts/manage-ssot.sh diagnose docker`
- [ ] Test integration: `scripts/manage-ssot.sh test all`
- [ ] Review sync status: `scripts/manage-ssot.sh sync status`
- [ ] Final health check: `scripts/manage-ssot.sh health`

---

**Last Updated**: November 2025  
**Maintained By**: Architecture Team  
**Status**: ✅ Active

