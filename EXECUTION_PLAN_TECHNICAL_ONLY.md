# Technical Execution Plan - Tests & Docs Deferred

**Current Score**: 94/100  
**Target Score**: 100/100  
**Strategy**: Complete all technical improvements, defer tests and documentation to final week  
**Status**: 🚀 READY TO EXECUTE

---

## 📊 Quick Summary

| Phase | Focus | Points | Time | Status |
|-------|-------|--------|------|--------|
| **Phase 1** | Code Quality (Refactoring) | +31 | 36h | 📋 Ready |
| **Phase 2** | Performance (Optimization) | +30 | 24h | 📋 Ready |
| **Phase 3** | Infrastructure (Docker/Build) | +11 | 16h | 📋 Ready |
| **Phase 4** | Polish & Validation | +6 | 8h | 📋 Ready |
| **Phase 5** | Tests (Deferred) | +40 | 60h | ⏸️ Later |
| **Phase 6** | Documentation (Deferred) | +15 | 40h | ⏸️ Later |

**Technical Work Total**: +78 points in ~84 hours (3.5 weeks)  
**Projected Score After Technical**: 97-98/100  
**Remaining (Tests + Docs)**: +2-3 points in ~100 hours

---

## 🎯 Phase 1: Code Quality & Refactoring (36 hours)

### Week 1: Large File Refactoring

#### TODO-014 to TODO-017: Refactor IngestionPage.tsx (3,344 → ~500 lines)
**Impact**: +13 points (Code Quality +8, Maintainability +5)  
**Time**: 20 hours

**Steps**:
1. **Analyze structure** (2h)
   - Map all functions and components
   - Identify logical groupings
   - Create extraction plan

2. **Extract custom hooks** (8h)
   ```typescript
   // Create frontend/src/hooks/ingestion/
   useIngestionData.ts       // Data fetching & state
   useIngestionValidation.ts // Validation logic
   useIngestionUpload.ts     // Upload handling
   useIngestionProgress.ts   // Progress tracking
   ```

3. **Extract components** (8h)
   ```typescript
   // Create frontend/src/components/ingestion/
   IngestionUploader.tsx     // Upload UI
   IngestionValidator.tsx    // Validation UI
   IngestionProgress.tsx     // Progress display
   IngestionPreview.tsx      // Data preview
   IngestionSettings.tsx     // Settings panel
   IngestionMain.tsx         // Main orchestrator (500 lines)
   ```

4. **Verify & cleanup** (2h)
   - Test all functionality
   - Remove unused code
   - Fix linter warnings

**Commands**:
```bash
# Create directory structure
mkdir -p frontend/src/hooks/ingestion
mkdir -p frontend/src/components/ingestion

# After refactoring
npm run lint
npm run build
git add frontend/src/pages/IngestionPage.tsx frontend/src/hooks/ingestion/ frontend/src/components/ingestion/
git commit -m "refactor: split IngestionPage into modular components (3344→500 lines)"
```

---

#### TODO-018: Refactor ReconciliationPage.tsx (2,821 → ~500 lines)
**Impact**: +13 points (Code Quality +8, Maintainability +5)  
**Time**: 16 hours

**Steps**:
1. **Analyze structure** (2h)
2. **Extract hooks** (6h)
   ```typescript
   // Create frontend/src/hooks/reconciliation/
   useReconciliationJob.ts
   useReconciliationResults.ts
   useReconciliationFilters.ts
   useReconciliationExport.ts
   ```

3. **Extract components** (6h)
   ```typescript
   // Create frontend/src/components/reconciliation/
   ReconciliationJobPanel.tsx
   ReconciliationResultsTable.tsx
   ReconciliationFilters.tsx
   ReconciliationExport.tsx
   ReconciliationMain.tsx (500 lines)
   ```

4. **Verify & cleanup** (2h)

**Commands**:
```bash
mkdir -p frontend/src/hooks/reconciliation
mkdir -p frontend/src/components/reconciliation
# After refactoring...
git commit -m "refactor: split ReconciliationPage into modular components (2821→500 lines)"
```

---

#### TODO-019: Split types/index.ts into domain-specific modules
**Impact**: +4 points (Code Quality)  
**Time**: 4 hours

**Steps**:
```typescript
// Split into:
types/auth.ts           // AuthUser, AuthState, etc.
types/reconciliation.ts // ReconciliationJob, Result, etc.
types/ingestion.ts      // IngestionJob, ValidationRule, etc.
types/api.ts            // API request/response types
types/ui.ts             // UI-specific types
types/index.ts          // Re-exports only
```

**Commands**:
```bash
mkdir -p frontend/src/types
# Create individual type files
# Update imports across codebase
git commit -m "refactor: split types/index.ts into domain-specific modules"
```

---

#### TODO-020 to TODO-022: Consolidate duplicate services
**Impact**: +6 points (Maintainability)  
**Time**: 6 hours

**Analysis Required**:
```bash
# Find duplicate service patterns
find frontend/src/services -type f -name "*.ts" | xargs wc -l | sort -n
grep -rn "export class.*Service" frontend/src/services/
```

**Consolidation Plan**:
1. Merge similar API services (2h)
2. Extract common HTTP client logic (2h)
3. Update imports across codebase (2h)

---

## 🚀 Phase 2: Performance Optimization (24 hours)

### Week 2: Performance Improvements

#### TODO-032: Implement code splitting
**Impact**: +8 points (Performance)  
**Time**: 8 hours

**Implementation**:
```typescript
// frontend/src/router.tsx
import { lazy, Suspense } from 'react';

const IngestionPage = lazy(() => import('./pages/IngestionPage'));
const ReconciliationPage = lazy(() => import('./pages/ReconciliationPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Wrap in Suspense with loading fallback
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/ingestion" element={<IngestionPage />} />
    {/* ... */}
  </Routes>
</Suspense>
```

**Steps**:
1. Convert all route components to lazy imports (4h)
2. Add loading states and error boundaries (2h)
3. Test lazy loading behavior (2h)

**Commands**:
```bash
npm run build
npm run build:analyze  # Check bundle sizes
git commit -m "perf: implement code splitting for route-based lazy loading"
```

---

#### TODO-033: Optimize bundle dependencies
**Impact**: +5 points (Performance)  
**Time**: 4 hours

**Analysis**:
```bash
npm run build:analyze
# Look for:
# - Large moment.js (replace with date-fns)
# - Unused lodash functions (use lodash-es)
# - Duplicate dependencies
```

**Optimizations**:
```bash
# Replace moment.js with date-fns
npm uninstall moment
npm install date-fns

# Use lodash-es instead of lodash
npm uninstall lodash
npm install lodash-es

# Update imports throughout codebase
```

---

#### TODO-034: React.memo and useMemo optimization
**Impact**: +4 points (Performance)  
**Time**: 4 hours

**Target Components** (find with):
```bash
# Find components that re-render frequently
# Focus on list items, large tables, expensive calculations
grep -rn "export.*function.*Props" frontend/src/components/
```

**Implementation**:
```typescript
// Memoize expensive components
export const ReconciliationRow = React.memo(({ data }) => {
  const computed = useMemo(() => expensiveCalc(data), [data]);
  return <tr>{/* ... */}</tr>;
});

// Memoize callbacks passed to children
const handleClick = useCallback(() => {
  // handler
}, [dependency]);
```

**Steps**:
1. Identify re-render hotspots (1h)
2. Apply React.memo to list items (2h)
3. Add useMemo/useCallback where needed (1h)

---

#### TODO-037: Analyze and optimize slow queries
**Impact**: +6 points (Performance)  
**Time**: 2 hours

**Analysis**:
```bash
# Enable query logging in PostgreSQL
# Add to postgresql.conf:
# log_min_duration_statement = 100  # Log queries > 100ms

# Or use explain analyze:
psql -U postgres -d reconciliation -c "EXPLAIN ANALYZE SELECT ..."
```

**Steps**:
1. Review application logs for slow queries (30min)
2. Run EXPLAIN ANALYZE on slow queries (30min)
3. Document optimization opportunities (1h)

---

#### TODO-038: Create database indexes (READY TO APPLY)
**Impact**: +10 points (Performance)  
**Time**: 2 hours

**Note**: Migration files already created, just need to apply!

**Commands**:
```bash
cd backend
# Review the migration
cat migrations/2024_add_performance_indexes.sql

# Apply migration
diesel migration run

# Verify indexes
psql -U postgres -d reconciliation -c "\d+ users"
psql -U postgres -d reconciliation -c "\d+ reconciliation_jobs"
psql -U postgres -d reconciliation -c "\d+ match_results"

git add migrations/
git commit -m "perf: apply database indexes for query optimization"
```

---

#### TODO-039: Fix N+1 query patterns
**Impact**: +6 points (Performance)  
**Time**: 4 hours

**Find N+1 queries**:
```bash
# Search for queries in loops
grep -rn "for.*in\|map(" backend/src/ | grep "query\|select"
```

**Fix with eager loading**:
```rust
// Before (N+1)
for job in jobs {
    let results = get_results_for_job(job.id).await?;
}

// After (1 query)
let job_ids: Vec<i32> = jobs.iter().map(|j| j.id).collect();
let all_results = get_results_for_jobs(&job_ids).await?;
```

---

#### TODO-040 & TODO-041: Implement Redis caching
**Impact**: +7 points (Performance)  
**Time**: 8 hours

**Implementation**:
```rust
// backend/src/cache/redis_cache.rs
use redis::{Client, Commands};

pub struct CacheService {
    client: Client,
}

impl CacheService {
    pub async fn get_or_compute<T, F>(
        &self,
        key: &str,
        ttl: usize,
        compute: F,
    ) -> AppResult<T>
    where
        F: FnOnce() -> AppResult<T>,
    {
        // Try cache first
        if let Some(cached) = self.get(key)? {
            return Ok(cached);
        }
        
        // Compute and cache
        let value = compute()?;
        self.set(key, &value, ttl)?;
        Ok(value)
    }
}
```

**Cache Targets**:
1. User session data (30min TTL)
2. Reconciliation job status (5min TTL)
3. Dashboard statistics (15min TTL)
4. Frequently accessed configs (1hr TTL)

**Steps**:
1. Add redis crate to Cargo.toml (30min)
2. Implement CacheService (4h)
3. Integrate with endpoints (3h)
4. Test cache invalidation (30min)

---

## 🏗️ Phase 3: Infrastructure Optimization (16 hours)

### Week 3: Docker & Build Performance

#### TODO-044: Optimize Docker images
**Impact**: +5 points (Performance)  
**Time**: 8 hours

**Current Issues**:
- Large image sizes
- No layer caching optimization
- Unnecessary dependencies in production

**Optimizations**:
```dockerfile
# backend/Dockerfile
FROM rust:1.75 AS builder
WORKDIR /app

# Cache dependencies
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Build actual application
COPY . .
RUN cargo build --release

# Production image
FROM debian:bookworm-slim
COPY --from=builder /app/target/release/reconciliation-backend /usr/local/bin/
CMD ["reconciliation-backend"]
```

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build
COPY . .
RUN npm run build

# Production image
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

**Steps**:
1. Implement multi-stage builds (4h)
2. Optimize layer caching (2h)
3. Remove dev dependencies from production (1h)
4. Test image sizes and build times (1h)

**Expected Results**:
- Backend image: ~500MB → ~100MB
- Frontend image: ~1GB → ~50MB
- Build time: ~10min → ~3min (with cache)

---

#### TODO-046: Build time optimization
**Impact**: +3 points (Performance)  
**Time**: 4 hours

**Frontend Build Optimization**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
```

**Backend Build Optimization**:
```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1

[profile.dev]
opt-level = 1  # Faster dev builds
```

**Steps**:
1. Configure Vite chunk splitting (1h)
2. Optimize Cargo build profiles (1h)
3. Add sccache for Rust builds (1h)
4. Measure improvements (1h)

---

#### TODO-047: Add performance monitoring
**Impact**: +3 points (Maintainability)  
**Time**: 4 hours

**Backend Monitoring**:
```rust
// backend/src/middleware/metrics.rs
use actix_web::{dev::ServiceRequest, Error, HttpResponse};
use prometheus::{Histogram, Counter};

lazy_static! {
    static ref REQUEST_DURATION: Histogram = register_histogram!(
        "http_request_duration_seconds",
        "HTTP request duration"
    ).unwrap();
    
    static ref REQUEST_COUNT: Counter = register_counter!(
        "http_requests_total",
        "Total HTTP requests"
    ).unwrap();
}
```

**Frontend Monitoring**:
```typescript
// frontend/src/utils/performance.ts
export const measurePageLoad = () => {
  if (window.performance) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log(`Page load time: ${pageLoadTime}ms`);
    
    // Send to analytics
    trackEvent('performance', 'page_load', pageLoadTime);
  }
};
```

**Steps**:
1. Add Prometheus metrics to backend (2h)
2. Add performance tracking to frontend (1h)
3. Create monitoring dashboard (1h)

---

## 🎨 Phase 4: Polish & Validation (8 hours)

### Final Technical Cleanup

#### Circular Dependency Resolution
**Impact**: +3 points (Code Quality)  
**Time**: 3 hours

**Find circular dependencies**:
```bash
npx madge --circular frontend/src/
```

**Resolve**:
1. Extract shared utilities to common modules
2. Use dependency injection where appropriate
3. Restructure import hierarchy

---

#### Reduce Code Duplication
**Impact**: +2 points (Code Quality)  
**Time**: 2 hours

**Find duplicates**:
```bash
npx jscpd frontend/src/ --min-lines 10 --min-tokens 50
```

**Refactor**:
1. Extract common patterns to utilities
2. Create reusable components
3. Consolidate similar functions

---

#### Address High-Priority TODOs in Code
**Impact**: +3 points (Maintainability)  
**Time**: 3 hours

**Find TODOs**:
```bash
grep -rn "// TODO" backend/src/ frontend/src/ | grep -i "priority\|critical\|important"
```

**Address**:
1. Fix critical TODOs (1.5h)
2. Document or remove others (1.5h)

---

## 📋 Execution Checklist

### Phase 1: Code Quality (Week 1)
- [ ] TODO-014-017: Refactor IngestionPage (20h)
- [ ] TODO-018: Refactor ReconciliationPage (16h)
- [ ] TODO-019: Split types/index.ts (4h)
- [ ] TODO-020-022: Consolidate services (6h)
- [ ] **Checkpoint**: Verify all pages work, run linter

### Phase 2: Performance (Week 2)
- [ ] TODO-032: Code splitting (8h)
- [ ] TODO-033: Optimize dependencies (4h)
- [ ] TODO-034: React.memo optimization (4h)
- [ ] TODO-037: Analyze slow queries (2h)
- [ ] TODO-038: Apply database indexes (2h) ⚡ QUICK WIN
- [ ] TODO-039: Fix N+1 queries (4h)
- [ ] TODO-040-041: Redis caching (8h)
- [ ] **Checkpoint**: Run performance benchmarks

### Phase 3: Infrastructure (Week 3)
- [ ] TODO-044: Optimize Docker images (8h)
- [ ] TODO-046: Build optimization (4h)
- [ ] TODO-047: Performance monitoring (4h)
- [ ] **Checkpoint**: Measure build times and image sizes

### Phase 4: Polish (Week 3-4)
- [ ] Fix circular dependencies (3h)
- [ ] Reduce code duplication (2h)
- [ ] Address critical TODOs (3h)
- [ ] **Final Validation**: Run full build, check linter, verify functionality

---

## 🎯 Success Metrics

### Code Quality
- IngestionPage: 3,344 → ~500 lines ✅
- ReconciliationPage: 2,821 → ~500 lines ✅
- types/index.ts: Split into 5+ domain files ✅
- Circular dependencies: 0 ✅
- Code duplication: <5% ✅

### Performance
- Bundle size: -30% ✅
- Initial page load: <2s ✅
- Database query time: <100ms average ✅
- Cache hit rate: >60% ✅
- Docker image sizes: -80% ✅

### Infrastructure
- Backend build time: <5min ✅
- Frontend build time: <2min ✅
- Monitoring dashboards: Active ✅

---

## 🚀 Quick Start Commands

### Daily Workflow
```bash
# 1. Pull latest
git pull origin master

# 2. Create feature branch
git checkout -b feat/phase1-refactoring

# 3. Make changes...

# 4. Verify
npm run lint
npm run build
cargo clippy
cargo build

# 5. Commit
git add .
git commit -m "refactor: [specific change]"

# 6. Push
git push origin feat/phase1-refactoring
```

### Health Check Script
```bash
#!/bin/bash
echo "🔍 Running health checks..."

echo "📦 Checking dependencies..."
npm outdated
cargo outdated

echo "🧹 Linting..."
npm run lint
cargo clippy

echo "🏗️ Building..."
npm run build
cargo build --release

echo "📊 Bundle analysis..."
npm run build:analyze

echo "✅ All checks complete!"
```

---

## 📞 When to Defer vs When to Act

### ✅ Do Now (Technical)
- Refactoring
- Performance optimization
- Build optimization
- Infrastructure improvements
- Code cleanup

### ⏸️ Defer (Tests & Docs)
- Unit tests (except critical bugs)
- Integration tests
- E2E tests
- API documentation
- Code comments
- User guides

---

## 🎉 Projected Final Score

| Category | Current | After Technical | After Tests | After Docs | Target |
|----------|---------|----------------|-------------|------------|--------|
| Security | 100/100 | 100/100 | 100/100 | 100/100 | ✅ |
| Code Quality | 69/100 | 100/100 | 100/100 | 100/100 | ✅ |
| Performance | 70/100 | 100/100 | 100/100 | 100/100 | ✅ |
| Testing | 60/100 | 60/100 | 100/100 | 100/100 | ⏸️ |
| Documentation | 85/100 | 85/100 | 85/100 | 100/100 | ⏸️ |
| Maintainability | 75/100 | 100/100 | 100/100 | 100/100 | ✅ |
| **Overall** | **94/100** | **97/100** | **99/100** | **100/100** | 🎯 |

---

**Ready to execute?** Let's start with Phase 1, TODO-014! 🚀

**Last Updated**: November 16, 2025  
**Estimated Completion**: 3-4 weeks for technical work  
**Mode**: 🔥 FULL ACCELERATION

