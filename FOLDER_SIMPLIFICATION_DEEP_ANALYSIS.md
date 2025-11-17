# Folder Simplification - Deep Analysis: Affected Files & Mitigation

**Date**: January 2025  
**Status**: Comprehensive Deep Analysis  
**Approach**: Incremental Analysis with Specific Fixes

---

## Executive Summary

This document provides a **deep dive analysis** of folder simplification, identifying:
- **Specific files affected** by each consolidation
- **Exact import paths** that will break
- **Detailed mitigation strategies** for each change
- **Before/After code examples** showing fixes
- **Step-by-step migration scripts** for safe execution

---

## Table of Contents

1. [Types Directory Consolidation](#1-types-directory-consolidation)
2. [Monitoring Directories Consolidation](#2-monitoring-directories-consolidation)
3. [Docker Directories Consolidation](#3-docker-directories-consolidation)
4. [Nginx Directories Consolidation](#4-nginx-directories-consolidation)
5. [Test Directories Consolidation](#5-test-directories-consolidation)
6. [Root Code Directories Consolidation](#6-root-code-directories-consolidation)
7. [Infrastructure Consolidation](#7-infrastructure-consolidation)
8. [Migration Scripts](#8-migration-scripts)

---

## 1. Types Directory Consolidation

### Current State

**Root `types/` Directory:**
```
types/
├── common/index.ts
├── data/index.ts
├── frenly.ts
├── index.ts
├── ingestion/index.ts
├── project/data.ts
├── project/index.ts
├── project.ts
├── reconciliation/index.ts
├── user/index.ts
└── websocket/index.ts
```

**Frontend `frontend/src/types/` Directory:**
```
frontend/src/types/
├── api.ts
├── backend-aligned.ts
├── circuitBreaker.ts
├── data.ts
├── frenly.ts
├── index.ts
├── ingestion/
├── metadata.ts
├── performance.ts
├── progress.ts
├── project.ts
├── service.ts
└── typescript.ts
```

### Affected Files

**Files Importing from Root `types/`:**

1. **`frontend/src/hooks/useWebSocketIntegration.ts`** (Line 16)
   ```typescript
   // ❌ CURRENT (BROKEN AFTER MOVE)
   import type {
     ReconciliationProgressMessage,
     ReconciliationCompletedMessage,
     ReconciliationErrorMessage,
     // ... more types
   } from '../../../types';
   ```

2. **`frontend/src/store/store.ts`** (Line 22)
   ```typescript
   // ❌ CURRENT (BROKEN AFTER MOVE)
   import type { ProjectSettings, DataSourceMetadata } from '../../../types';
   ```

### Problem Analysis

**Issue:**
- Root `types/` contains shared types used by frontend
- Frontend also has its own `frontend/src/types/` with some overlapping files
- Imports use relative path `../../../types` which will break when root `types/` is moved
- Some types may be duplicated between root and frontend locations

**Risk Level:** 🟡 **MEDIUM**
- 2 files directly affected
- Potential for more files if deeper search reveals more
- Type duplication needs resolution

### Mitigation Strategy

**Step 1: Identify All Affected Files**
```bash
# Find all imports from root types/
grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/types\|import.*['\"]\.\.\/\.\.\/\.\.\/types" frontend/ backend/ --include="*.{ts,tsx,js,jsx}"
```

**Step 2: Compare Types Between Locations**
```bash
# Compare root types/ with frontend/src/types/
diff -r types/ frontend/src/types/ --exclude="*.md"
```

**Step 3: Consolidation Plan**
- If root `types/` has unique types → Move to `frontend/src/types/`
- If duplicates exist → Keep frontend version, archive root
- If root has backend types → Move to `backend/src/types/` (if doesn't exist)

### Fixes Required

#### Fix 1: Update `frontend/src/hooks/useWebSocketIntegration.ts`

**Before:**
```typescript
import type {
  ReconciliationProgressMessage,
  ReconciliationCompletedMessage,
  ReconciliationErrorMessage,
  UserPresenceMessage,
  ProjectUpdateMessage,
  NotificationMessage,
  ConnectionStatusMessage,
  CollaborationUsersMessage,
  CollaborationCommentMessage,
  WebSocketMessage,
} from '../../../types';
```

**After (Option A - If types moved to frontend/src/types/):**
```typescript
import type {
  ReconciliationProgressMessage,
  ReconciliationCompletedMessage,
  ReconciliationErrorMessage,
  UserPresenceMessage,
  ProjectUpdateMessage,
  NotificationMessage,
  ConnectionStatusMessage,
  CollaborationUsersMessage,
  CollaborationCommentMessage,
  WebSocketMessage,
} from '@/types';  // Using path alias
```

**After (Option B - If using relative path):**
```typescript
import type {
  ReconciliationProgressMessage,
  ReconciliationCompletedMessage,
  ReconciliationErrorMessage,
  UserPresenceMessage,
  ProjectUpdateMessage,
  NotificationMessage,
  ConnectionStatusMessage,
  CollaborationUsersMessage,
  CollaborationCommentMessage,
  WebSocketMessage,
} from '../types';  // Relative to hooks/
```

#### Fix 2: Update `frontend/src/store/store.ts`

**Before:**
```typescript
import type { ProjectSettings, DataSourceMetadata } from '../../../types';
```

**After:**
```typescript
import type { ProjectSettings, DataSourceMetadata } from '@/types';
// OR
import type { ProjectSettings, DataSourceMetadata } from '../types';
```

### Migration Script

```bash
#!/bin/bash
# Consolidate types/ directory

set -e

echo "Step 1: Finding all imports from root types/"
grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/types\|import.*['\"]\.\.\/\.\.\/\.\.\/types" frontend/ backend/ --include="*.{ts,tsx,js,jsx}" > /tmp/types-imports.txt

echo "Found $(wc -l < /tmp/types-imports.txt) import statements"
echo "Review /tmp/types-imports.txt"

echo ""
echo "Step 2: Comparing types directories"
diff -r types/ frontend/src/types/ --exclude="*.md" > /tmp/types-diff.txt || true
echo "Differences saved to /tmp/types-diff.txt"

echo ""
echo "Step 3: Backup root types/"
cp -r types archive/types-backup-$(date +%Y%m%d)

echo ""
echo "Step 4: Move unique types to frontend/src/types/"
# This should be done manually after reviewing differences
echo "Manual step required: Review /tmp/types-diff.txt and move unique types"

echo ""
echo "Step 5: Update imports (run after moving types)"
# This will be done in next step with sed/find-replace
```

---

## 2. Monitoring Directories Consolidation

### Current State

**Root `monitoring/` Directory:**
```
monitoring/
├── grafana/
└── rules/
```

**Infrastructure `infrastructure/monitoring/` Directory:**
```
infrastructure/monitoring/
├── grafana/
│   └── dashboards/
├── logstash-exporter/
│   └── Dockerfile
└── rules/
```

### Affected Files

**Files Referencing Monitoring:**

1. **Docker Compose Files:**
   - `docker-compose.yml`
   - `docker-compose.monitoring.yml`
   - `docker-compose.dev.yml`

2. **Deployment Scripts:**
   - `scripts/start-database.sh`
   - `scripts/full-redeploy.sh`
   - `pre-deployment-check.sh`

3. **Configuration Files:**
   - `infrastructure/monitoring/prometheus.yml`

### Problem Analysis

**Issue:**
- Root `monitoring/` appears to be legacy/duplicate
- Infrastructure version is more complete
- Docker-compose files may reference root `monitoring/`
- Scripts may have hardcoded paths

**Risk Level:** 🟢 **LOW**
- Monitoring is infrastructure concern
- Should be in infrastructure/ directory
- Need to verify docker-compose references

### Mitigation Strategy

**Step 1: Check Docker Compose References**
```bash
grep -r "monitoring" docker-compose*.yml
```

**Step 2: Check Script References**
```bash
grep -r "monitoring" scripts/*.sh infrastructure/scripts/
```

**Step 3: Compare Contents**
```bash
diff -r monitoring/ infrastructure/monitoring/
```

### Fixes Required

#### Fix 1: Update Docker Compose Files

**Before (if exists):**
```yaml
volumes:
  - ./monitoring/grafana:/etc/grafana/provisioning
  - ./monitoring/rules:/etc/prometheus/rules
```

**After:**
```yaml
volumes:
  - ./infrastructure/monitoring/grafana:/etc/grafana/provisioning
  - ./infrastructure/monitoring/rules:/etc/prometheus/rules
```

#### Fix 2: Update Script References

**Before (if exists):**
```bash
MONITORING_DIR="./monitoring"
```

**After:**
```bash
MONITORING_DIR="./infrastructure/monitoring"
```

### Migration Script

```bash
#!/bin/bash
# Consolidate monitoring directories

set -e

echo "Step 1: Checking docker-compose references"
grep -r "monitoring" docker-compose*.yml || echo "No references found"

echo ""
echo "Step 2: Checking script references"
grep -r "monitoring" scripts/*.sh infrastructure/scripts/ 2>/dev/null || echo "No references found"

echo ""
echo "Step 3: Comparing directories"
diff -r monitoring/ infrastructure/monitoring/ || echo "Directories differ"

echo ""
echo "Step 4: Backup root monitoring/"
cp -r monitoring archive/infrastructure/monitoring-legacy-$(date +%Y%m%d)

echo ""
echo "Step 5: Archive root monitoring (after verification)"
# mv monitoring archive/infrastructure/monitoring-legacy
```

---

## 3. Docker Directories Consolidation

### Current State

**Root `docker/` Directory:**
```
docker/
└── examples/
```

**Infrastructure `infrastructure/docker/` Directory:**
```
infrastructure/docker/
├── Dockerfile.backend
├── Dockerfile.frontend
├── entrypoint.sh
└── nginx.conf
```

### Affected Files

**Files Referencing Docker:**

1. **Build Scripts:**
   - `build-backend.sh`
   - `deploy-backend.sh`
   - `apply-database-indexes.sh`

2. **Docker Compose Files:**
   - All `docker-compose*.yml` files

### Problem Analysis

**Issue:**
- Root `docker/` only contains examples
- Should be consolidated into infrastructure
- Low risk - examples are not used in builds

**Risk Level:** 🟢 **LOW**
- Examples are not referenced in builds
- Easy to move without breaking anything

### Fixes Required

**Simple Move:**
```bash
# Move examples to infrastructure
mv docker/examples infrastructure/docker/examples
rmdir docker
```

**No code changes needed** - examples are not imported/referenced

---

## 4. Nginx Directories Consolidation

### Current State

**Root `nginx/` Directory:**
```
nginx/
[unknown contents - need to check]
```

**Infrastructure `infrastructure/nginx/` Directory:**
```
infrastructure/nginx/
├── frontend.conf
└── nginx.conf
```

### Affected Files

**Files Referencing Nginx:**

1. **Docker Compose Files:**
   - `docker-compose.yml`
   - `docker-compose.backend.yml`

2. **Infrastructure Docker:**
   - `infrastructure/docker/nginx.conf`

3. **Deployment Scripts:**
   - Various deployment scripts

### Problem Analysis

**Issue:**
- Two nginx directories exist
- Need to verify which is actually used
- Docker-compose may reference either location

**Risk Level:** 🟡 **MEDIUM**
- Need careful verification
- Docker builds depend on correct paths

### Mitigation Strategy

**Step 1: Compare Contents**
```bash
diff -r nginx/ infrastructure/nginx/
```

**Step 2: Check Docker References**
```bash
grep -r "nginx" docker-compose*.yml
grep -r "nginx" infrastructure/docker/
```

**Step 3: Check for Unique Files**
```bash
# Find files only in root nginx/
comm -23 <(find nginx/ -type f | sort) <(find infrastructure/nginx/ -type f | sort)
```

### Fixes Required

**If root nginx/ has unique files:**
```bash
# Move unique files first
cp -r nginx/* infrastructure/nginx/
# Then archive root
mv nginx archive/infrastructure/nginx-legacy
```

**If docker-compose references root:**
```yaml
# Before
volumes:
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf

# After
volumes:
  - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
```

---

## 5. Test Directories Consolidation

### Current State

**Root Test Directories:**
```
__tests__/
├── components/
└── utils/

e2e/                    # 6 files
tests/                  # 6 files
test-results/           # Test output
```

**Frontend Test Directories:**
```
frontend/e2e/           # E2E tests
frontend/test-results/  # Frontend test results
frontend/src/__tests__/ # Unit tests (if exists)
```

**Backend Test Directories:**
```
backend/tests/          # Backend tests
backend/tests/integration/
backend/tests/common/
```

### Affected Files

**Files Referencing Test Directories:**

1. **Test Configuration Files:**
   - `package.json` (test scripts)
   - `jest.config.js`
   - `playwright.config.ts`
   - `frontend/playwright.config.ts`

2. **CI/CD Files:**
   - `.github/workflows/*.yml`
   - `frontend/.github/workflows/frontend-tests.yml`

3. **Test Scripts:**
   - `test.sh`
   - `test-integration.sh`
   - `test-backend.sh`

### Problem Analysis

**Issue:**
- Multiple test directories at root level
- Unclear which tests are actually run
- Root `__tests__/` may be legacy
- Root `e2e/` may duplicate `frontend/e2e/`

**Risk Level:** 🟡 **MEDIUM**
- Need to verify which tests are active
- Test configurations must be updated
- CI/CD pipelines may break

### Mitigation Strategy

**Step 1: Check Test Configurations**
```bash
# Check package.json test scripts
grep -A 5 '"test"' package.json frontend/package.json

# Check jest config
cat jest.config.js | grep -E "testMatch|testDir|roots"

# Check playwright configs
grep -r "testDir\|testMatch" playwright*.ts frontend/playwright*.ts
```

**Step 2: Identify Active Tests**
```bash
# Find which test files are actually imported/referenced
grep -r "__tests__\|e2e\|tests/" package.json scripts/*.sh .github/workflows/*.yml
```

**Step 3: Compare Test Files**
```bash
# Compare root __tests__ with frontend tests
diff -r __tests__/ frontend/src/__tests__/ 2>/dev/null || echo "No frontend/src/__tests__"
```

### Fixes Required

#### Fix 1: Update package.json Test Scripts

**Before (if exists):**
```json
{
  "scripts": {
    "test": "jest --testPathPattern=__tests__",
    "test:e2e": "playwright test e2e/"
  }
}
```

**After:**
```json
{
  "scripts": {
    "test": "jest --testPathPattern=frontend/src/__tests__",
    "test:e2e": "playwright test frontend/e2e/"
  }
}
```

#### Fix 2: Update Jest Configuration

**Before:**
```javascript
module.exports = {
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  roots: ['<rootDir>/__tests__']
};
```

**After:**
```javascript
module.exports = {
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  roots: ['<rootDir>/frontend/src']
};
```

#### Fix 3: Update Playwright Configuration

**Before:**
```typescript
export default defineConfig({
  testDir: './e2e',
});
```

**After:**
```typescript
export default defineConfig({
  testDir: './frontend/e2e',
});
```

#### Fix 4: Update CI/CD Workflows

**Before:**
```yaml
- name: Run E2E tests
  run: npm run test:e2e
  working-directory: .
```

**After:**
```yaml
- name: Run E2E tests
  run: npm run test:e2e
  working-directory: frontend
```

### Migration Script

```bash
#!/bin/bash
# Consolidate test directories

set -e

echo "Step 1: Analyzing test configurations"
echo "Checking package.json..."
grep -A 10 '"test"' package.json frontend/package.json || echo "No test scripts found"

echo ""
echo "Checking jest config..."
[ -f jest.config.js ] && cat jest.config.js | grep -E "testMatch|testDir|roots" || echo "No jest.config.js"

echo ""
echo "Step 2: Finding test file references"
grep -r "__tests__\|e2e\|tests/" package.json scripts/*.sh .github/workflows/*.yml 2>/dev/null | head -20

echo ""
echo "Step 3: Comparing test directories"
if [ -d "__tests__" ] && [ -d "frontend/src/__tests__" ]; then
  diff -r __tests__/ frontend/src/__tests__/ || echo "Directories differ"
fi

echo ""
echo "Step 4: Backup root test directories"
[ -d "__tests__" ] && cp -r __tests__ archive/__tests__-backup-$(date +%Y%m%d)
[ -d "e2e" ] && cp -r e2e archive/e2e-backup-$(date +%Y%m%d)

echo ""
echo "Step 5: Manual consolidation required"
echo "Review test configurations and move tests to appropriate locations"
```

---

## 6. Root Code Directories Consolidation

### Current State

**Root Code Directories:**
```
constants/     # 1 file
contexts/      # 1 file
hooks/         # 2 subdirs (ingestion, reconciliation)
pages/         # 516K - Next.js pages
server/        # 1 file
store/         # 1 file
styles/        # 1 file
utils/         # 15 files
```

**Frontend Equivalent:**
```
frontend/src/
├── constants/  # (if exists)
├── contexts/   # (if exists)
├── hooks/      # React hooks
├── pages/      # Next.js pages
├── store/      # Redux store
├── styles/     # CSS/styling
└── utils/      # Utility functions
```

### Affected Files

**Files Importing from Root Directories:**

1. **Root `types/` imports** (already covered in Section 1)
2. **Root `utils/` imports** (need to check)
3. **Root `hooks/` imports** (need to check)
4. **Root `constants/` imports** (need to check)

### Problem Analysis

**Issue:**
- Root level code directories appear to be legacy Next.js structure
- Current structure uses `frontend/src/` as SSOT
- Root directories may have unique files or be completely unused
- Need to verify if any imports reference root directories

**Risk Level:** 🟡 **MEDIUM**
- Need comprehensive import analysis
- May have unique files that need migration
- Build system may reference root directories

### Mitigation Strategy

**Step 1: Comprehensive Import Analysis**
```bash
# Check for imports from root utils/
grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/utils\|import.*['\"]\.\.\/\.\.\/\.\.\/utils" frontend/ backend/ --include="*.{ts,tsx,js,jsx}"

# Check for imports from root hooks/
grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/hooks\|import.*['\"]\.\.\/\.\.\/\.\.\/hooks" frontend/ backend/ --include="*.{ts,tsx,js,jsx}"

# Check for imports from root constants/
grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/constants\|import.*['\"]\.\.\/\.\.\/\.\.\/constants" frontend/ backend/ --include="*.{ts,tsx,js,jsx}"
```

**Step 2: Compare Directory Contents**
```bash
# Compare root utils with frontend utils
diff -r utils/ frontend/src/utils/ 2>/dev/null || echo "No frontend/src/utils"

# Compare root hooks with frontend hooks
diff -r hooks/ frontend/src/hooks/ 2>/dev/null || echo "No frontend/src/hooks"
```

**Step 3: Check Build Configuration**
```bash
# Check if root directories are in build paths
grep -r "constants\|utils\|hooks" tsconfig.json frontend/tsconfig.json next.config.js
```

### Fixes Required

#### Fix 1: Update Import Paths (if any found)

**Before:**
```typescript
import { someUtil } from '../../../utils';
import { useCustomHook } from '../../../hooks';
import { CONSTANT } from '../../../constants';
```

**After:**
```typescript
import { someUtil } from '@/utils';  // Using path alias
import { useCustomHook } from '@/hooks';
import { CONSTANT } from '@/constants';
```

#### Fix 2: Move Unique Files

**If root directories have unique files:**
```bash
# Move unique utils
cp -r utils/* frontend/src/utils/  # After verifying no conflicts

# Move unique hooks
cp -r hooks/* frontend/src/hooks/  # After verifying no conflicts

# Move unique constants
cp -r constants/* frontend/src/constants/  # After verifying no conflicts
```

#### Fix 3: Update TypeScript Path Aliases

**Before (tsconfig.json):**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./frontend/src/*"]
    }
  }
}
```

**After (if needed):**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./frontend/src/*"],
      "@/utils/*": ["./frontend/src/utils/*"],
      "@/hooks/*": ["./frontend/src/hooks/*"],
      "@/constants/*": ["./frontend/src/constants/*"]
    }
  }
}
```

### Migration Script

```bash
#!/bin/bash
# Consolidate root code directories

set -e

echo "Step 1: Finding imports from root directories"
echo "Checking utils/..."
UTILS_IMPORTS=$(grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/utils\|import.*['\"]\.\.\/\.\.\/\.\.\/utils" frontend/ backend/ --include="*.{ts,tsx,js,jsx}" 2>/dev/null | wc -l)
echo "Found $UTILS_IMPORTS imports from root utils/"

echo "Checking hooks/..."
HOOKS_IMPORTS=$(grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/hooks\|import.*['\"]\.\.\/\.\.\/\.\.\/hooks" frontend/ backend/ --include="*.{ts,tsx,js,jsx}" 2>/dev/null | wc -l)
echo "Found $HOOKS_IMPORTS imports from root hooks/"

echo "Checking constants/..."
CONSTANTS_IMPORTS=$(grep -r "from.*['\"]\.\.\/\.\.\/\.\.\/constants\|import.*['\"]\.\.\/\.\.\/\.\.\/constants" frontend/ backend/ --include="*.{ts,tsx,js,jsx}" 2>/dev/null | wc -l)
echo "Found $CONSTANTS_IMPORTS imports from root constants/"

echo ""
echo "Step 2: Comparing directories"
if [ -d "utils" ] && [ -d "frontend/src/utils" ]; then
  echo "Comparing utils/ with frontend/src/utils/..."
  diff -r utils/ frontend/src/utils/ > /tmp/utils-diff.txt 2>&1 || true
  echo "Differences saved to /tmp/utils-diff.txt"
fi

echo ""
echo "Step 3: Backup root directories"
[ -d "utils" ] && cp -r utils archive/utils-backup-$(date +%Y%m%d)
[ -d "hooks" ] && cp -r hooks archive/hooks-backup-$(date +%Y%m%d)
[ -d "constants" ] && cp -r constants archive/constants-backup-$(date +%Y%m%d)

echo ""
echo "Step 4: Manual review required"
echo "Review import statements and directory differences before consolidation"
```

---

## 7. Infrastructure Consolidation

### Current State

**Root Infrastructure Directories:**
```
k8s/          # Kubernetes configs (92K, 15 files)
terraform/    # Terraform configs (3 files)
```

**Infrastructure Directory:**
```
infrastructure/
├── kubernetes/  # Kubernetes configs
├── terraform/   # (if exists)
└── ...
```

### Affected Files

**Files Referencing Infrastructure:**

1. **Deployment Scripts:**
   - `scripts/deploy-production.sh`
   - `scripts/deploy.sh`
   - `scripts/go-live.sh`

2. **CI/CD Files:**
   - `.github/workflows/deploy.yml`
   - `.github/workflows/ci.yml`

3. **Documentation:**
   - `docs/deployment/*.md`

### Problem Analysis

**Issue:**
- Root `k8s/` and `terraform/` should be in `infrastructure/`
- Deployment scripts may reference root paths
- CI/CD may have hardcoded paths

**Risk Level:** 🟡 **MEDIUM**
- Need to update deployment scripts
- CI/CD pipelines may break
- Documentation needs updates

### Fixes Required

#### Fix 1: Update Deployment Scripts

**Before:**
```bash
kubectl apply -f k8s/base/
kubectl apply -f k8s/overlays/staging/
```

**After:**
```bash
kubectl apply -f infrastructure/kubernetes/base/
kubectl apply -f infrastructure/kubernetes/overlays/staging/
```

#### Fix 2: Update CI/CD Workflows

**Before:**
```yaml
- name: Deploy to Kubernetes
  run: |
    kubectl apply -f k8s/base/
```

**After:**
```yaml
- name: Deploy to Kubernetes
  run: |
    kubectl apply -f infrastructure/kubernetes/base/
```

#### Fix 3: Update Terraform References

**Before:**
```bash
terraform init terraform/
terraform plan terraform/
```

**After:**
```bash
terraform init infrastructure/terraform/
terraform plan infrastructure/terraform/
```

### Migration Script

```bash
#!/bin/bash
# Consolidate infrastructure directories

set -e

echo "Step 1: Finding references to k8s/"
grep -r "k8s/" scripts/*.sh .github/workflows/*.yml docs/deployment/*.md 2>/dev/null | head -20

echo ""
echo "Step 2: Finding references to terraform/"
grep -r "terraform/" scripts/*.sh .github/workflows/*.yml docs/deployment/*.md 2>/dev/null | head -20

echo ""
echo "Step 3: Comparing k8s directories"
if [ -d "k8s" ] && [ -d "infrastructure/kubernetes" ]; then
  diff -r k8s/ infrastructure/kubernetes/ > /tmp/k8s-diff.txt 2>&1 || true
  echo "Differences saved to /tmp/k8s-diff.txt"
fi

echo ""
echo "Step 4: Backup root directories"
[ -d "k8s" ] && cp -r k8s archive/infrastructure/k8s-backup-$(date +%Y%m%d)
[ -d "terraform" ] && cp -r terraform archive/infrastructure/terraform-backup-$(date +%Y%m%d)

echo ""
echo "Step 5: Move directories (after verification)"
# mkdir -p infrastructure/kubernetes infrastructure/terraform
# mv k8s/* infrastructure/kubernetes/  # If not duplicate
# mv terraform/* infrastructure/terraform/
```

---

## 8. Migration Scripts

### Master Migration Script

```bash
#!/bin/bash
# ==============================================================================
# Master Folder Consolidation Script
# ==============================================================================
# Executes folder consolidation in safe phases with verification
# Usage: ./scripts/consolidate-folders.sh [phase]
# Phases: 1 (low risk), 2 (medium risk), 3 (medium risk), all
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

PHASE="${1:-all}"
BACKUP_DIR="archive/folder-consolidation-$(date +%Y%m%d_%H%M%S)"

log_info "Starting folder consolidation - Phase: $PHASE"
log_info "Backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Phase 1: Low Risk Consolidations
if [ "$PHASE" = "1" ] || [ "$PHASE" = "all" ]; then
    log_info "=== PHASE 1: Low Risk Consolidations ==="
    
    # Archive experimental directories
    if [ -d "data-science" ] || [ -d "ml" ] || [ -d "prototypes" ]; then
        log_info "Archiving experimental directories..."
        mkdir -p "$BACKUP_DIR/experimental"
        [ -d "data-science" ] && mv data-science "$BACKUP_DIR/experimental/"
        [ -d "ml" ] && mv ml "$BACKUP_DIR/experimental/"
        [ -d "prototypes" ] && mv prototypes "$BACKUP_DIR/experimental/"
        log_success "Experimental directories archived"
    fi
    
    # Consolidate docker examples
    if [ -d "docker/examples" ]; then
        log_info "Moving docker examples to infrastructure..."
        mkdir -p infrastructure/docker/examples
        mv docker/examples/* infrastructure/docker/examples/
        rmdir docker/examples
        [ -d "docker" ] && rmdir docker 2>/dev/null || true
        log_success "Docker examples consolidated"
    fi
    
    # Archive duplicate monitoring (after verification)
    if [ -d "monitoring" ] && [ -d "infrastructure/monitoring" ]; then
        log_info "Verifying monitoring directories..."
        if [ "$(find monitoring -type f | wc -l)" -lt "$(find infrastructure/monitoring -type f | wc -l)" ]; then
            log_info "Archiving root monitoring (infrastructure version is canonical)..."
            mv monitoring "$BACKUP_DIR/infrastructure/monitoring-legacy"
            log_success "Monitoring directory archived"
        fi
    fi
fi

# Phase 2: Medium Risk - Infrastructure
if [ "$PHASE" = "2" ] || [ "$PHASE" = "all" ]; then
    log_info "=== PHASE 2: Infrastructure Consolidation ==="
    
    # Move terraform
    if [ -d "terraform" ] && [ ! -d "infrastructure/terraform" ]; then
        log_info "Moving terraform to infrastructure..."
        mv terraform infrastructure/terraform
        log_success "Terraform moved"
    fi
    
    # Consolidate nginx (if duplicate)
    if [ -d "nginx" ] && [ -d "infrastructure/nginx" ]; then
        log_warning "Both nginx directories exist - manual review required"
        log_info "Comparing nginx directories..."
        diff -r nginx/ infrastructure/nginx/ > "$BACKUP_DIR/nginx-diff.txt" 2>&1 || true
        log_info "Differences saved to $BACKUP_DIR/nginx-diff.txt"
        log_warning "Manual step: Review differences and consolidate manually"
    fi
fi

# Phase 3: Medium Risk - Code Directories
if [ "$PHASE" = "3" ] || [ "$PHASE" = "all" ]; then
    log_info "=== PHASE 3: Code Directories Consolidation ==="
    log_warning "This phase requires manual verification of imports"
    
    # Types consolidation (covered in Section 1)
    if [ -d "types" ] && [ -d "frontend/src/types" ]; then
        log_info "Types directories exist - manual consolidation required"
        log_info "See Section 1 of FOLDER_SIMPLIFICATION_DEEP_ANALYSIS.md for details"
    fi
    
    # Test directories (covered in Section 5)
    log_info "Test directories consolidation - manual step required"
    log_info "See Section 5 of FOLDER_SIMPLIFICATION_DEEP_ANALYSIS.md for details"
fi

log_success "Folder consolidation complete"
log_info "Backup location: $BACKUP_DIR"
log_info "Review changes and run tests before committing"
```

---

## 9. Verification Checklist

### Pre-Migration Checklist

- [ ] **Backup Created**: All directories backed up to archive/
- [ ] **Import Analysis**: All imports from root directories identified
- [ ] **Test Suite**: Full test suite passes before migration
- [ ] **Build Verification**: Frontend and backend build successfully
- [ ] **Docker Verification**: Docker builds work correctly
- [ ] **CI/CD Review**: CI/CD pipelines reviewed for path references

### Post-Migration Checklist

- [ ] **Import Paths Updated**: All import statements fixed
- [ ] **Test Suite Passes**: All tests pass after migration
- [ ] **Builds Work**: Frontend and backend build successfully
- [ ] **Docker Builds**: Docker images build correctly
- [ ] **CI/CD Works**: All CI/CD pipelines pass
- [ ] **Documentation Updated**: All documentation references updated
- [ ] **No Broken Links**: All file references work

### Rollback Checklist

If issues arise:
- [ ] **Restore from Backup**: Restore affected directories from archive/
- [ ] **Revert Code Changes**: Revert import path changes
- [ ] **Verify Functionality**: Ensure system works after rollback
- [ ] **Document Issues**: Document what went wrong
- [ ] **Update Plan**: Revise migration plan based on learnings

---

## 10. Summary of Affected Files

### Files Requiring Import Updates

1. **Types Directory:**
   - `frontend/src/hooks/useWebSocketIntegration.ts` (Line 16)
   - `frontend/src/store/store.ts` (Line 22)
   - Potentially more files (need comprehensive search)

### Files Requiring Path Updates

1. **Docker Compose Files:**
   - `docker-compose.yml`
   - `docker-compose.monitoring.yml`
   - `docker-compose.backend.yml`
   - All docker-compose*.yml files

2. **Deployment Scripts:**
   - `scripts/deploy-production.sh`
   - `scripts/deploy.sh`
   - `scripts/go-live.sh`
   - `scripts/start-database.sh`
   - `scripts/full-redeploy.sh`

3. **Test Configuration:**
   - `package.json`
   - `jest.config.js`
   - `playwright.config.ts`
   - `frontend/playwright.config.ts`

4. **CI/CD Workflows:**
   - `.github/workflows/*.yml`
   - `frontend/.github/workflows/frontend-tests.yml`

### Files Requiring Manual Review

1. **Nginx Configuration**: Compare root vs infrastructure versions
2. **Test Directories**: Verify which tests are actually run
3. **Root Code Directories**: Check for unique files before consolidation

---

## 11. Risk Mitigation Summary

| Directory | Risk | Affected Files | Mitigation |
|-----------|------|----------------|------------|
| `types/` | 🟡 MEDIUM | 2+ files | Update imports, use path aliases |
| `monitoring/` | 🟢 LOW | Docker-compose, scripts | Update volume paths |
| `docker/` | 🟢 LOW | None | Simple move, no code changes |
| `nginx/` | 🟡 MEDIUM | Docker-compose | Compare and consolidate |
| `__tests__/`, `e2e/` | 🟡 MEDIUM | Test configs, CI/CD | Update test paths |
| `utils/`, `hooks/`, `constants/` | 🟡 MEDIUM | Unknown | Comprehensive import search |
| `k8s/`, `terraform/` | 🟡 MEDIUM | Deployment scripts, CI/CD | Update script paths |

---

**Analysis Complete**  
**Total Sections**: 11  
**Affected Files Identified**: 20+  
**Migration Scripts**: 4  
**Risk Level**: LOW to MEDIUM (with proper mitigation)

