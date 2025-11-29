# Docker SSOT Enforcement Guide

**Last Updated**: January 2025  
**Status**: Active - SSOT  
**Version**: 2.0.0

## Overview

This guide explains how Single Source of Truth (SSOT) principles are enforced for Docker and deployment configurations. This guide consolidates all Docker SSOT documentation into a single source of truth.

## SSOT Structure

### Docker Compose (SSOT)

- **SSOT Location**: `docker-compose.yml` (project root)
- **Status**: ✅ Consolidated - All services in one file
- **Archived**: All other docker-compose files moved to `archive/docker-compose/`

### Environment Variables (SSOT)

- **SSOT Location**: `.env` (project root, git-ignored)
- **Template**: `config/dev.env.example` (development)
- **Production Template**: `config/production.env.example`
- **Rules**:
  - `.env` is the SSOT for all environment variables
  - `docker-compose.yml` automatically reads from `.env`
  - Never commit `.env` to version control
  - Use example files as templates

### Deployment Scripts (SSOT)

- **SSOT Script**: `scripts/deploy-docker.sh`
- **Validation**: `scripts/validate-docker-ssot.sh`
- **Synchronization**: `scripts/sync-docker-ssot.sh`
- **Shared Functions**: `scripts/lib/common-functions.sh`

## SSOT Validation

### Validate SSOT Compliance

```bash
# Check for SSOT violations
./scripts/validate-docker-ssot.sh

# Auto-fix violations
./scripts/validate-docker-ssot.sh --fix
```

### What It Checks

1. **Docker Compose SSOT**
   - Only `docker-compose.yml` at root (others archived)
   - References `.env` for environment variables
   - Uses `${VAR:-default}` pattern

2. **Environment Variables SSOT**
   - `.env.example` exists as template
   - No duplicate env files at root
   - Consistency between docker-compose.yml and .env.example

3. **Deployment Script SSOT**
   - Uses SSOT docker-compose.yml
   - Sources common-functions.sh (SSOT)

4. **Configuration Consistency**
   - Defaults match between docker-compose.yml and .env.example
   - No hardcoded values

## SSOT Synchronization

### Sync Environment to Docker

```bash
# Sync .env to docker-compose.yml
./scripts/sync-docker-ssot.sh

# Dry run (preview changes)
./scripts/sync-docker-ssot.sh --dry-run
```

### What It Does

1. **Creates .env from template** if missing
2. **Verifies docker-compose.yml** uses environment variables
3. **Checks consistency** between .env and docker-compose.yml
4. **Validates deployment script** uses SSOT

## Deployment Workflow

### Standard Deployment (SSOT Compliant)

```bash
# 1. Validate SSOT
./scripts/validate-docker-ssot.sh

# 2. Sync environment
./scripts/sync-docker-ssot.sh

# 3. Deploy
./scripts/deploy-docker.sh
```

### Quick Deployment

```bash
# Deploy (includes SSOT validation)
./scripts/deploy-docker.sh

# Skip SSOT validation (not recommended)
SKIP_SSOT_VALIDATION=true ./scripts/deploy-docker.sh
```

## SSOT Rules

### ✅ DO

- Use `docker-compose.yml` as SSOT for all services
- Use `.env` as SSOT for all environment variables
- Use `scripts/deploy-docker.sh` as SSOT for deployment
- Source `scripts/lib/common-functions.sh` in all scripts
- Validate SSOT before deployment
- Sync environment before deployment

### ❌ DON'T

- Create new docker-compose files at root
- Hardcode values in docker-compose.yml
- Commit `.env` to version control
- Create duplicate deployment scripts
- Bypass SSOT validation

## Troubleshooting

### Issue: "SSOT violation: duplicate docker-compose files"

**Solution**:
```bash
# Auto-fix
./scripts/validate-docker-ssot.sh --fix

# Or manually move to archive
mkdir -p archive/docker-compose
mv docker-compose.*.yml archive/docker-compose/
```

### Issue: ".env file not found"

**Solution**:
```bash
# Create from template
./scripts/sync-docker-ssot.sh

# Or manually
cp config/dev.env.example .env
# Edit .env with your values
```

### Issue: "Environment variable mismatch"

**Solution**:
```bash
# Sync environment
./scripts/sync-docker-ssot.sh

# Check consistency
./scripts/validate-docker-ssot.sh
```

## SSOT Implementation Summary

### Changes Made

1. **SSOT Validation Script** (`scripts/validate-docker-ssot.sh`)
   - Validates docker-compose.yml SSOT compliance
   - Checks environment variable SSOT
   - Verifies deployment script SSOT
   - Checks configuration consistency
   - Detects duplicate configurations
   - Auto-fix mode with `--fix` flag

2. **SSOT Synchronization Script** (`scripts/sync-docker-ssot.sh`)
   - Syncs .env to docker-compose.yml
   - Creates .env from template if missing
   - Verifies docker-compose.yml uses environment variables
   - Validates deployment script uses SSOT
   - Dry-run mode for preview

3. **Enhanced docker-compose.yml**
   - Added SSOT compliance comments
   - References SSOT validation scripts
   - Uses environment variables (SSOT pattern)
   - All services consolidated into single file

4. **Enhanced Deployment Script**
   - Added SSOT validation before deployment
   - References SSOT docker-compose.yml
   - Sources SSOT common-functions.sh
   - Can skip SSOT validation with `SKIP_SSOT_VALIDATION=true`

### Validation Results

✅ **All SSOT validations passing**:
- docker-compose.yml SSOT compliance
- Environment variable SSOT
- Deployment script SSOT
- Configuration consistency
- No duplicate configurations

### Benefits

1. **Single Source of Truth**: One docker-compose.yml, one .env
2. **Automated Validation**: Catch SSOT violations before deployment
3. **Synchronization**: Keep Docker and environment in sync
4. **Documentation**: Clear SSOT structure and rules
5. **Enforcement**: Scripts enforce SSOT principles

## Related Documentation

- [SSOT_LOCK.yml](../../SSOT_LOCK.yml) - Complete SSOT definitions
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Deployment instructions (SSOT)
- [SSOT Guidance](../architecture/SSOT_GUIDANCE.md) - General SSOT principles

---

**Note**: This guide consolidates the previous Docker SSOT Summary. For Docker-specific deployment details, see the [Deployment Guide](./DEPLOYMENT_GUIDE.md).

