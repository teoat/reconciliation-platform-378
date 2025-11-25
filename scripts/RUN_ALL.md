# Run All Scripts - Complete Guide

**Last Updated:** 2025-01-25

---

## 🚀 Master Script Runner

The master script runner organizes all scripts into categories for easy execution.

### Interactive Menu
```bash
./scripts/run-all-scripts.sh
```

### Run by Category

#### 1. Deployment
```bash
# Full production deployment
./scripts/run-all-scripts.sh deployment orchestrate v1.0.0 production

# Quick staging
./scripts/run-all-scripts.sh deployment quick v1.0.0

# Staging only
./scripts/run-all-scripts.sh deployment staging v1.0.0

# Production only
./scripts/run-all-scripts.sh deployment production v1.0.0
```

#### 2. Verification
```bash
# Verify everything
./scripts/run-all-scripts.sh verify all production https://app.example.com

# Verify services
./scripts/run-all-scripts.sh verify services production

# Verify features
./scripts/run-all-scripts.sh verify features

# Verify backend functions
./scripts/run-all-scripts.sh verify backend

# Verify frontend features
./scripts/run-all-scripts.sh verify frontend

# Smoke tests
./scripts/run-all-scripts.sh verify smoke production https://app.example.com
```

#### 3. Testing
```bash
# All tests
./scripts/run-all-scripts.sh test all

# Quick tests
./scripts/run-all-scripts.sh test quick

# Coverage
./scripts/run-all-scripts.sh test coverage

# UAT
./scripts/run-all-scripts.sh test uat
```

---

## 📋 Individual Scripts

### Verification Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `verify-all-features.sh` | All features | `./scripts/verify-all-features.sh production https://app.example.com` |
| `verify-all-services.sh` | All services | `./scripts/verify-all-services.sh production https://app.example.com` |
| `verify-backend-functions.sh` | Backend handlers | `./scripts/verify-backend-functions.sh` |
| `verify-frontend-features.sh` | Frontend components | `./scripts/verify-frontend-features.sh` |

### Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `orchestrate-production-deployment.sh` | Full deployment | `./scripts/orchestrate-production-deployment.sh v1.0.0 production` |
| `quick-deploy-all.sh` | Quick staging | `./scripts/quick-deploy-all.sh v1.0.0` |

---

## 🎯 Complete Workflow

### Full Production Deployment
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

---

**Total Scripts:** 103+ scripts available and organized

