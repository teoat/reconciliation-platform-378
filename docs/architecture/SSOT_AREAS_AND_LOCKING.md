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

**Last Updated**: November 2025  
**Maintained By**: Architecture Team  
**Status**: ✅ Active

