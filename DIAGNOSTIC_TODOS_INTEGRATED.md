# Diagnostic Todos - Integrated with Workflows

**Generated**: November 25, 2025  
**Overall Score**: 81.96/100  
**Target Score**: 96/100

---

## ✅ Quick Status

| Priority | Task | Status | Impact |
|----------|------|--------|--------|
| 🔴 CRITICAL | DIAG-001: Remove hardcoded secrets | ⏳ Pending | +30 security |
| ✅ COMPLETE | DIAG-002: Security headers | ✅ Done | Already implemented |
| 🔴 HIGH | DIAG-003: Fix linting errors | ⏳ Pending | +15 frontend |
| 🔴 HIGH | DIAG-004: Reduce linting warnings | ⏳ Pending | Maintains score |
| 🔶 MEDIUM | DIAG-005: Backend test coverage | ⏳ Pending | +12 backend |
| 🔶 MEDIUM | DIAG-006: Frontend test coverage | ⏳ Pending | +4 frontend |
| 🔵 MEDIUM | DIAG-007: Backend documentation | ⏳ Pending | +10 backend |
| 🔵 MEDIUM | DIAG-008: Error handling | ⏳ Pending | +10 security |

---

## 🔴 Critical Priority (Week 1)

### DIAG-001: Audit and Remove Hardcoded Secrets
**Files**: `backend/src/config/mod.rs`, `.github/workflows/*.yml`  
**Pattern**: Uses existing `SecretsService` and password manager  
**Command**: `grep -ri "password.*=.*['\"]" backend/src/ frontend/src/`

### DIAG-003: Fix 77 Frontend Linting Errors  
**Files**: Various frontend files (see `npm run lint` output)  
**Pattern**: Uses existing `types/` directory, follows existing import patterns  
**Command**: `cd frontend && npm run lint > lint-errors.txt`

### DIAG-004: Reduce Frontend Linting Warnings
**Files**: `frontend/eslint.config.js`, various component files  
**Pattern**: Updates existing ESLint config, maintains code quality  
**Command**: `cd frontend && npm run lint`

---

## Integration Points

### ✅ Already Integrated
- Security headers middleware registered (main.rs:377)
- Password manager service available
- Test infrastructure in place
- Type system established

### 🔄 To Integrate
- Secret scanning in CI/CD workflows
- Enhanced test coverage
- Function documentation
- Error handling improvements

---

## Workflow Integration

All tasks follow existing patterns:
- **Backend**: Uses existing middleware/service patterns
- **Frontend**: Uses existing type/component patterns  
- **Tests**: Uses existing test infrastructure
- **CI/CD**: Extends existing workflows

---

## Progress Tracking

**Current**: 81.96/100  
**Week 1 Target**: 88.25/100 (+6.29)  
**Week 3 Target**: 91.50/100 (+9.54)  
**Week 4+ Target**: 96.00/100 (+14.04)

---

**See**: `docs/project-management/DIAGNOSTIC_ACTION_PLAN.md` for detailed instructions

