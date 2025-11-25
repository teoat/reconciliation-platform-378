# Run All Scripts - Complete Guide

**Last Updated:** 2025-01-25

---

## 🚀 Quick Start

### Interactive Menu
```bash
./scripts/run-all-scripts.sh
```

This shows an interactive menu with all available script categories.

---

## 📋 Script Categories

### 1. Deployment Scripts

**Full Production Deployment:**
```bash
./scripts/run-all-scripts.sh deployment orchestrate v1.0.0 production
```

**Quick Staging Deployment:**
```bash
./scripts/run-all-scripts.sh deployment quick v1.0.0
```

**Individual Deployments:**
```bash
# Staging only
./scripts/run-all-scripts.sh deployment staging v1.0.0

# Production only
./scripts/run-all-scripts.sh deployment production v1.0.0

# Docker deployment
./scripts/run-all-scripts.sh deployment docker staging
```

---

### 2. Verification Scripts

**Verify Everything:**
```bash
./scripts/run-all-scripts.sh verify all production https://app.example.com
```

**Individual Verifications:**
```bash
# Verify all services
./scripts/run-all-scripts.sh verify services production

# Verify all features
./scripts/run-all-scripts.sh verify features

# Verify backend functions
./scripts/run-all-scripts.sh verify backend

# Verify frontend features
./scripts/run-all-scripts.sh verify frontend

# Run smoke tests
./scripts/run-all-scripts.sh verify smoke production https://app.example.com
```

**Direct Script Execution:**
```bash
# Comprehensive feature verification
./scripts/verify-all-features.sh production https://app.example.com

# Backend function verification
./scripts/verify-backend-functions.sh

# Frontend feature verification
./scripts/verify-frontend-features.sh

# Service verification
./scripts/verify-all-services.sh production https://app.example.com
```

---

### 3. Testing Scripts

```bash
# Run all tests
./scripts/run-all-scripts.sh test all

# Quick tests
./scripts/run-all-scripts.sh test quick

# Test coverage
./scripts/run-all-scripts.sh test coverage

# UAT tests
./scripts/run-all-scripts.sh test uat
```

---

### 4. Diagnostic Scripts

```bash
# Run all diagnostics
./scripts/run-all-scripts.sh diagnostic all

# Comprehensive diagnostic
./scripts/run-all-scripts.sh diagnostic comprehensive
```

---

### 5. Maintenance Scripts

```bash
# Run all maintenance
./scripts/run-all-scripts.sh maintenance all

# Technical debt audit
./scripts/run-all-scripts.sh maintenance audit

# Update dependencies
./scripts/run-all-scripts.sh maintenance dependencies
```

---

### 6. Setup Scripts

```bash
# Run all setup
./scripts/run-all-scripts.sh setup all

# Setup monitoring
./scripts/run-all-scripts.sh setup monitoring

# Setup test database
./scripts/run-all-scripts.sh setup database
```

---

## 🎯 Common Workflows

### Complete Production Deployment
```bash
# Step 1: Verify everything
./scripts/run-all-scripts.sh verify all production https://app.example.com

# Step 2: Run tests
./scripts/run-all-scripts.sh test all

# Step 3: Deploy to production
./scripts/run-all-scripts.sh deployment orchestrate v1.0.0 production

# Step 4: Verify deployment
./scripts/run-all-scripts.sh verify all production https://app.example.com
```

### Quick Feature Verification
```bash
# Verify backend functions
./scripts/verify-backend-functions.sh

# Verify frontend features
./scripts/verify-frontend-features.sh

# Verify all features
./scripts/verify-all-features.sh production https://app.example.com
```

### Quick Staging Deployment
```bash
# Quick deploy to staging
./scripts/run-all-scripts.sh deployment quick v1.0.0

# Verify staging
./scripts/run-all-scripts.sh verify all staging https://staging.example.com
```

---

## 📊 Script Reference

### Verification Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `verify-all-features.sh` | All features | `./scripts/verify-all-features.sh production https://app.example.com` |
| `verify-all-services.sh` | All services | `./scripts/verify-all-services.sh production https://app.example.com` |
| `verify-backend-functions.sh` | Backend handlers | `./scripts/verify-backend-functions.sh` |
| `verify-frontend-features.sh` | Frontend components | `./scripts/verify-frontend-features.sh` |
| `verify-production-readiness.sh` | Production readiness | `./scripts/verify-production-readiness.sh` |
| `verify-backend-health.sh` | Backend health | `./scripts/verify-backend-health.sh` |
| `verify-performance.sh` | Performance checks | `./scripts/verify-performance.sh` |
| `smoke-tests.sh` | Smoke tests | `./scripts/smoke-tests.sh production https://app.example.com` |

### Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `orchestrate-production-deployment.sh` | Full deployment | `./scripts/orchestrate-production-deployment.sh v1.0.0 production` |
| `quick-deploy-all.sh` | Quick staging | `./scripts/quick-deploy-all.sh v1.0.0` |
| `deploy-staging.sh` | Staging deployment | `./scripts/deploy-staging.sh v1.0.0` |
| `deploy-production.sh` | Production deployment | `./scripts/deploy-production.sh v1.0.0` |

### Testing Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `run-all-tests.sh` | All tests | `./scripts/run-all-tests.sh` |
| `run-tests-quick.sh` | Quick tests | `./scripts/run-tests-quick.sh` |
| `test-coverage-audit-enhanced.sh` | Coverage audit | `./scripts/test-coverage-audit-enhanced.sh` |
| `run-uat.sh` | UAT tests | `./scripts/run-uat.sh` |

---

## 🔍 Verification Checklist

After running scripts, verify:

- [ ] All services are running
- [ ] Health endpoints respond
- [ ] Database connectivity works
- [ ] Frontend is accessible
- [ ] API endpoints work
- [ ] Authentication flows work
- [ ] No critical errors in logs

---

## 💡 Tips

1. **Start with Verification:** Always verify before deploying
   ```bash
   ./scripts/run-all-scripts.sh verify all production https://app.example.com
   ```

2. **Use Master Runner:** Use the master runner for organized execution
   ```bash
   ./scripts/run-all-scripts.sh [category] [script]
   ```

3. **Check Scripts First:** List available scripts
   ```bash
   ls -la scripts/*.sh
   ```

4. **Read Script Help:** Most scripts have usage information
   ```bash
   head -20 scripts/verify-all-features.sh
   ```

---

## 🆘 Troubleshooting

### Script Not Found
```bash
# Make sure scripts are executable
chmod +x scripts/*.sh

# Check script exists
ls -la scripts/verify-backend-functions.sh
```

### Permission Denied
```bash
# Fix permissions
chmod +x scripts/run-all-scripts.sh
```

### Script Errors
```bash
# Run with verbose output
bash -x scripts/verify-backend-functions.sh
```

---

**Total Scripts Available:** 103+ scripts organized and ready to use

**See:** [Production Deployment Orchestration](../docs/deployment/PRODUCTION_DEPLOYMENT_ORCHESTRATION.md) for detailed deployment guide

