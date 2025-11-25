# Quick Commands - Fast Script Execution

**Last Updated:** 2025-01-25

---

## 🚀 Quick Commands Script

A simplified interface for the most common operations.

### Usage
```bash
./scripts/QUICK_COMMANDS.sh [command]
```

---

## 📋 Available Commands

### Verification Commands

**Verify Everything:**
```bash
./scripts/QUICK_COMMANDS.sh verify
```
Runs both backend and frontend verification.

**Verify Backend Only:**
```bash
./scripts/QUICK_COMMANDS.sh verify-backend
```

**Verify Frontend Only:**
```bash
./scripts/QUICK_COMMANDS.sh verify-frontend
```

---

### Deployment Commands

**Deploy to Staging:**
```bash
./scripts/QUICK_COMMANDS.sh deploy-staging [version]
./scripts/QUICK_COMMANDS.sh deploy-staging v1.0.0
```

**Deploy to Production:**
```bash
./scripts/QUICK_COMMANDS.sh deploy-prod [version]
```
*Note: Production deployment requires full orchestration script*

---

### Testing Commands

**Run All Tests:**
```bash
./scripts/QUICK_COMMANDS.sh test
```

**Run Quick Tests:**
```bash
./scripts/QUICK_COMMANDS.sh test-quick
```

---

### Status Command

**Show System Status:**
```bash
./scripts/QUICK_COMMANDS.sh status
```
Shows verification results and script counts.

---

## 💡 Examples

### Quick Verification
```bash
# Verify everything
./scripts/QUICK_COMMANDS.sh verify

# Just backend
./scripts/QUICK_COMMANDS.sh verify-backend

# Just frontend
./scripts/QUICK_COMMANDS.sh verify-frontend
```

### Quick Deployment
```bash
# Staging
./scripts/QUICK_COMMANDS.sh deploy-staging v1.0.0

# Production (shows command to run)
./scripts/QUICK_COMMANDS.sh deploy-prod v1.0.0
```

### Quick Testing
```bash
# All tests
./scripts/QUICK_COMMANDS.sh test

# Quick tests only
./scripts/QUICK_COMMANDS.sh test-quick
```

### Check Status
```bash
./scripts/QUICK_COMMANDS.sh status
```

---

## 🆘 Help

Show all available commands:
```bash
./scripts/QUICK_COMMANDS.sh help
```

---

## 📚 Related Documentation

- [Run All Scripts Guide](./RUN_ALL_SCRIPTS_GUIDE.md) - Complete guide
- [Quick Reference](./QUICK_REFERENCE.md) - Quick reference card

---

**Quick and easy script execution!**

