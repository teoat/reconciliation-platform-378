# 🔧 Reconciliation Platform - Scripts

**Last Updated**: November 2025  
**Status**: ✅ Organized & Consolidated

---

## 🎯 Active Scripts (SSOT - Single Source of Truth)

This directory contains the **canonical, actively maintained scripts** for the reconciliation platform. All redundant, experimental, and diagnostic scripts have been archived to `archive/scripts/`.

---

## 📋 Script Categories

### 🚀 Environment & Setup

- **`setup-environment.sh`** - ⭐ **Primary** - Initial environment setup and bootstrap
- **`setup-mcp.sh`** - MCP server setup
- **`setup-monitoring.sh`** - Monitoring infrastructure setup
- **`setup-redis-and-tools.sh`** - Redis and development tools setup
- **`setup-test-database.sh`** - Test database initialization
- **`start-database.sh`** - Start database service

### ✅ Quality Gates & Validation

- **`validate-ssot.sh`** - ⭐ **Primary** - SSOT compliance validation
- **`validate-imports.sh`** - ⭐ **Primary** - Import path validation
- **`validate-dependencies.sh`** - Dependency validation
- **`validate-secrets.sh`** - Secrets validation
- **`validate-deployment.sh`** - Deployment validation
- **`validate-cursor-config.sh`** - Cursor IDE configuration validation

### 🧪 Testing

- **`run-all-tests.sh`** - ⭐ **Primary** - Run complete test suite
- **`run-tests-quick.sh`** - Quick test run (subset)
- **`test-coverage-audit-enhanced.sh`** - ⭐ **Primary** - Enhanced test coverage analysis
- **`smoke-tests.sh`** - Smoke test suite
- **`run-uat.sh`** - User Acceptance Testing
- **`check-coverage.sh`** - Coverage check

### 🔍 Diagnostics

- **`comprehensive-diagnostic.sh`** - ⭐ **Primary** - Comprehensive system diagnostic
- **`run-frontend-diagnostics.sh`** - Frontend-specific diagnostics
- **`build-orchestration-diagnostic.sh`** - Build orchestration diagnostics

### 📦 Build & Bundle

- **`analyze-bundle-size.sh`** - ⭐ **Primary** - Bundle size analysis
- **`verify-performance.sh`** - Performance verification

### 🚀 Deployment

#### Local Development
- **`deployment/quick-start-docker.sh`** - ⭐ **Primary** - Quick Docker deployment for local dev

#### Staging/Production
- **`deployment/deploy-staging.sh`** - Staging deployment
- **`deployment/deploy-production.sh`** - ⭐ **Primary** - Production deployment
- **`deployment/deploy-kubernetes-production.sh`** - Kubernetes production deployment
- **`deployment/deploy-optimized.sh`** - Optimized deployment
- **`deployment/deploy-healthy-services.sh`** - Deploy only healthy services

#### Deployment Utilities
- **`deployment/verify-optimizations.sh`** - Verify deployment optimizations
- **`deployment/monitor-deployment.sh`** - Monitor deployment status
- **`deployment/diagnose-and-deploy-all-services.sh`** - Diagnose and deploy all services
- **`verify-deployment.sh`** - Verify deployment
- **`verify-production-readiness.sh`** - Production readiness check

### 🔄 Database

- **`run-migrations.sh`** - ⭐ **Primary** - Run database migrations
- **`execute-migrations.sh`** - Execute migrations
- **`run-all-database-setup.sh`** - Complete database setup
- **`apply-performance-indexes.sh`** - Apply performance indexes
- **`apply-db-indexes.sh`** - Apply database indexes

### 🔐 Security & Secrets

- **`security_audit.sh`** - Security audit
- **`weekly-security-audit.sh`** - Weekly security audit
- **`deployment/validate-secrets.sh`** - Validate deployment secrets
- **`deployment/setup-production-secrets.sh`** - Setup production secrets
- **`deployment/sync-secrets.sh`** - Sync secrets

### 🔧 Backend

- **`backend/start_backend.sh`** - Start backend service
- **`start-backend-with-env.sh`** - Start backend with environment
- **`start-backend-and-test.sh`** - Start backend and run tests
- **`restart-backend.sh`** - Restart backend
- **`restart-backend-fresh.sh`** - Fresh backend restart

### 🎨 Frontend

- **`start-frontend-and-diagnose.sh`** - Start frontend with diagnostics
- **`verify-frontend-features.sh`** - Verify frontend features
- **`fix-frontend-lint-errors.sh`** - Fix frontend lint errors

### 🔄 SSOT & Consolidation

- **`ssot-audit.sh`** - SSOT audit
- **`manage-ssot.sh`** - SSOT management
- **`execute-aggressive-consolidation.sh`** - Execute consolidation
- **`migrate-imports.sh`** - Migrate imports to SSOT paths
- **`consolidate-docs-phase2.sh`** - Phase 2 documentation consolidation
- **`consolidate-documentation.sh`** - Documentation consolidation
- **`consolidate-folders.sh`** - Folder consolidation
- **`verify-folder-consolidation.sh`** - Verify folder consolidation

### 🔍 Analysis & Monitoring

- **`analyze-dependency-coupling.sh`** - Dependency coupling analysis
- **`monitor-dependencies.sh`** - Monitor dependencies
- **`generate-dependency-report.sh`** - Generate dependency report
- **`detect-circular-deps.sh`** - Detect circular dependencies
- **`analyze-redundant-files.sh`** - Analyze redundant files
- **`audit-technical-debt.sh`** - Technical debt audit
- **`find-large-files.sh`** - Find large files

### 🛠️ Code Generation

- **`generate-backend-handler.sh`** - Generate backend handler
- **`generate-playwright-test.sh`** - Generate Playwright test
- **`generate-component-test.sh`** - Generate component test
- **`create-integration-tests.sh`** - Create integration tests
- **`create-auth-tests.sh`** - Create auth tests

### 🔄 Sync & Maintenance

- **`sync-benchmark.sh`** - Sync benchmark
- **`sync-validate-tables.sh`** - Sync and validate tables
- **`sync-github-local.sh`** - Sync GitHub with local
- **`frenly-maintenance.sh`** - Frenly maintenance
- **`frenly-meta-maintenance.sh`** - Frenly meta maintenance

### 🔐 Password Management

- **`setup-password-manager.sh`** - Setup password manager
- **`manage-passwords.sh`** - Manage passwords
- **`check-password-system.sh`** - Check password system
- **`fix-password-system.sh`** - Fix password system
- **`test-initial-password-system.sh`** - Test initial password system
- **`set-initial-passwords.sh`** - Set initial passwords
- **`password-rotation-service.sh`** - Password rotation service

### 🧹 Code Quality

- **`fix-linting-warnings.sh`** - Fix linting warnings
- **`fix-eslint-warnings.sh`** - Fix ESLint warnings
- **`optimize-console-logs.sh`** - Optimize console logs
- **`remove-console-logs.sh`** - Remove console logs
- **`check-overlapping-exports.sh`** - Check overlapping exports

### 🔍 Verification

- **`verify-all-features.sh`** - Verify all features
- **`verify-all-services.sh`** - Verify all services
- **`verify-backend-functions.sh`** - Verify backend functions
- **`verify-mcp-config.sh`** - Verify MCP configuration
- **`complete-verification.sh`** - Complete verification

### 🚀 Quick Commands

- **`QUICK_COMMANDS.sh`** - Quick reference commands

### 📊 Utilities

- **`health-check-all.sh`** - Health check all services
- **`backup-redis.sh`** - Backup Redis
- **`monitor-logstash-memory.sh`** - Monitor Logstash memory
- **`verify-logstash.sh`** - Verify Logstash
- **`accessibility-test.sh`** - Accessibility testing
- **`establish-baselines.sh`** - Establish baselines
- **`review-reports.sh`** - Review reports
- **`release-management.sh`** - Release management
- **`go-live.sh`** - Go-live script
- **`production-deployment-checklist.sh`** - Production deployment checklist
- **`full-redeploy.sh`** - Full redeploy

### 🔄 Git & Branches

- **`delete-obsolete-branches.sh`** - Delete obsolete branches
- **`consolidate-branches.sh`** - Consolidate branches

### 📦 Dependencies

- **`update-dependencies.sh`** - Update dependencies

### 🔧 Refactoring

- **`refactoring/analyze-dependencies.sh`** - Analyze dependencies for refactoring
- **`refactoring/validate-refactor.sh`** - Validate refactoring
- **`refactoring/pre-refactor-check.sh`** - Pre-refactor checks

### 🔄 Deployment Subdirectory

- **`deployment/test-backend-startup.sh`** - Test backend startup
- **`deployment/debug-backend.sh`** - Debug backend
- **`deployment/diagnose-docker-builds.sh`** - Diagnose Docker builds
- **`deployment/diagnose-deployment.sh`** - Diagnose deployment
- **`deployment/deploy-minikube-local.sh`** - Deploy to Minikube (local)
- **`deployment/fix-all-secrets.sh`** - Fix all secrets
- **`deployment/check-health.sh`** - Check health
- **`deployment/check-redis.sh`** - Check Redis
- **`deployment/check-database.sh`** - Check database
- **`deployment/check-frontend.sh`** - Check frontend
- **`deployment/check-backend.sh`** - Check backend
- **`deployment/run-migrations.sh`** - Run migrations (deployment context)
- **`deployment/setup-env.sh`** - Setup environment (deployment)
- **`deployment/deploy-docker.sh`** - Deploy Docker
- **`deployment/error-detection.sh`** - Error detection
- **`deployment/update-kustomization-images.sh`** - Update Kustomization images
- **`deployment/build-and-push-images.sh`** - Build and push images

### 🔧 Backend Subdirectory

- **`backend/run_tests.sh`** - Run backend tests
- **`backend/run_simple.sh`** - Run backend (simple)
- **`backend/run_coverage.sh`** - Run backend coverage
- **`backend/apply_performance_indexes.sh`** - Apply performance indexes
- **`backend/apply-indexes.sh`** - Apply indexes
- **`backend/coverage.sh`** - Coverage script
- **`backend/CLEAR_CARGO_LOCK.sh`** - Clear Cargo lock

### 🔧 Docker Subdirectory

- **`docker/build-optimized.sh`** - Build optimized Docker images

### 🔧 Sync Subdirectory

- **`sync/docker-ide-sync.sh`** - Docker IDE sync

### 🔧 Analysis Subdirectory

- **`analysis/analyze-typescript-types.sh`** - Analyze TypeScript types

### 🔧 Fixes Subdirectory

- **`fixes/complete-next-steps.sh`** - Complete next steps

### 🔧 Dev Tools Subdirectory

- **`dev-tools/setup.sh`** - Dev tools setup

### 📚 Shared Library

- **`lib/common-functions.sh`** - ⭐ **Shared Library** - Common functions used by all scripts

---

## 📂 Archive

All redundant, experimental, and diagnostic scripts have been archived:

- **`archive/scripts/diagnostics/`** - Archived diagnostic scripts (diagnostic-1.sh through diagnostic-15.sh, run-all-diagnostics.sh)
- **`archive/scripts/duplicates/`** - Duplicate/redundant scripts (run-all-complete.sh, run-all-scripts.sh, quick-deploy variants, etc.)
- **`archive/scripts/unused/`** - Unused/experimental scripts (MCP coordination helpers, test scripts, etc.)

---

## 🎯 Usage Guidelines

### Before Creating a New Script

1. **Check if a similar script exists** - Search this directory first
2. **Use the shared library** - Source `lib/common-functions.sh` for common functions
3. **Follow naming conventions** - Use kebab-case, descriptive names
4. **Document the script** - Include header comments explaining purpose

### Script Organization

- **Root level**: Primary, frequently-used scripts
- **Subdirectories**: Organized by purpose (deployment/, backend/, refactoring/, etc.)
- **Shared library**: `lib/common-functions.sh` for reusable functions

### Quality Gates

Before committing scripts:
- ✅ Source shared library when applicable
- ✅ Include error handling
- ✅ Use proper logging functions
- ✅ Validate prerequisites
- ✅ Follow project conventions

---

## 📊 Statistics

- **Total Active Scripts**: ~160 scripts
- **Archived Scripts**: ~30+ scripts (diagnostics, duplicates, unused)
- **Categories**: 15+ categories
- **Last Consolidation**: November 2025
- **Consolidation Status**: ✅ Complete

---

## 🔗 Related Documentation

- **[Documentation README](../docs/README.md)** - Project documentation
- **[Project Status](../docs/project-management/PROJECT_STATUS.md)** - Project status
- **[Deployment Guide](../docs/deployment/DEPLOYMENT_GUIDE.md)** - Deployment documentation

---

**Last Updated**: November 2025  
**Maintainer**: Development Team

