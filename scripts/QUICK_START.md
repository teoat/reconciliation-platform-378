# Quick Start - Running All Scripts

**Last Updated:** 2025-01-25

---

## 🚀 Master Script Runner

Run all scripts with the master runner:

```bash
# Interactive menu
./scripts/run-all-scripts.sh

# Run specific category
./scripts/run-all-scripts.sh deployment orchestrate v1.0.0 production
./scripts/run-all-scripts.sh verify all production
./scripts/run-all-scripts.sh test all
```

---

## 📋 Script Categories

### 1. Deployment Scripts

```bash
# Full production deployment
./scripts/run-all-scripts.sh deployment orchestrate v1.0.0 production

# Quick staging
./scripts/run-all-scripts.sh deployment quick v1.0.0

# Staging only
./scripts/run-all-scripts.sh deployment staging v1.0.0

# Production only
./scripts/run-all-scripts.sh deployment production v1.0.0

# Docker deployment
./scripts/run-all-scripts.sh deployment docker staging
```

### 2. Verification Scripts

```bash
# Verify all services and features
./scripts/run-all-scripts.sh verify all production https://app.example.com

# Verify services only
./scripts/run-all-scripts.sh verify services production

# Verify features only
./scripts/run-all-scripts.sh verify features

# Run smoke tests
./scripts/run-all-scripts.sh verify smoke production https://app.example.com
```

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

### 4. Diagnostic Scripts

```bash
# Run all diagnostics
./scripts/run-all-scripts.sh diagnostic all

# Comprehensive diagnostic
./scripts/run-all-scripts.sh diagnostic comprehensive
```

### 5. Maintenance Scripts

```bash
# Run all maintenance
./scripts/run-all-scripts.sh maintenance all

# Technical debt audit
./scripts/run-all-scripts.sh maintenance audit

# Update dependencies
./scripts/run-all-scripts.sh maintenance dependencies
```

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
# 1. Verify everything
./scripts/run-all-scripts.sh verify all production https://app.example.com

# 2. Run tests
./scripts/run-all-scripts.sh test all

# 3. Deploy to production
./scripts/run-all-scripts.sh deployment orchestrate v1.0.0 production

# 4. Verify deployment
./scripts/run-all-scripts.sh verify all production https://app.example.com
```

### Quick Staging Deployment

```bash
# Quick deploy to staging
./scripts/run-all-scripts.sh deployment quick v1.0.0

# Verify staging
./scripts/run-all-scripts.sh verify all staging https://staging.example.com
```

### Feature Verification

```bash
# Verify all features
./scripts/verify-all-features.sh production https://app.example.com
```

---

## 📊 Script Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `run-all-scripts.sh` | Master runner | `./scripts/run-all-scripts.sh [category] [script]` |
| `orchestrate-production-deployment.sh` | Full deployment | `./scripts/orchestrate-production-deployment.sh v1.0.0 production` |
| `verify-all-features.sh` | Feature verification | `./scripts/verify-all-features.sh production https://app.example.com` |
| `verify-all-services.sh` | Service verification | `./scripts/verify-all-services.sh production https://app.example.com` |
| `smoke-tests.sh` | Smoke tests | `./scripts/smoke-tests.sh production https://app.example.com` |

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

**See:** [Production Deployment Orchestration](../docs/deployment/PRODUCTION_DEPLOYMENT_ORCHESTRATION.md) for detailed guide

