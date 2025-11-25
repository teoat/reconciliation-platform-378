# 🚀 Ultimate Build Orchestration Prompt

**Purpose**: Comprehensive diagnostic and remediation prompt for complete codebase health check and successful build launch

**Last Updated**: 2025-01-15  
**Status**: Active Master Prompt

---

## 📋 **EXECUTIVE INSTRUCTIONS**

You are tasked with orchestrating a **complete diagnostic and remediation process** for the Reconciliation Platform codebase. Your goal is to:

1. **Diagnose** all issues across the entire codebase
2. **Rediagnose** deeper into files, features, and functions
3. **Apply fixes** systematically
4. **Create/update SQL** migrations and schemas as needed
5. **Manage secrets and passwords** securely
6. **Consolidate documentation** and remove duplicates
7. **Fix overlapping exports/imports**
8. **Ensure successful build** (frontend + backend)
9. **Add any missing critical components**

**Approach**: Work systematically, document findings, fix issues incrementally, verify after each major fix.

---

## 🎯 **PHASE 1: COMPREHENSIVE DIAGNOSTIC**

### 1.1 Codebase Structure Analysis

**Tasks:**
- [ ] Map entire directory structure
- [ ] Identify all entry points (main.rs, App.tsx, index.ts, etc.)
- [ ] Document all build configurations (Cargo.toml, package.json, tsconfig.json, etc.)
- [ ] Identify all environment files (.env, .env.example, config/*.env)
- [ ] Map all database schemas and migrations
- [ ] Identify all test suites and their locations

**Commands:**
```bash
# Structure analysis
find . -type f -name "*.rs" -o -name "*.ts" -o -name "*.tsx" | head -100
find . -name "Cargo.toml" -o -name "package.json" -o -name "tsconfig.json"
find . -name ".env*" -o -name "*.env"
find . -name "*migration*" -o -name "schema*.sql"
```

**Output**: Create `docs/operations/BUILD_ORCHESTRATION_STRUCTURE.md`

---

### 1.2 Compilation & Build Errors

**Backend (Rust):**
- [ ] Run `cargo check --all-targets` and capture ALL errors
- [ ] Run `cargo clippy --all-targets -- -D warnings` for warnings
- [ ] Check for mismatched function signatures (especially `})` vs `)` in parameter lists)
- [ ] Verify all imports and dependencies
- [ ] Check for unused code that should be removed
- [ ] Verify all test files compile

**Frontend (TypeScript/React):**
- [ ] Run `npm run build` or `npx tsc --noEmit` and capture ALL errors
- [ ] Run `npm run lint` for linting errors
- [ ] Check for ARIA attribute syntax errors (quotes around expressions)
- [ ] Verify all imports resolve correctly
- [ ] Check for circular dependencies
- [ ] Verify all type definitions are correct

**Commands:**
```bash
# Backend diagnostics
cd backend
cargo check --all-targets 2>&1 | tee ../diagnostic-results/rust-compilation-errors.log
cargo clippy --all-targets -- -D warnings 2>&1 | tee ../diagnostic-results/rust-warnings.log
cargo test --no-run 2>&1 | tee ../diagnostic-results/rust-test-compilation.log

# Frontend diagnostics
cd frontend
npm run build 2>&1 | tee ../diagnostic-results/frontend-build-errors.log
npm run lint 2>&1 | tee ../diagnostic-results/frontend-lint-errors.log
npx tsc --noEmit 2>&1 | tee ../diagnostic-results/typescript-errors.log
```

**Output**: Create `docs/operations/BUILD_ORCHESTRATION_COMPILATION_ERRORS.md`

---

### 1.3 Import/Export Analysis

**Tasks:**
- [ ] Find all duplicate exports (same name exported from multiple files)
- [ ] Find all circular dependencies
- [ ] Find all unused imports
- [ ] Find all missing imports (used but not imported)
- [ ] Verify import paths (absolute vs relative)
- [ ] Check for conflicting type definitions

**Commands:**
```bash
# Find duplicate exports
grep -r "export.*from" frontend/src --include="*.ts" --include="*.tsx" | sort | uniq -d

# Find circular dependencies (use madge or similar)
npx madge --circular frontend/src

# Find unused imports (use eslint-plugin-unused-imports)
npm run lint -- --fix
```

**Output**: Create `docs/operations/BUILD_ORCHESTRATION_IMPORT_EXPORT_ISSUES.md`

---

### 1.4 Database & SQL Analysis

**Tasks:**
- [ ] List all migration files and their order
- [ ] Verify migration consistency (no conflicts)
- [ ] Check for missing migrations
- [ ] Verify schema.sql matches current migrations
- [ ] Check for SQL injection vulnerabilities
- [ ] Verify all foreign key constraints
- [ ] Check for missing indexes on frequently queried columns

**Commands:**
```bash
# List migrations
find backend -name "*migration*" -o -name "*.sql" | sort

# Check migration status
cd backend
sqlx migrate info 2>&1 | tee ../diagnostic-results/migration-status.log
```

**Output**: Create `docs/operations/BUILD_ORCHESTRATION_DATABASE_ISSUES.md`

---

### 1.5 Environment & Secrets Analysis

**Tasks:**
- [ ] List all environment variable files
- [ ] Identify all required environment variables
- [ ] Check for hardcoded secrets in code
- [ ] Verify .env.example matches actual usage
- [ ] Check for missing environment variables
- [ ] Verify secret management (no secrets in git)
- [ ] Check for proper secret rotation mechanisms

**Commands:**
```bash
# Find all env files
find . -name ".env*" -o -name "*.env" | grep -v node_modules

# Find hardcoded secrets (basic check)
grep -r "password.*=" backend/src frontend/src --include="*.rs" --include="*.ts" | grep -v "//" | grep -v "test"
grep -r "api.*key" backend/src frontend/src --include="*.rs" --include="*.ts" | grep -v "//" | grep -v "test"
```

**Output**: Create `docs/operations/BUILD_ORCHESTRATION_ENV_SECRETS_ISSUES.md`

---

### 1.6 Documentation Consolidation

**Tasks:**
- [ ] Find all duplicate documentation files
- [ ] Identify outdated documentation
- [ ] Find conflicting information
- [ ] Check for missing documentation
- [ ] Verify documentation structure follows SSOT principles
- [ ] Archive old status/completion reports (>30 days)

**Commands:**
```bash
# Find duplicate docs
find docs -name "*.md" -exec basename {} \; | sort | uniq -d

# Find status/completion reports
find docs -name "*STATUS*.md" -o -name "*COMPLETE*.md" -o -name "*REPORT*.md"
```

**Output**: Create `docs/operations/BUILD_ORCHESTRATION_DOCUMENTATION_ISSUES.md`

---

### 1.7 Code Quality & Architecture

**Tasks:**
- [ ] Check for duplicate code (functions, components, services)
- [ ] Verify SSOT compliance (no duplicate implementations)
- [ ] Check for proper error handling patterns
- [ ] Verify security patterns (input validation, SQL injection prevention)
- [ ] Check for performance issues (N+1 queries, missing indexes)
- [ ] Verify test coverage

**Commands:**
```bash
# Find duplicate functions (basic check)
grep -r "pub fn\|export.*function\|export.*const.*=" backend/src frontend/src | sort | uniq -d
```

**Output**: Create `docs/operations/BUILD_ORCHESTRATION_CODE_QUALITY_ISSUES.md`

---

## 🔧 **PHASE 2: SYSTEMATIC FIXES**

### 2.1 Critical Build-Blocking Errors (Priority 1)

**Rust Compilation Errors:**
- [ ] Fix all function signature mismatches
- [ ] Fix all import errors
- [ ] Fix all type mismatches
- [ ] Fix mismatched closing delimiters (`})` → `)`)
- [ ] Update test files to match current API signatures
- [ ] Remove unused code causing warnings

**TypeScript Compilation Errors:**
- [ ] Fix all type errors
- [ ] Fix ARIA attribute syntax (remove quotes from expressions)
- [ ] Fix missing imports
- [ ] Fix circular dependencies
- [ ] Fix button accessibility (add aria-label/title)

**Verification:**
```bash
cd backend && cargo build
cd frontend && npm run build
```

---

### 2.2 Import/Export Consolidation (Priority 2)

**Tasks:**
- [ ] Resolve duplicate exports (keep one, update all imports)
- [ ] Break circular dependencies
- [ ] Remove unused imports
- [ ] Add missing imports
- [ ] Standardize import paths (use absolute imports where configured)
- [ ] Consolidate type definitions (one source of truth per type)

**Pattern:**
```typescript
// ❌ DON'T: Duplicate exports
// file1.ts
export const UserService = { ... }
// file2.ts
export const UserService = { ... }

// ✅ DO: Single export, import where needed
// services/userService.ts (SSOT)
export const UserService = { ... }
// Import in other files
import { UserService } from '@/services/userService';
```

---

### 2.3 Database & SQL Fixes (Priority 3)

**Tasks:**
- [ ] Create missing migrations
- [ ] Fix migration conflicts
- [ ] Update schema.sql to match migrations
- [ ] Add missing indexes
- [ ] Fix foreign key constraints
- [ ] Add database seeds if needed

**Pattern:**
```sql
-- Create migration: YYYYMMDDHHMMSS_add_missing_indexes.sql
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
```

---

### 2.4 Environment & Secrets Management (Priority 4)

**Tasks:**
- [ ] Create/update .env.example with all required variables
- [ ] Remove hardcoded secrets from code
- [ ] Add environment variable validation on startup
- [ ] Document all required environment variables
- [ ] Set up proper secret management (use environment variables)
- [ ] Create scripts to generate/rotate secrets

**Pattern:**
```rust
// ✅ DO: Environment variables
let db_password = std::env::var("DATABASE_PASSWORD")
    .expect("DATABASE_PASSWORD must be set");

// ❌ DON'T: Hardcoded secrets
let db_password = "my_secret_password";
```

---

### 2.5 Documentation Consolidation (Priority 5)

**Tasks:**
- [ ] Merge duplicate documentation files
- [ ] Archive outdated status reports (>30 days) to `docs/archive/`
- [ ] Update conflicting information (keep most recent/accurate)
- [ ] Create missing documentation
- [ ] Update README files
- [ ] Consolidate troubleshooting guides

**Pattern:**
- One document per topic (SSOT)
- Archive old status/completion reports
- Keep guides updated in place
- Cross-reference related docs

---

### 2.6 Code Quality Improvements (Priority 6)

**Tasks:**
- [ ] Remove duplicate code (extract to shared utilities)
- [ ] Fix SSOT violations (consolidate duplicate implementations)
- [ ] Improve error handling (use AppError pattern)
- [ ] Add input validation
- [ ] Fix security vulnerabilities
- [ ] Optimize performance (add indexes, fix N+1 queries)

---

## 🗄️ **PHASE 3: DATABASE OPERATIONS**

### 3.1 Migration Management

**Tasks:**
- [ ] List all existing migrations
- [ ] Verify migration order
- [ ] Create new migrations for missing schema changes
- [ ] Test migrations on clean database
- [ ] Create rollback scripts if needed

**Commands:**
```bash
cd backend
sqlx migrate add <migration_name>
sqlx migrate run
sqlx migrate revert  # if needed
```

---

### 3.2 Schema Validation

**Tasks:**
- [ ] Compare database schema with code models
- [ ] Verify all tables exist
- [ ] Verify all columns match models
- [ ] Check foreign key relationships
- [ ] Verify indexes exist

---

## 🔐 **PHASE 4: SECRETS & ENVIRONMENT**

### 4.1 Environment Variable Audit

**Tasks:**
- [ ] Document all required environment variables
- [ ] Create comprehensive .env.example
- [ ] Verify all variables are used
- [ ] Add validation for critical variables
- [ ] Create setup script for new developers

**Output**: Create `docs/operations/ENVIRONMENT_VARIABLES.md`

---

### 4.2 Secrets Management

**Tasks:**
- [ ] Remove all hardcoded secrets
- [ ] Verify no secrets in git history (use git-secrets)
- [ ] Set up proper secret rotation
- [ ] Document secret management process
- [ ] Create scripts for secret generation

---

## 📚 **PHASE 5: DOCUMENTATION CONSOLIDATION**

### 5.1 Duplicate Detection & Removal

**Tasks:**
- [ ] Find all duplicate documentation files
- [ ] Merge duplicates (keep most comprehensive)
- [ ] Update all references to merged docs
- [ ] Archive old versions

---

### 5.2 Documentation Structure

**Tasks:**
- [ ] Verify docs follow SSOT structure
- [ ] Update docs/README.md with current structure
- [ ] Create missing documentation
- [ ] Update cross-references

---

## ✅ **PHASE 6: VERIFICATION & TESTING**

### 6.1 Build Verification

**Commands:**
```bash
# Backend
cd backend
cargo clean
cargo build --release
cargo test

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
npm run lint
npm test
```

---

### 6.2 Integration Testing

**Tasks:**
- [ ] Verify database connections
- [ ] Test API endpoints
- [ ] Verify frontend-backend communication
- [ ] Test authentication flow
- [ ] Verify environment variable loading

---

### 6.3 Final Checklist

- [ ] All compilation errors fixed
- [ ] All tests passing
- [ ] No critical warnings
- [ ] Database migrations working
- [ ] Environment variables documented
- [ ] Secrets properly managed
- [ ] Documentation consolidated
- [ ] Import/export issues resolved
- [ ] Code quality improved
- [ ] Build successful (frontend + backend)

---

## 📊 **PHASE 7: REPORTING**

### 7.1 Create Master Report

**Output**: `docs/operations/BUILD_ORCHESTRATION_COMPLETE_REPORT.md`

**Include:**
- Executive summary
- All issues found and fixed
- Remaining warnings (non-blocking)
- Recommendations for future improvements
- Build status (✅ Success / ❌ Issues remaining)

---

## 🎯 **EXECUTION STRATEGY**

### Approach:
1. **Diagnose First**: Complete Phase 1 before fixing anything
2. **Fix Incrementally**: Fix one category at a time, verify after each
3. **Document Everything**: Create reports for each phase
4. **Verify Continuously**: Run builds/tests after each major fix
5. **Prioritize**: Fix blocking errors first, then warnings

### Order of Execution:
1. Phase 1 (Diagnostic) - Complete all sections
2. Phase 2.1 (Critical Build Errors) - Must fix first
3. Phase 2.2 (Import/Export) - Fix before other code changes
4. Phase 2.3 (Database) - Fix before testing
5. Phase 2.4 (Environment) - Fix before running
6. Phase 2.5 (Documentation) - Can do in parallel
7. Phase 2.6 (Code Quality) - After blocking errors fixed
8. Phase 3-5 (Database, Secrets, Docs) - In parallel where possible
9. Phase 6 (Verification) - Final check
10. Phase 7 (Reporting) - Document everything

---

## 🔍 **SPECIFIC PATTERNS TO CHECK**

### Rust-Specific:
- [ ] Function signatures ending with `})` instead of `)`
- [ ] Missing `use` statements
- [ ] Type mismatches in tests
- [ ] Unused imports/variables
- [ ] Missing trait implementations

### TypeScript-Specific:
- [ ] ARIA attributes with quotes: `aria-label="{value}"` → `aria-label={value}`
- [ ] Missing `aria-label` or `title` on icon buttons
- [ ] Circular dependencies
- [ ] Duplicate type definitions
- [ ] Unused imports

### Database-Specific:
- [ ] Missing migrations for schema changes
- [ ] Foreign key constraint issues
- [ ] Missing indexes on frequently queried columns
- [ ] SQL injection vulnerabilities

### Security-Specific:
- [ ] Hardcoded secrets
- [ ] Missing input validation
- [ ] SQL injection vulnerabilities
- [ ] XSS vulnerabilities
- [ ] Missing authentication checks

---

## 📝 **OUTPUT FILES TO CREATE**

1. `docs/operations/BUILD_ORCHESTRATION_STRUCTURE.md`
2. `docs/operations/BUILD_ORCHESTRATION_COMPILATION_ERRORS.md`
3. `docs/operations/BUILD_ORCHESTRATION_IMPORT_EXPORT_ISSUES.md`
4. `docs/operations/BUILD_ORCHESTRATION_DATABASE_ISSUES.md`
5. `docs/operations/BUILD_ORCHESTRATION_ENV_SECRETS_ISSUES.md`
6. `docs/operations/BUILD_ORCHESTRATION_DOCUMENTATION_ISSUES.md`
7. `docs/operations/BUILD_ORCHESTRATION_CODE_QUALITY_ISSUES.md`
8. `docs/operations/BUILD_ORCHESTRATION_COMPLETE_REPORT.md`
9. `docs/operations/ENVIRONMENT_VARIABLES.md` (if needed)

---

## 🚨 **CRITICAL REMINDERS**

1. **Never commit secrets** - Always use environment variables
2. **Follow SSOT principles** - One implementation per feature
3. **Test after each fix** - Don't accumulate fixes without verification
4. **Document everything** - Future you will thank you
5. **Prioritize blocking errors** - Build must succeed first
6. **Verify imports** - Fix circular dependencies before other fixes
7. **Check function signatures** - Especially Rust `})` vs `)` issue
8. **Consolidate documentation** - Archive old, merge duplicates

---

## 🎉 **SUCCESS CRITERIA**

The orchestration is complete when:

- ✅ `cargo build` succeeds without errors
- ✅ `npm run build` succeeds without errors
- ✅ All tests pass (`cargo test`, `npm test`)
- ✅ No critical security vulnerabilities
- ✅ Database migrations run successfully
- ✅ All environment variables documented
- ✅ Documentation consolidated (no duplicates)
- ✅ Import/export issues resolved
- ✅ Code quality improved (warnings addressed)
- ✅ Master report created

---

**This prompt should be executed systematically, phase by phase, with verification at each step. Document all findings and fixes throughout the process.**

---

**Last Updated**: 2025-01-15  
**Version**: 1.0  
**Status**: ✅ Active Master Prompt

