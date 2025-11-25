# Diagnostic Action Plan - Integrated Workflow

**Generated**: November 25, 2025  
**Overall Score**: 81.96/100  
**Target Score**: 96/100  
**Timeline**: 4 weeks

---

## Executive Summary

This action plan integrates diagnostic findings with existing workflows, code patterns, and file structures. All tasks are designed to work seamlessly with the current codebase architecture.

---

## 🔴 Critical Priority (Week 1) - Expected Impact: +6.7 points

### DIAG-001: Audit and Remove Hardcoded Secrets
**Priority**: 🔴 CRITICAL  
**Effort**: 4-6 hours  
**Impact**: +30 security points (45 → 75)

**Current State:**
- 24 potential hardcoded secrets detected
- Security headers middleware exists but not registered
- Password manager service available for secret management

**Action Items:**
1. **Review detected secrets** (1 hour)
   ```bash
   # Run secret scan
   grep -ri "password.*=.*['\"]" backend/src/ frontend/src/ | grep -v "//" | grep -v "test"
   ```

2. **Categorize findings** (1 hour)
   - Test data (safe to ignore)
   - OAuth user generation (safe - uses UUID)
   - Actual secrets (must fix)

3. **Migrate secrets to environment variables** (2-3 hours)
   - Use existing `SecretsService` in `backend/src/services/secrets.rs`
   - Update `backend/src/config/mod.rs` to use password manager
   - Move to `.env` or password manager storage

4. **Add secret scanning to CI/CD** (1 hour)
   - Add to `.github/workflows/` existing workflows
   - Use `gitleaks` or similar tool

**Files to Modify:**
- `backend/src/config/mod.rs` (already uses password manager)
- `.github/workflows/*.yml` (add secret scanning)
- `.env.example` (document required secrets)

**Integration Points:**
- Uses existing `SecretsService` pattern
- Follows existing `Config::from_env()` pattern
- Integrates with password manager service

---

### DIAG-002: Verify Security Headers Middleware ✅ COMPLETE
**Priority**: ✅ COMPLETE  
**Status**: Already registered in main.rs (line 377)

**Current State:**
- ✅ `SecurityHeadersMiddleware` registered in `backend/src/main.rs` line 377
- ✅ Configuration using `SecurityHeadersConfig::default()`
- ✅ All security headers (CSP, HSTS, X-Frame-Options) implemented

**Action Items:**
1. **Verify headers in production** (15 minutes)
   - Test with curl: `curl -I http://localhost:2000/api/health`
   - Verify CSP, X-Frame-Options, HSTS headers present
   - Update diagnostic script to detect registered middleware

**Note:** Diagnostic script may need update to detect registered middleware vs. just file existence

---

### DIAG-003: Fix Frontend Linting Errors
**Priority**: 🔴 HIGH  
**Effort**: 4-6 hours  
**Impact**: +15 frontend points (73.44 → 88.44)

**Current State:**
- 77 linting errors detected
- ESLint configured with `--max-warnings 0`
- TypeScript strict mode enabled

**Action Items:**
1. **Run linting to get full error list** (15 minutes)
   ```bash
   cd frontend && npm run lint > lint-errors.txt
   ```

2. **Categorize errors** (30 minutes)
   - Type errors (use existing `types/` directory)
   - Unused variables (remove or prefix with `_`)
   - Missing dependencies (add to useEffect)
   - Import order (follow existing patterns)

3. **Fix errors systematically** (3-4 hours)
   - Start with type errors (use existing type definitions)
   - Fix unused variables
   - Fix import order (external → internal → types)
   - Fix React hooks dependencies

4. **Verify fixes** (30 minutes)
   ```bash
   npm run lint
   npm run build
   ```

**Files to Modify:**
- Various frontend files (see lint output)
- Use existing `types/` directory structure
- Follow existing import patterns

**Integration Points:**
- Uses existing TypeScript type system
- Follows existing ESLint configuration
- Integrates with existing build process

---

### DIAG-004: Reduce Frontend Linting Warnings
**Priority**: 🔴 HIGH  
**Effort**: 6-8 hours  
**Impact**: Maintains frontend score improvement

**Current State:**
- 617 linting warnings
- Many likely from `any` types (already fixed per diagnostic)
- Some from console.log statements
- Some from unused imports

**Action Items:**
1. **Update ESLint config** (1 hour)
   - Allow console.log in development
   - Configure unused import rules
   - Set reasonable warning thresholds

2. **Fix warnings in batches** (5-7 hours)
   - Batch 1: Remove unused imports (1 hour)
   - Batch 2: Fix console.log statements (1 hour)
   - Batch 3: Fix prop validation warnings (2 hours)
   - Batch 4: Fix accessibility warnings (2 hours)
   - Batch 5: Fix performance warnings (1 hour)

**Files to Modify:**
- `frontend/eslint.config.js` (update rules)
- Various frontend component files

**Integration Points:**
- Works with existing ESLint setup
- Maintains code quality standards
- Follows existing component patterns

---

## 🔶 High Priority (Week 2-3) - Expected Impact: +3.25 points

### DIAG-005: Increase Backend Test Coverage
**Priority**: 🔶 HIGH  
**Effort**: 8-12 hours  
**Impact**: +12 backend points (73.33 → 85.33)

**Current State:**
- 69 test files vs 207 source files (33% coverage)
- Test structure exists in `backend/tests/`
- Test utilities available in `backend/src/test_utils.rs`

**Action Items:**
1. **Identify uncovered modules** (1 hour)
   ```bash
   cargo tarpaulin --out Html
   # Review coverage report
   ```

2. **Add unit tests for services** (4-6 hours)
   - Follow existing test patterns in `backend/tests/`
   - Use `test_utils.rs` for common setup
   - Target: 20+ new test files

3. **Add integration tests for API endpoints** (3-5 hours)
   - Follow existing patterns in `backend/tests/integration/`
   - Use existing test database setup
   - Test critical endpoints

**Files to Create:**
- `backend/tests/[service]_tests.rs` (new test files)
- Follow existing naming: `*_tests.rs`

**Integration Points:**
- Uses existing test infrastructure
- Follows existing test patterns
- Integrates with existing CI/CD

---

### DIAG-006: Increase Frontend Test Coverage
**Priority**: 🔶 HIGH  
**Effort**: 6-10 hours  
**Impact**: +4 frontend points (88.44 → 92.44)

**Current State:**
- 238 test files vs 564 source files (42% coverage)
- Vitest configured
- Testing Library available

**Action Items:**
1. **Identify uncovered components** (1 hour)
   ```bash
   npm run test:coverage
   # Review coverage report
   ```

2. **Add component tests** (3-5 hours)
   - Follow existing patterns in `frontend/src/__tests__/`
   - Use existing test utilities
   - Target: 30+ new test files

3. **Add integration tests** (2-4 hours)
   - Follow existing E2E patterns
   - Use existing Playwright setup

**Files to Create:**
- `frontend/src/__tests__/components/[Component].test.tsx`
- Follow existing test structure

**Integration Points:**
- Uses existing Vitest setup
- Follows existing test patterns
- Integrates with existing test utilities

---

## 🔵 Medium Priority (Week 4+) - Expected Impact: +4.5 points

### DIAG-007: Add Backend Function Documentation
**Priority**: 🔵 MEDIUM  
**Effort**: 4-6 hours  
**Impact**: +10 backend points (85.33 → 95.33)

**Action Items:**
1. **Document public functions** (4-6 hours)
   - Add `///` doc comments to all `pub fn` and `pub async fn`
   - Follow Rust documentation standards
   - Include examples for complex functions

**Files to Modify:**
- `backend/src/services/**/*.rs`
- `backend/src/handlers/**/*.rs`
- `backend/src/models/**/*.rs`

**Integration Points:**
- Follows Rust documentation standards
- Integrates with `cargo doc` generation
- Maintains existing code structure

---

### DIAG-008: Enhance Error Handling Patterns
**Priority**: 🔵 MEDIUM  
**Effort**: 4-6 hours  
**Impact**: +10 security points (90 → 100)

**Action Items:**
1. **Review error handling** (1 hour)
   - Identify error leakage points
   - Review `AppError` enum usage

2. **Enhance error responses** (3-5 hours)
   - Ensure no internal errors exposed
   - Add proper error logging
   - Mask PII in error messages

**Files to Modify:**
- `backend/src/errors.rs`
- `backend/src/middleware/error_handler.rs`
- Error handling in handlers

**Integration Points:**
- Uses existing `AppError` pattern
- Follows existing error handling middleware
- Integrates with existing logging

---

## Integration with Existing Workflows

### Workflow Integration Points

1. **Follows Existing Patterns:**
   - Uses existing middleware registration pattern
   - Follows existing service initialization pattern
   - Uses existing test infrastructure
   - Follows existing type system

2. **File Structure:**
   - Backend: `backend/src/` structure maintained
   - Frontend: `frontend/src/` structure maintained
   - Tests: Follow existing test file locations
   - Config: Uses existing `.env` pattern

3. **CI/CD Integration:**
   - Add secret scanning to existing workflows
   - Tests run in existing CI pipeline
   - Build process unchanged

4. **Documentation:**
   - Updates existing documentation
   - Follows existing doc patterns
   - Integrates with existing README

---

## Progress Tracking

### Week 1 Targets
- [ ] DIAG-001: Secrets audit complete
- [x] DIAG-002: Security headers verified ✅ (already registered)
- [ ] DIAG-003: Linting errors fixed
- [ ] DIAG-004: Linting warnings reduced

**Expected Score**: 81.96 → 88.25

### Week 2-3 Targets
- [ ] DIAG-005: Backend test coverage 50%+
- [ ] DIAG-006: Frontend test coverage 60%+

**Expected Score**: 88.25 → 91.50

### Week 4+ Targets
- [ ] DIAG-007: Backend documentation complete
- [ ] DIAG-008: Error handling enhanced

**Expected Score**: 91.50 → 96.00

---

## Quick Reference

### Commands
```bash
# Run diagnostic
python3 scripts/comprehensive-diagnostic.py

# Check linting
cd frontend && npm run lint

# Check tests
cd backend && cargo test
cd frontend && npm test

# Check coverage
cd backend && cargo tarpaulin
cd frontend && npm run test:coverage
```

### Key Files
- Diagnostic: `scripts/comprehensive-diagnostic.py`
- Security Headers: `backend/src/middleware/security/headers.rs`
- Main App: `backend/src/main.rs`
- ESLint Config: `frontend/eslint.config.js`
- Test Utils: `backend/src/test_utils.rs`

---

**Last Updated**: November 25, 2025  
**Next Review**: After Week 1 completion

