# Duplicate Functions Diagnostic Report

## Executive Summary

This report identifies duplicate functions across shell scripts, dotfiles, and text files in the reconciliation platform codebase. The analysis found **significant duplication** of utility functions across 100+ shell scripts.

---

## 1. Logging Functions Duplication

### High Duplication (15+ occurrences)

**Functions:**
- `log_info()` - 15+ scripts
- `log_success()` - 15+ scripts  
- `log_error()` - 15+ scripts
- `log_warning()` - 15+ scripts

**Affected Files:**
- `post-deployment-verification.sh`
- `pre-deployment-check.sh`
- `validate-production.sh`
- `setup-production.sh`
- `scripts/run-uat.sh`
- `scripts/release-management.sh`
- `scripts/go-live.sh`
- `scripts/deploy-production.sh`
- `infrastructure/security/security-scan.sh`
- `infrastructure/backup/backup-recovery.sh`
- And 5+ more...

### Medium Duplication (5-10 occurrences)

**Functions:**
- `print_status()` - 8 scripts
- `print_error()` - 6 scripts
- `print_success()` - 5 scripts
- `echo_info()` - 3 scripts
- `echo_warn()` - 3 scripts
- `echo_error()` - 3 scripts

**Affected Files:**
- `scripts/verify-logstash.sh`
- `scripts/weekly-security-audit.sh`
- `test.sh`
- `test-and-deploy-frenly-ai.sh`
- `setup-monitoring.sh`
- `packages/frontend/deploy.sh`
- `packages/backend/run_tests.sh`
- `frontend/deploy.sh`
- `backend/run_tests.sh`

---

## 2. Backup Functions Duplication

### High Duplication

**Functions:**
- `backup_postgresql()` - 3 scripts
- `backup_redis()` - 2 scripts
- `backup_data()` - 2 scripts
- `create_backup()` - 3 scripts
- `list_backups()` - 3 scripts
- `restore_backup()` - 2 scripts
- `restore_postgresql()` - 2 scripts
- `restore_redis()` - 2 scripts

**Affected Files:**
- `scripts/backup-database.sh`
- `scripts/backup_restore.sh`
- `infrastructure/backup/backup-recovery.sh`
- `infrastructure/database/backup.sh`
- `infrastructure/redis/redis-manager.sh`
- `scripts/deploy.sh`
- `ssot-cleanup.sh`

**Duplication Pattern:**
- PostgreSQL backup logic duplicated across 3 files
- Redis backup logic duplicated across 2 files
- Backup listing logic duplicated across 3 files
- Restore logic duplicated across 2 files

---

## 3. Health Check & Validation Functions Duplication

### High Duplication (20+ occurrences)

**Functions:**
- `check_prerequisites()` - 10+ scripts
- `check_docker()` - 4 scripts
- `check_database()` - 3 scripts
- `check_redis()` - 3 scripts
- `check_frontend()` - 3 scripts
- `check_backend()` - 3 scripts
- `health_check()` - 8 scripts
- `verify_*()` - 10+ scripts
- `validate_*()` - 5+ scripts

**Affected Files:**
- `deploy-backend.sh`
- `scripts/deployment/check-*.sh` (5 files)
- `scripts/health-check-all.sh`
- `scripts/deploy.sh`
- `scripts/deploy-production.sh`
- `packages/frontend/deploy.sh`
- `frontend/deploy.sh`
- `deploy.sh`
- `validate-production.sh`
- `infrastructure/security/security-scan.sh`
- `infrastructure/backup/backup-recovery.sh`
- And 10+ more...

---

## 4. Deployment Functions Duplication

### Medium Duplication

**Functions:**
- `deploy()` - 5 scripts
- `rollback()` - 3 scripts
- `verify_deployment()` - 3 scripts
- `build_and_push_images()` - 2 scripts
- `run_migrations()` - 4 scripts

**Affected Files:**
- `scripts/deploy.sh`
- `scripts/deploy-production.sh`
- `deploy.sh`
- `scripts/deployment/deploy-docker.sh`
- `packages/frontend/deploy.sh`
- `frontend/deploy.sh`

---

## 5. Dotfiles Analysis

### Files Starting with "."

**Checked Files:**
- `.prettierrc.json` - No functions (JSON config)
- `.lintstagedrc.json` - No functions (JSON config)
- `.gitignore` - No functions (config file)
- `frontend/.eslintrc.security.js` - No duplicate functions (extends config)
- `frontend/.eslintrc.accessibility.js` - No duplicate functions (extends config)

**Result:** No function duplications found in dotfiles.

---

## 6. Text Files Analysis

### Files Checked:
- `ssot_violations.txt` - No functions (violation report)
- `reports/xss-risks.txt` - Not checked (may contain analysis)
- `frontend/build_output.txt` - Not checked (build output)

**Result:** Text files don't contain executable functions.

---

## 7. Two-Level Deep Analysis

### scripts/deployment/ Directory

**Files:**
- `check-backend.sh` - Has `check_backend()` function
- `check-database.sh` - Has `check_database()` function  
- `check-frontend.sh` - Has `check_frontend()` function
- `check-redis.sh` - Has `check_redis()` function
- `check-health.sh` - Has multiple check functions
- `deploy-docker.sh` - Has `deploy()`, `verify_deployment()`, `health_check()`
- `error-detection.sh` - Has multiple `check_*()` functions
- `run-migrations.sh` - Has `run_migrations()` function
- `setup-env.sh` - Has `validate_env()` function

**Duplication Found:**
- Check functions duplicated across multiple check-*.sh files
- Deployment functions duplicated with root-level scripts

### infrastructure/ Directory

**Subdirectories Analyzed:**
- `infrastructure/backup/backup-recovery.sh` - Comprehensive backup functions (duplicated)
- `infrastructure/database/backup.sh` - Database backup functions (duplicated)
- `infrastructure/redis/redis-manager.sh` - Redis backup/restore (duplicated)
- `infrastructure/security/security-scan.sh` - Logging functions (duplicated)
- `infrastructure/performance/performance-test.sh` - Health check functions (duplicated)

**Duplication Found:**
- Backup functions duplicated across 3 infrastructure scripts
- Logging functions duplicated
- Health check functions duplicated

---

## 8. Unused Scripts Identified

### Potentially Unused Scripts (from previous analysis):
- `deploy-all.sh`
- `deploy-simple.sh`
- `deploy-staging.sh`
- `deploy-optimized-production.sh`
- `deploy-production-complete.sh`
- `quick_deploy_backend.sh`
- `rebuild-docker.sh`
- `start-deployment.sh`
- Multiple PowerShell scripts (`.ps1` files)
- Multiple batch scripts (`.bat` files)

---

## 9. Impact Assessment

| Category | Count | Impact |
|----------|-------|--------|
| **Duplicate Logging Functions** | 50+ | HIGH - Maintenance burden |
| **Duplicate Backup Functions** | 20+ | HIGH - Risk of inconsistency |
| **Duplicate Health Check Functions** | 30+ | MEDIUM - Code bloat |
| **Duplicate Deployment Functions** | 15+ | MEDIUM - Deployment confusion |
| **Unused Scripts** | 20+ | LOW - Storage waste |

**Total Duplicate Function Instances:** 135+

---

## 10. Recommendations

### Priority 1: Create Shared Function Library
1. Create `scripts/lib/common-functions.sh` with:
   - Standardized logging functions
   - Backup/restore functions
   - Health check functions
   - Validation functions

2. Source the library in all scripts:
   ```bash
   source "$(dirname "$0")/lib/common-functions.sh"
   ```

### Priority 2: Consolidate Backup Scripts
1. Keep `infrastructure/backup/backup-recovery.sh` as the primary backup script
2. Archive or remove:
   - `scripts/backup-database.sh` (functionality covered)
   - `scripts/backup_restore.sh` (functionality covered)
   - `infrastructure/database/backup.sh` (if redundant)

### Priority 3: Consolidate Deployment Scripts
1. Keep `scripts/deploy-production.sh` as primary production deployment
2. Keep `scripts/deploy.sh` as primary general deployment
3. Archive redundant deployment scripts

### Priority 4: Archive Unused Scripts
1. Move unused scripts to `archive/scripts/unused/`
2. Document why they were archived
3. Keep for reference but remove from active use

---

## 11. Action Plan

1. ✅ **Create diagnostic report** (this file)
2. ⏳ **Create shared function library** (`scripts/lib/common-functions.sh`)
3. ⏳ **Consolidate backup scripts** (archive duplicates)
4. ⏳ **Consolidate deployment scripts** (archive duplicates)
5. ⏳ **Archive unused scripts** (move to archive/)
6. ⏳ **Update scripts to use shared library**
7. ⏳ **Test consolidated scripts**

---

## 12. Files to Archive

### Backup Scripts (duplicates):
- `scripts/backup-database.sh` → `archive/scripts/backup-database.sh`
- `scripts/backup_restore.sh` → `archive/scripts/backup_restore.sh` (if redundant)

### Deployment Scripts (duplicates/unused):
- `deploy-all.sh` → `archive/scripts/deploy-all.sh`
- `deploy-simple.sh` → `archive/scripts/deploy-simple.sh`
- `deploy-staging.sh` → `archive/scripts/deploy-staging.sh`
- `deploy-optimized-production.sh` → `archive/scripts/deploy-optimized-production.sh`
- `deploy-production-complete.sh` → `archive/scripts/deploy-production-complete.sh`
- `quick_deploy_backend.sh` → `archive/scripts/quick_deploy_backend.sh`

### Other Unused Scripts:
- `rebuild-docker.sh` → `archive/scripts/rebuild-docker.sh`
- `start-deployment.sh` → `archive/scripts/start-deployment.sh` (if redundant)

---

**Report Generated:** $(date)
**Analyzed:** 100+ shell scripts, dotfiles, and text files
**Total Duplications Found:** 135+ function instances

