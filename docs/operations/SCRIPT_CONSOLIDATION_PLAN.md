# Script Consolidation Plan

**Last Updated:** 2025-01-27  
**Status:** Consolidation Plan  
**Purpose:** Consolidate scripts to minimum relevant ones

---

## Executive Summary

This document identifies duplicate scripts and provides a consolidation plan to reduce script count while maintaining all functionality.

**Current Script Count:** 138+ scripts  
**Target Script Count:** ~80-90 scripts (35-40% reduction)  
**Consolidation Strategy:** Merge duplicates, archive unused, use shared library

---

## Duplicate Scripts Identified

### Deployment Scripts (Consolidate to 5-6 scripts)

#### Current Duplicates:
- `deploy.sh` → Merge into `orchestrate-production-deployment.sh`
- `deploy-production.sh` → Merge into `orchestrate-production-deployment.sh`
- `deploy-staging.sh` → Keep (used by orchestration)
- `quick-deploy-all.sh` → Keep (fast staging deployment)
- `deployment/deploy-production.sh` → Merge into root `orchestrate-production-deployment.sh`
- `deployment/deploy-docker-production.sh` → Merge into `deployment/deploy-docker.sh`
- `deployment/deploy-docker.sh` → Keep (Docker deployment)
- `deployment/deploy-kubernetes-production.sh` → Keep (K8s deployment)

#### Consolidation:
- **Keep:** `orchestrate-production-deployment.sh` (master orchestration)
- **Keep:** `quick-deploy-all.sh` (fast staging)
- **Keep:** `deploy-staging.sh` (staging-specific)
- **Keep:** `deployment/deploy-docker.sh` (Docker deployment)
- **Keep:** `deployment/deploy-kubernetes-production.sh` (K8s deployment)
- **Archive:** `deploy.sh`, `deploy-production.sh`, `deployment/deploy-production.sh`, `deployment/deploy-docker-production.sh`

### Verification Scripts (Consolidate to 4-5 scripts)

#### Current:
- `verify-all-features.sh` → Keep (comprehensive feature verification)
- `verify-all-services.sh` → Keep (comprehensive service verification)
- `verify-backend-functions.sh` → Keep (backend-specific)
- `verify-frontend-features.sh` → Keep (frontend-specific)
- `verify-folder-consolidation.sh` → Keep (specialized)
- `verify-production-readiness.sh` → Keep (production checks)
- `verify-backend-health.sh` → Merge into `verify-all-services.sh`
- `verify-mcp-config.sh` → Keep (MCP-specific)
- `verify-mcp-coordination.sh` → Keep (MCP-specific)
- `verify-performance.sh` → Keep (performance-specific)
- `verify-logstash.sh` → Keep (logstash-specific)

#### Consolidation:
- **Keep:** All verification scripts (each serves specific purpose)
- **Merge:** `verify-backend-health.sh` → `verify-all-services.sh`

### Test Scripts (Consolidate to 6-7 scripts)

#### Current:
- `run-all-tests.sh` → Keep (master test runner)
- `run-tests-quick.sh` → Keep (quick tests)
- `run-uat.sh` → Keep (UAT tests)
- `test.sh` → Merge into `run-all-tests.sh`
- `test-coverage-audit.sh` → Keep (coverage audit)
- `test-coverage-audit-enhanced.sh` → Keep (enhanced coverage)
- `create-auth-tests.sh` → Keep (test generator)
- `create-integration-tests.sh` → Keep (test generator)
- `generate-component-test.sh` → Keep (test generator)
- `generate-playwright-test.sh` → Keep (test generator)
- `generate-backend-handler.sh` → Keep (test generator)
- `test-mcp-*.sh` → Keep (MCP-specific tests)

#### Consolidation:
- **Keep:** All test scripts (each serves specific purpose)
- **Merge:** `test.sh` → `run-all-tests.sh`

### Documentation Scripts (Consolidate to 2-3 scripts)

#### Current:
- `consolidate-documentation.sh` → Keep (documentation consolidation)
- `consolidate-folders.sh` → Keep (folder consolidation)
- `consolidate-branches.sh` → Keep (branch consolidation)
- `analyze-redundant-files.sh` → Keep (file analysis)

#### Consolidation:
- **Keep:** All consolidation scripts (each serves specific purpose)

### Diagnostic Scripts (Consolidate to 3-4 scripts)

#### Current:
- `comprehensive-diagnostic.sh` → Keep (comprehensive diagnostics)
- `run-all-diagnostics.sh` → Keep (master diagnostic runner)
- `diagnostics/diagnostic-*.sh` (15 files) → Keep (specialized diagnostics)
- `diagnose-mcp-server.sh` → Keep (MCP-specific)
- `build-orchestration-diagnostic.sh` → Keep (build-specific)

#### Consolidation:
- **Keep:** All diagnostic scripts (specialized purposes)

### Setup Scripts (Consolidate to 8-10 scripts)

#### Current:
- `setup-monitoring.sh` → Keep
- `setup-mcp.sh` → Keep
- `setup-mcp-keys.sh` → Keep
- `setup-cursor-mcp.sh` → Keep
- `setup-password-manager.sh` → Keep
- `setup-redis-and-tools.sh` → Keep
- `setup-test-database.sh` → Keep
- `dev-tools/setup.sh` → Keep

#### Consolidation:
- **Keep:** All setup scripts (each serves specific purpose)

---

## Script Categories (Final Structure)

### 1. Master Orchestration (1 script)
- `run-all-scripts.sh` - Master script runner for all categories

### 2. Deployment (5-6 scripts)
- `orchestrate-production-deployment.sh` - Full production deployment
- `quick-deploy-all.sh` - Fast staging deployment
- `deploy-staging.sh` - Staging deployment
- `deployment/deploy-docker.sh` - Docker deployment
- `deployment/deploy-kubernetes-production.sh` - Kubernetes deployment
- `deployment/build-and-push-images.sh` - Image build and push

### 3. Verification (10-12 scripts)
- `verify-all-features.sh` - All features
- `verify-all-services.sh` - All services
- `verify-backend-functions.sh` - Backend functions
- `verify-frontend-features.sh` - Frontend features
- `verify-production-readiness.sh` - Production readiness
- `verify-mcp-config.sh` - MCP configuration
- `verify-mcp-coordination.sh` - MCP coordination
- `verify-performance.sh` - Performance
- `verify-logstash.sh` - Logstash
- `verify-folder-consolidation.sh` - Folder consolidation

### 4. Testing (10-12 scripts)
- `run-all-tests.sh` - All tests
- `run-tests-quick.sh` - Quick tests
- `run-uat.sh` - UAT tests
- `test-coverage-audit.sh` - Coverage audit
- `test-coverage-audit-enhanced.sh` - Enhanced coverage
- `create-auth-tests.sh` - Auth test generator
- `create-integration-tests.sh` - Integration test generator
- `generate-component-test.sh` - Component test generator
- `generate-playwright-test.sh` - Playwright test generator
- `generate-backend-handler.sh` - Backend handler generator
- `test-mcp-*.sh` - MCP tests (3-4 scripts)

### 5. Diagnostics (18-20 scripts)
- `comprehensive-diagnostic.sh` - Comprehensive diagnostics
- `run-all-diagnostics.sh` - Master diagnostic runner
- `diagnostics/diagnostic-*.sh` - Specialized diagnostics (15 scripts)
- `diagnose-mcp-server.sh` - MCP diagnostics
- `build-orchestration-diagnostic.sh` - Build diagnostics

### 6. Setup (8-10 scripts)
- `setup-monitoring.sh` - Monitoring setup
- `setup-mcp.sh` - MCP setup
- `setup-mcp-keys.sh` - MCP keys setup
- `setup-cursor-mcp.sh` - Cursor MCP setup
- `setup-password-manager.sh` - Password manager setup
- `setup-redis-and-tools.sh` - Redis setup
- `setup-test-database.sh` - Test database setup
- `dev-tools/setup.sh` - Dev tools setup

### 7. Database (5-6 scripts)
- `execute-migrations.sh` - Run migrations
- `run-migrations.sh` - Alternative migration runner
- `run-all-database-setup.sh` - Complete database setup
- `apply-db-indexes.sh` - Apply database indexes
- `apply-performance-indexes.sh` - Apply performance indexes
- `start-database.sh` - Start database

### 8. Maintenance (10-12 scripts)
- `update-dependencies.sh` - Update dependencies
- `fix-linting-warnings.sh` - Fix linting
- `fix-frontend-lint-errors.sh` - Fix frontend linting
- `fix-eslint-warnings.sh` - Fix ESLint warnings
- `remove-console-logs.sh` - Remove console logs
- `audit-technical-debt.sh` - Technical debt audit
- `weekly-security-audit.sh` - Security audit
- `backup-redis.sh` - Redis backup
- `manage-passwords.sh` - Password management
- `manage-ssot.sh` - SSOT management

### 9. Analysis (8-10 scripts)
- `analyze-bundle-size.sh` - Bundle size analysis
- `analyze-redundant-files.sh` - Redundant file analysis
- `analyze-mcp-tools.sh` - MCP tools analysis
- `find-large-files.sh` - Large file finder
- `check-coverage.sh` - Coverage check
- `check-overlapping-exports.sh` - Overlapping exports check
- `check-mcp-implementation.sh` - MCP implementation check
- `bundle-monitor.sh` - Bundle monitoring

### 10. Consolidation (3-4 scripts)
- `consolidate-documentation.sh` - Documentation consolidation
- `consolidate-folders.sh` - Folder consolidation
- `consolidate-branches.sh` - Branch consolidation
- `delete-obsolete-branches.sh` - Delete obsolete branches

### 11. Specialized (15-20 scripts)
- MCP-specific scripts (5-6)
- Password management (2-3)
- Monitoring (2-3)
- Health checks (2-3)
- Other specialized (4-5)

---

## Consolidation Actions

### Phase 1: Archive Duplicates (Immediate)

**Deployment:**
```bash
# Archive to scripts/archive/deployment/
mv scripts/deploy.sh scripts/archive/deployment/
mv scripts/deploy-production.sh scripts/archive/deployment/
mv scripts/deployment/deploy-production.sh scripts/archive/deployment/
mv scripts/deployment/deploy-docker-production.sh scripts/archive/deployment/
```

**Verification:**
```bash
# Merge verify-backend-health.sh into verify-all-services.sh
# Then archive
mv scripts/verify-backend-health.sh scripts/archive/verification/
```

**Testing:**
```bash
# Merge test.sh into run-all-tests.sh
# Then archive
mv scripts/test.sh scripts/archive/testing/
```

### Phase 2: Update References (Week 1)

- [ ] Update `run-all-scripts.sh` to remove references to archived scripts
- [ ] Update documentation to reference consolidated scripts
- [ ] Update CI/CD pipelines if needed
- [ ] Verify all scripts use shared function library

### Phase 3: Documentation (Week 1)

- [ ] Update `RUN_ALL_SCRIPTS_GUIDE.md` with consolidated script list
- [ ] Update `QUICK_REFERENCE.md` with consolidated scripts
- [ ] Update `QUICK_START.md` with consolidated scripts
- [ ] Create script index document

---

## Script Quality Improvements

### Shared Library Usage

**Current:** ~60% of scripts use shared library  
**Target:** 100% of scripts use shared library

**Action Items:**
- [ ] Audit all scripts for shared library usage
- [ ] Update scripts to use shared functions
- [ ] Remove duplicate function definitions
- [ ] Document shared function usage

### Script Documentation

**Action Items:**
- [ ] Add header comments to all scripts
- [ ] Document script parameters
- [ ] Add usage examples
- [ ] Create script index

---

## Expected Results

### Before Consolidation
- **Total Scripts:** 138+
- **Duplicates:** ~20-25 scripts
- **Unused:** ~10-15 scripts
- **Shared Library Usage:** ~60%

### After Consolidation
- **Total Scripts:** ~80-90 scripts
- **Duplicates:** 0 scripts
- **Unused:** 0 scripts (archived)
- **Shared Library Usage:** 100%

### Benefits
- ✅ Reduced maintenance burden
- ✅ Clearer script organization
- ✅ Consistent script patterns
- ✅ Better documentation
- ✅ Easier onboarding

---

## Related Documentation

- [Scripts Quick Reference](../../scripts/QUICK_REFERENCE.md)
- [Run All Scripts Guide](../../scripts/RUN_ALL_SCRIPTS_GUIDE.md)
- [Shared Functions Library](../../scripts/lib/common-functions.sh)
- [Master Status](../project-management/PROJECT_STATUS.md)

---

**Last Updated:** 2025-01-27  
**Maintained By:** DevOps Team  
**Review Frequency:** Monthly

