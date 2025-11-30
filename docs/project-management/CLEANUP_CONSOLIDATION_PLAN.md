# Cleanup & Consolidation Plan

**Date:** 2025-11-30  
**Objective:** Remove redundant code, unused files, and consolidate documentation  
**Scope:** Documentation, dead code, unused files

---

## 📋 Phase 1: Documentation Consolidation

### Files to Move & Organize (42 root-level markdown files)

#### Better Auth Documentation (19 files) → `docs/authentication/`

```bash
BETTER_AUTH_AGENT_TASKS.md
BETTER_AUTH_CHECKLIST.md
BETTER_AUTH_COMPLETE.md
BETTER_AUTH_COMPLETE_SUMMARY.md
BETTER_AUTH_DEPLOYMENT_CHECKLIST.md
BETTER_AUTH_DEPLOYMENT_GUIDE.md
BETTER_AUTH_EXECUTION_SUMMARY.md
BETTER_AUTH_EXECUTIVE_SUMMARY.md
BETTER_AUTH_FILES_CREATED.md
BETTER_AUTH_FINAL_SUMMARY.md
BETTER_AUTH_IMPLEMENTATION_STATUS.md
BETTER_AUTH_INDEX.md
BETTER_AUTH_INTEGRATION_TESTS.md
BETTER_AUTH_LEGACY_CLEANUP.md
BETTER_AUTH_MIGRATION_RUNBOOK.md
BETTER_AUTH_PROGRESS_SUMMARY.md
BETTER_AUTH_QUICK_START.md
BETTER_AUTH_README.md
BETTER_AUTH_START_HERE.md
BETTER_AUTH_STATUS.md
BETTER_AUTH_VISUAL_SUMMARY.md
```

**Action:** Keep only 3 essential files:

- `BETTER_AUTH_README.md` → `docs/authentication/README.md`
- `BETTER_AUTH_MIGRATION_RUNBOOK.md` → `docs/authentication/MIGRATION_GUIDE.md`
- `BETTER_AUTH_DEPLOYMENT_GUIDE.md` → `docs/deployment/better-auth.md`
**Delete:** 18 redundant summary files

#### Test Documentation (6 files) → `docs/testing/`

```bash
FEATURE_TEST_SUMMARY.md → docs/testing/feature-tests.md
PLAYWRIGHT_FEATURE_TEST_REPORT.md → docs/testing/playwright-report.md
TEST_COVERAGE_FINAL_STATUS.md → docs/testing/coverage-status.md
TEST_COVERAGE_STATUS.md → DELETE (duplicate)
TEST_DIAGNOSTIC_REPORT.md → docs/testing/diagnostic-report.md
TEST_STATUS.md → DELETE (outdated)
```

#### Diagnostic Documentation (3 files) → `docs/diagnostics/`

```bash
FRONTEND_COMPREHENSIVE_DIAGNOSTIC_PROMPT_V3.md → docs/diagnostics/frontend-v3.md
FRONTEND_COMPREHENSIVE_DIAGNOSTIC_REPORT.md → docs/diagnostics/frontend-report.md
COMPREHENSIVE_DIAGNOSTIC_PROMPT.txt → DELETE (old version)
COMPREHENSIVE_DIAGNOSTIC_PROMPT_V2.txt → DELETE (old version)
```

#### Deployment Documentation (2 files) → `docs/deployment/`

```bash
DEPLOYMENT_READY_SUMMARY.md → docs/deployment/readiness-checklist.md
```

#### Getting Started Documentation (7 files) → `docs/getting-started/`

```bash
ACTION_PLAN_NOW.md → DELETE (completed)
ALL_TODOS_COMPLETE.md → DELETE (status file)
NEXT_STEPS_EXECUTION.md → docs/project-management/execution-log.md
NEXT_STEPS_GUIDE.md → docs/getting-started/next-steps.md
QUICK_START_TESTS.md → docs/testing/quick-start.md
QUICK_START.md → docs/getting-started/QUICK_START.md (keep)
RUN_NOW.md → DELETE (temporary)
SETUP_BETTER_AUTH_NOW.md → DELETE (duplicate)
SETUP_COMMANDS.md → docs/getting-started/setup-commands.md
START_HERE.md → docs/getting-started/START_HERE.md (keep)
```

#### Orchestration Documentation (1 file) → `docs/architecture/`

```bash
THREE_AGENT_ORCHESTRATION.md → docs/architecture/agent-orchestration.md
```

#### Keep in Root (2 files only)

```bash
README.md → KEEP (project readme)
LICENSE → KEEP (license)
```

---

## 📋 Phase 2: Remove Redundant/Old Code

### Frontend Cleanup

#### 1. Remove Unused Imports (262 instances)

```typescript
// Example fix:
// BEFORE:
const { updatePageContext, trackFeatureUsage, trackFeatureError } = usePageOrchestration();

// AFTER:
const { /* updatePageContext, trackFeatureUsage, trackFeatureError */ } = usePageOrchestration();
// OR remove the line if truly unused
```

#### 2. Fix Inline Styles (2 instances)

- Already addressed with type assertions
- No further action needed

#### 3. Remove Duplicate IDs

- Audit pages individually
- Use `useId()` hook for dynamic IDs

### Backend Cleanup

#### 1. Remove Unused Imports (19 warnings)

```rust
// Files with unused imports:
- src/services/sync/orchestration.rs (diesel imports)
- src/handlers/projects.rs (diesel::prelude)
```

#### 2. Remove Unused Variables

```rust
// Files with unused variables:
- src/services/sync/orchestration.rs (conn, severity_to_match)
- src/handlers/sql_sync.rs (conn)
```

#### 3. Remove Dead Code

- Search for `#[allow(dead_code)]` annotations
- Remove or justify each instance

---

## 📋 Phase 3: Find and Remove Unused Files

### Files to Investigate

#### Potentially Unused Scripts (208 scripts)

```bash
# Find scripts never executed in git history
git log --all --pretty=format: --name-only | grep "scripts/" | sort -u > used_scripts.txt
ls -1 scripts/ | sort > all_scripts.txt
comm -13 used_scripts.txt all_scripts.txt > unused_scripts.txt
```

#### Old Configuration Files

```bash
# Check for:
- .eslintrc.json (superceded by eslint.config.js?)
- next.config.js (using Next?)
- playwright-simple.config.ts (duplicate?)
```

#### Archive Candidates

```bash
# Move to archive/:
- old test files
- deprecated components
- outdated documentation
```

---

## 📋 Phase 4: Consolidate Similar Files

### Merge Duplicate Test Configs

```bash
playwright.config.ts
playwright-test.config.ts
playwright-simple.config.ts
```

**Action:** Keep only `playwright.config.ts`, delete others

### Merge ESLint Configs

```bash
.eslintrc.json
eslint.config.js
eslint.config.refactoring.js
```

**Action:** Keep only `eslint.config.js`, delete `.eslintrc.json`

---

## 🎯 Execution Plan

### Step 1: Create Archive Directory

```bash
mkdir -p archive/2025-11-30-cleanup/{docs,configs,scripts}
```

### Step 2: Move Better Auth Docs

```bash
mkdir -p docs/authentication
mv BETTER_AUTH_README.md docs/authentication/README.md
mv BETTER_AUTH_MIGRATION_RUNBOOK.md docs/authentication/MIGRATION_GUIDE.md
mv BETTER_AUTH_DEPLOYMENT_GUIDE.md docs/deployment/better-auth.md
mv BETTER_AUTH_*.md archive/2025-11-30-cleanup/docs/
```

### Step 3: Move Test Docs

```bash
mv FEATURE_TEST_SUMMARY.md docs/testing/feature-tests.md
mv PLAYWRIGHT_FEATURE_TEST_REPORT.md docs/testing/playwright-report.md
mv TEST_COVERAGE_FINAL_STATUS.md docs/testing/coverage-status.md
mv TEST_DIAGNOSTIC_REPORT.md docs/testing/diagnostic-report.md
mv TEST_COVERAGE_STATUS.md archive/2025-11-30-cleanup/docs/
mv TEST_STATUS.md archive/2025-11-30-cleanup/docs/
```

### Step 4: Move Diagnostic Docs

```bash
mv FRONTEND_COMPREHENSIVE_DIAGNOSTIC_PROMPT_V3.md docs/diagnostics/frontend-v3.md
mv FRONTEND_COMPREHENSIVE_DIAGNOSTIC_REPORT.md docs/diagnostics/frontend-report.md
mv COMPREHENSIVE_DIAGNOSTIC_PROMPT*.txt archive/2025-11-30-cleanup/docs/
```

### Step 5: Move Setup/Deployment Docs

```bash
mv DEPLOYMENT_READY_SUMMARY.md docs/deployment/readiness-checklist.md
mv SETUP_COMMANDS.md docs/getting-started/setup-commands.md
mv NEXT_STEPS_GUIDE.md docs/getting-started/next-steps.md
mv THREE_AGENT_ORCHESTRATION.md docs/architecture/agent-orchestration.md
```

### Step 6: Archive Temporary Files

```bash
mv ACTION_PLAN_NOW.md archive/2025-11-30-cleanup/docs/
mv ALL_TODOS_COMPLETE.md archive/2025-11-30-cleanup/docs/
mv RUN_NOW.md archive/2025-11-30-cleanup/docs/
mv SETUP_BETTER_AUTH_NOW.md archive/2025-11-30-cleanup/docs/
```

### Step 7: Clean Up Configs

```bash
mv .eslintrc.json archive/2025-11-30-cleanup/configs/
mv playwright-simple.config.ts archive/2025-11-30-cleanup/configs/
mv playwright-test.config.ts archive/2025-11-30-cleanup/configs/
```

### Step 8: Update README with New Structure

```bash
# Update main README.md to reference new doc locations
```

---

## 📊 Expected Results

### Before

- 42 root-level markdown files
- 208 scripts (many unused)
- Redundant configs
- 262 unused variables

### After

- 2 root-level markdown files (README.md, LICENSE)
- ~150 active scripts
- Single config per tool
- Clean codebase

### Savings

- ~40 files moved to organized locations
- ~50 files archived
- Improved discoverability
- Easier maintenance

---

## ✅ Validation

After cleanup, verify:

```bash
# 1. All tests still pass
npm test
cargo test

# 2. Builds succeed
npm run build
cargo build

# 3. Linting passes
npm run lint
cargo clippy

# 4. Documentation is findable
ls docs/
```

---

**Status:** PLAN READY - Awaiting execution approval
