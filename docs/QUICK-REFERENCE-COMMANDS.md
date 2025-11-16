# Quick Reference Commands

Quick access to common development, testing, and deployment commands for the Reconciliation Platform.

## 🚀 Performance & Optimization

### Bundle Size Management
```bash
# Build and verify bundle size in one command
npm run build:verify

# Check bundle size only (requires build first)
npm run check-bundle-size

# Strict bundle size check (2.5MB limit)
npm run check-bundle-size:strict

# Analyze bundle composition
npm run analyze-bundle
```

### Database Query Optimization
```bash
# Apply performance indexes (requires DATABASE_URL)
npm run db:apply-indexes

# Or use script directly
bash scripts/apply-db-indexes.sh

# Verify indexes are applied
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%';"
```

### Performance Verification
```bash
# Comprehensive performance verification
npm run performance:verify

# Verify all optimizations at once
bash scripts/verify-performance.sh
```

## 🧪 Development

### Frontend Development
```bash
# Start development server (Next.js)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Backend Development
```bash
# Run backend server (from backend directory)
cd backend && cargo run

# Run with migrations
cd backend && cargo run --bin backend
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## 🔍 Code Quality

### Linting & Formatting
```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

### Code Analysis
```bash
# Audit technical debt
npm run audit:debt

# Find large files
npm run files:large

# Quality check (audit + coverage + files)
npm run quality:check
```

## 📊 Performance Monitoring

### Performance Tests
```bash
# Run performance tests
npm run performance:test

# Create performance baseline
npm run performance:baseline

# Run performance tests in CI
npm run performance:ci

# Check performance budget
npm run performance:budget:check

# Enforce performance budget
npm run performance:budget:enforce
```

### Monitoring
```bash
# Check performance KPIs
npm run performance:kpis

# Monitor performance continuously (60s interval)
npm run performance:monitor:continuous

# Run CI performance check
npm run performance:ci-check
```

## 🔐 Security & Production

### Security Audits
```bash
# Security audit (requires Agent 4 implementation)
# npm run security:audit

# Check for sensitive data in console logs
npm run remove-console-logs:dry-run

# Replace console.log with secure logger
npm run remove-console-logs:replace
```

### Deployment Preparation
```bash
# 1. Verify bundle size
npm run build:verify

# 2. Apply database indexes
npm run db:apply-indexes

# 3. Run full performance verification
npm run performance:verify

# 4. Run production deployment checklist (comprehensive check)
npm run deploy:check
# Or directly:
bash scripts/production-deployment-checklist.sh
```

## 📦 Build & Bundle

### Code Splitting
```bash
# Analyze code splitting
npm run code-splitting:analyze

# Implement code splitting optimizations
npm run code-splitting:implement
```

### PWA
```bash
# Validate PWA assets
npm run pwa:validate

# Build with PWA validation
npm run pwa:build
```

## 🔄 Maintenance

### Cache Management
```bash
# Clean frontend cache (Vite)
cd frontend && npm run cache:clean

# Clean build artifacts
cd frontend && npm run build:clean
```

### Reports
```bash
# Review all reports
npm run reports:review

# Check execution checklist
npm run execution:checklist
```

## 🎯 S-Grade Targets Quick Check

Run this to verify all S-grade performance targets:

```bash
# One command to check everything
npm run performance:verify && npm run build:verify
```

Expected output:
- ✅ Bundle size <3MB
- ✅ Memory optimization active
- ✅ Database indexes applied (if DATABASE_URL set)
- ✅ Virtual scrolling enabled
- ✅ Service worker active

## 🚨 Troubleshooting

### Bundle Size Too Large
```bash
# Analyze what's taking space
npm run analyze-bundle

# Check largest chunks
npm run check-bundle-size

# Review recommendations in output
```

### Database Performance Issues
```bash
# Apply indexes
npm run db:apply-indexes

# Check index count
psql $DATABASE_URL -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';"
```

### Memory Issues
```bash
# Check memory monitoring is initialized
grep -r "initializeMemoryMonitoring" frontend/src/App.tsx

# Verify memory cleanup hooks
grep -r "useComprehensiveCleanup" frontend/src/components/DataProvider.tsx
```

## 📝 Common Workflows

### Before Committing
```bash
npm run lint:fix
npm run format
npm test
npm run check-bundle-size
```

### Before Deploying to Staging
```bash
npm run build:verify
npm run performance:verify
npm run db:apply-indexes  # If database changes
```

### Before Deploying to Production
```bash
npm run build:verify
npm run performance:verify
npm run db:apply-indexes
bash scripts/production-deployment-checklist.sh
npm run test:ci
npm run performance:ci-check
```

## 🔗 Related Documentation

- **Deployment Guide**: See [../DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Support & Maintenance**: See [SUPPORT_MAINTENANCE_GUIDE.md](SUPPORT_MAINTENANCE_GUIDE.md)
- **API Documentation**: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

**Last Updated**: January 2025 - Quick reference for common workflows and commands.

