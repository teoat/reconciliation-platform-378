# Scripts Quick Reference

**Last Updated:** 2025-01-25

---

## 🚀 Most Common Commands

### Verify Everything
```bash
# Backend functions (49/49 verified)
./scripts/verify-backend-functions.sh

# Frontend features (23/23 verified)
./scripts/verify-frontend-features.sh

# All features and services
./scripts/run-all-scripts.sh verify all production https://app.example.com
```

### Deploy to Production
```bash
# Full production deployment
./scripts/run-all-scripts.sh deployment orchestrate v1.0.0 production

# Quick staging
./scripts/run-all-scripts.sh deployment quick v1.0.0
```

### Run Tests
```bash
# All tests
./scripts/run-all-scripts.sh test all

# Quick tests
./scripts/run-all-scripts.sh test quick
```

---

## 📋 Master Script Runner

### Interactive Menu
```bash
./scripts/run-all-scripts.sh
```

### Categories
1. **deployment** - Deployment scripts
2. **verify** - Verification scripts
3. **test** - Testing scripts
4. **diagnostic** - Diagnostic scripts
5. **maintenance** - Maintenance scripts
6. **setup** - Setup scripts

### Usage Pattern
```bash
./scripts/run-all-scripts.sh [category] [script_name] [args...]
```

---

## ✅ Verification Results

- **Backend Functions:** 49/49 ✅
- **Frontend Features:** 23/23 ✅
- **All Services:** Verified ✅

---

## 📚 Full Documentation

- [Run All Scripts Guide](./RUN_ALL_SCRIPTS_GUIDE.md) - Complete guide
- [Quick Start](../docs/project-management/COMPLETE_STATUS_REPORT.md) - Status report

---

**Total Scripts:** 103+ available

