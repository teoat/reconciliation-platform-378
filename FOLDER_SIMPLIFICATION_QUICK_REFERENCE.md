# Folder Simplification - Quick Reference: Problems & Fixes

**Quick lookup guide for folder consolidation issues and solutions**

---

## 🔴 Problems & Fixes

### 1. Types Directory (`types/` → `frontend/src/types/`)

**Problem:**
- 2 files import from root `types/`: `useWebSocketIntegration.ts`, `store.ts`
- Import path `../../../types` will break after move

**Fix:**
```typescript
// ❌ BEFORE
import type { ... } from '../../../types';

// ✅ AFTER
import type { ... } from '@/types';  // Use path alias
```

**Files to Update:**
- `frontend/src/hooks/useWebSocketIntegration.ts` (Line 16)
- `frontend/src/store/store.ts` (Line 22)

---

### 2. Monitoring Directory (`monitoring/` → Archive)

**Problem:**
- Root `monitoring/` duplicates `infrastructure/monitoring/`
- Docker-compose may reference root path

**Fix:**
```yaml
# ❌ BEFORE (if exists)
volumes:
  - ./monitoring/grafana:/etc/grafana

# ✅ AFTER
volumes:
  - ./infrastructure/monitoring/grafana:/etc/grafana
```

**Files to Check:**
- `docker-compose.yml`
- `docker-compose.monitoring.yml`
- `scripts/start-database.sh`

---

### 3. Docker Directory (`docker/` → `infrastructure/docker/`)

**Problem:**
- Root `docker/` only has examples
- Should be in infrastructure

**Fix:**
```bash
# Simple move - no code changes needed
mv docker/examples infrastructure/docker/examples
rmdir docker
```

**No code changes required** ✅

---

### 4. Nginx Directory (`nginx/` → `infrastructure/nginx/`)

**Problem:**
- Two nginx directories exist
- Need to verify which is used

**Fix:**
```yaml
# ❌ BEFORE (if root is used)
volumes:
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf

# ✅ AFTER
volumes:
  - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
```

**Action:** Compare directories first, then consolidate

---

### 5. Test Directories (`__tests__/`, `e2e/` → Consolidate)

**Problem:**
- Multiple test directories at root
- Test configs may reference root paths

**Fix:**
```json
// ❌ BEFORE (package.json)
{
  "scripts": {
    "test": "jest --testPathPattern=__tests__",
    "test:e2e": "playwright test e2e/"
  }
}

// ✅ AFTER
{
  "scripts": {
    "test": "jest --testPathPattern=frontend/src/__tests__",
    "test:e2e": "playwright test frontend/e2e/"
  }
}
```

**Files to Update:**
- `package.json`
- `jest.config.js`
- `playwright.config.ts`
- `.github/workflows/*.yml`

---

### 6. Root Code Directories (`utils/`, `hooks/`, `constants/`)

**Problem:**
- Root directories may have imports
- Need to verify before consolidation

**Fix:**
```typescript
// ❌ BEFORE (if exists)
import { util } from '../../../utils';

// ✅ AFTER
import { util } from '@/utils';  // Use path alias
```

**Action:** Run import search first, then consolidate

---

### 7. Infrastructure (`k8s/`, `terraform/` → `infrastructure/`)

**Problem:**
- Root infrastructure dirs should be in `infrastructure/`
- Deployment scripts reference root paths

**Fix:**
```bash
# ❌ BEFORE
kubectl apply -f k8s/base/
terraform init terraform/

# ✅ AFTER
kubectl apply -f infrastructure/kubernetes/base/
terraform init infrastructure/terraform/
```

**Files to Update:**
- `scripts/deploy-production.sh`
- `scripts/deploy.sh`
- `.github/workflows/deploy.yml`

---

## 📋 Quick Checklist

### Before Migration
- [ ] Run `./scripts/verify-folder-consolidation.sh <directory>` for each directory
- [ ] Check all imports: `grep -r "from.*\.\.\/\.\.\/\.\.\/" frontend/ backend/`
- [ ] Backup: `./scripts/consolidate-folders.sh 1` (creates backup automatically)
- [ ] Run test suite: `npm test && npm run test:e2e`

### After Migration
- [ ] Update import paths (see fixes above)
- [ ] Update docker-compose paths
- [ ] Update test configurations
- [ ] Update deployment scripts
- [ ] Run test suite: `npm test && npm run test:e2e`
- [ ] Verify builds: `npm run build`

---

## 🛠️ Tools Available

1. **Verification**: `./scripts/verify-folder-consolidation.sh <directory>`
2. **Migration**: `./scripts/consolidate-folders.sh [phase]`
3. **Deep Analysis**: See `FOLDER_SIMPLIFICATION_DEEP_ANALYSIS.md`

---

## ⚡ Quick Commands

```bash
# Verify a directory before archiving
./scripts/verify-folder-consolidation.sh monitoring

# Run Phase 1 (low risk)
./scripts/consolidate-folders.sh 1

# Find all imports from root directories
grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/types" frontend/ backend/

# Check docker-compose references
grep -r "monitoring\|nginx\|k8s" docker-compose*.yml
```

---

**Full Details**: [FOLDER_SIMPLIFICATION_DEEP_ANALYSIS.md](./FOLDER_SIMPLIFICATION_DEEP_ANALYSIS.md)



