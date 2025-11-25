# All Scripts Guide - Complete Reference

**Last Updated:** 2025-01-25  
**Purpose:** Complete guide to running all scripts

---

## 🚀 Master Script Runner

### Interactive Menu
```bash
./scripts/run-all-scripts.sh
```

### Run by Category
```bash
# Deployment
./scripts/run-all-scripts.sh deployment orchestrate v1.0.0 production
./scripts/run-all-scripts.sh deployment quick v1.0.0
./scripts/run-all-scripts.sh deployment staging v1.0.0
./scripts/run-all-scripts.sh deployment production v1.0.0

# Verification
./scripts/run-all-scripts.sh verify all production https://app.example.com
./scripts/run-all-scripts.sh verify services production
./scripts/run-all-scripts.sh verify features
./scripts/run-all-scripts.sh verify backend
./scripts/run-all-scripts.sh verify frontend
./scripts/run-all-scripts.sh verify smoke production https://app.example.com

# Testing
./scripts/run-all-scripts.sh test all
./scripts/run-all-scripts.sh test quick
./scripts/run-all-scripts.sh test coverage
./scripts/run-all-scripts.sh test uat

# Diagnostics
./scripts/run-all-scripts.sh diagnostic all
./scripts/run-all-scripts.sh diagnostic comprehensive

# Maintenance
./scripts/run-all-scripts.sh maintenance all
./scripts/run-all-scripts.sh maintenance audit
./scripts/run-all-scripts.sh maintenance dependencies

# Setup
./scripts/run-all-scripts.sh setup all
./scripts/run-all-scripts.sh setup monitoring
./scripts/run-all-scripts.sh setup database
```

---

## 📋 Individual Scripts

### Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `orchestrate-production-deployment.sh` | Full production deployment | `./scripts/orchestrate-production-deployment.sh v1.0.0 production` |
| `quick-deploy-all.sh` | Fast staging deployment | `./scripts/quick-deploy-all.sh v1.0.0` |
| `deploy-staging.sh` | Staging deployment | `./scripts/deploy-staging.sh v1.0.0` |
| `deploy-production.sh` | Production deployment | `./scripts/deploy-production.sh v1.0.0` |
| `deployment/deploy-docker.sh` | Docker deployment | `./scripts/deployment/deploy-docker.sh staging` |

### Verification Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `verify-all-features.sh` | Verify all features | `./scripts/verify-all-features.sh production https://app.example.com` |
| `verify-all-services.sh` | Verify all services | `./scripts/verify-all-services.sh production https://app.example.com` |
| `verify-backend-functions.sh` | Verify backend handlers | `./scripts/verify-backend-functions.sh` |
| `verify-frontend-features.sh` | Verify frontend components | `./scripts/verify-frontend-features.sh` |
| `verify-production-readiness.sh` | Production readiness | `./scripts/verify-production-readiness.sh` |
| `verify-backend-health.sh` | Backend health | `./scripts/verify-backend-health.sh` |
| `verify-performance.sh` | Performance checks | `./scripts/verify-performance.sh` |
| `smoke-tests.sh` | Smoke tests | `./scripts/smoke-tests.sh production https://app.example.com` |

### Testing Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `run-all-tests.sh` | Run all tests | `./scripts/run-all-tests.sh` |
| `run-tests-quick.sh` | Quick tests | `./scripts/run-tests-quick.sh` |
| `test-coverage-audit-enhanced.sh` | Coverage audit | `./scripts/test-coverage-audit-enhanced.sh` |
| `run-uat.sh` | UAT tests | `./scripts/run-uat.sh` |
| `create-auth-tests.sh` | Generate auth tests | `./scripts/create-auth-tests.sh` |
| `create-integration-tests.sh` | Generate integration tests | `./scripts/create-integration-tests.sh` |

### Diagnostic Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `run-all-diagnostics.sh` | Run all diagnostics | `./scripts/run-all-diagnostics.sh` |
| `comprehensive-diagnostic.sh` | Comprehensive diagnostic | `./scripts/comprehensive-diagnostic.sh` |

### Maintenance Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `audit-technical-debt.sh` | Technical debt audit | `./scripts/audit-technical-debt.sh` |
| `update-dependencies.sh` | Update dependencies | `./scripts/update-dependencies.sh` |

### Setup Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-monitoring.sh` | Setup monitoring | `./scripts/setup-monitoring.sh` |
| `setup-test-database.sh` | Setup test database | `./scripts/setup-test-database.sh` |

---

## 🎯 Common Workflows

### Complete Production Deployment
```bash
# 1. Verify everything
./scripts/run-all-scripts.sh verify all production https://app.example.com

# 2. Run tests
./scripts/run-all-scripts.sh test all

# 3. Deploy
./scripts/run-all-scripts.sh deployment orchestrate v1.0.0 production

# 4. Verify deployment
./scripts/run-all-scripts.sh verify all production https://app.example.com
```

### Feature Verification
```bash
# Verify all features
./scripts/verify-all-features.sh production https://app.example.com

# Verify backend functions
./scripts/verify-backend-functions.sh

# Verify frontend features
./scripts/verify-frontend-features.sh
```

### Quick Staging
```bash
# Quick deploy
./scripts/run-all-scripts.sh deployment quick v1.0.0

# Verify
./scripts/run-all-scripts.sh verify all staging https://staging.example.com
```

---

## 📊 Script Categories

### 1. Deployment (6 scripts)
- Production orchestration
- Staging deployment
- Quick deployment
- Docker deployment

### 2. Verification (8 scripts)
- Feature verification
- Service verification
- Backend function verification
- Frontend feature verification
- Health checks
- Smoke tests

### 3. Testing (6 scripts)
- Test execution
- Coverage analysis
- Test generation
- UAT tests

### 4. Diagnostics (2 scripts)
- Comprehensive diagnostics
- All diagnostics

### 5. Maintenance (2 scripts)
- Technical debt audit
- Dependency updates

### 6. Setup (2 scripts)
- Monitoring setup
- Database setup

**Total:** 26+ scripts organized and ready to use

---

## 🔍 Verification Checklist

After running scripts:

- [ ] All services verified
- [ ] All features verified
- [ ] All functions verified
- [ ] Tests passing
- [ ] No critical errors
- [ ] Performance acceptable

---

**See:** [Quick Start](../scripts/QUICK_START.md) for usage examples

