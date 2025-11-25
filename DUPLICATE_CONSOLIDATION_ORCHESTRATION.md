# Duplicate Functions Consolidation Orchestration

## Date: January 2025

## Overview

Systematic plan to consolidate all duplicate functions following SSOT principles. This orchestration ensures zero duplication while maintaining backward compatibility during migration.

## Consolidation Strategy

### Phase 1: Error Handling Functions ✅ HIGH PRIORITY

**Target**: Consolidate all error extraction/message functions into single SSOT

**Actions**:
1. Create `frontend/src/utils/common/errorHandling.ts` with consolidated functions
2. Move functions from `errorExtraction.ts` to common module
3. Consolidate `extractErrorMessage` from `services/errorHandling.ts`
4. Keep `errorHandler.ts` AppError class (different purpose)
5. Update all 25+ import locations
6. Archive old `errorExtraction.ts` if fully migrated

**Functions to Consolidate**:
- `getErrorMessage(error: unknown, fallback?: string)` - Generic error message extractor
- `getErrorMessageFromApiError(error)` - API-specific error extraction
- `extractErrorMessage(error: unknown)` - Service error extraction
- `toError(error: unknown, fallbackMessage?: string)` - Error object creator
- `extractErrorFromApiResponse(error)` - Full error info extraction

**SSOT Location**: `frontend/src/utils/common/errorHandling.ts`

### Phase 2: Sanitization Functions ✅ MEDIUM PRIORITY

**Target**: Remove duplicates, use existing SSOT

**Actions**:
1. Remove duplicates from `security.tsx`:
   - Remove `sanitizeHTML()` → use `sanitizeHtml()` from common
   - Remove `escapeHTML()` → use `escapeHtml()` from common
   - Remove `sanitizeInput()` → use from common
2. Remove duplicates from `sanitize.ts`:
   - Remove all functions → use common module
   - Archive file if empty
3. Update 5+ import locations
4. Verify `sanitizeForRender()` in `inputValidation.ts` (check if duplicate)

**SSOT Location**: `frontend/src/utils/common/sanitization.ts` (already exists)

### Phase 3: Validation Functions ✅ MEDIUM PRIORITY

**Target**: Consolidate validation, remove duplicates

**Actions**:
1. **Password Validation**:
   - `passwordValidation.ts` is duplicate of `common/validation.ts`
   - Remove `passwordValidation.ts`, update imports
   - Keep `common/validation.ts` as SSOT
2. **Input Validation**:
   - `inputValidation.ts` has some duplicates:
     - `emailSchema`, `passwordSchema`, `nameSchema`, `textSchema` → duplicates
     - `validateFormInput()` → duplicate
     - `sanitizeInput()` → duplicate
     - `validateFile()` → duplicate (simpler version)
   - Keep unique functions, remove duplicates
   - Update imports
3. **Security Utils**:
   - Remove `isValidEmail()` → use `validateEmail()` from common
   - Remove `validatePasswordStrength()` → use from common
4. **Root Utils**:
   - `utils/index.ts` has `validateEmail()` → remove, use common

**SSOT Location**: `frontend/src/utils/common/validation.ts` (already exists)

### Phase 4: Performance Utilities ✅ LOW PRIORITY

**Target**: Update imports to use SSOT

**Actions**:
1. Verify all imports use `common/performance.ts`
2. Update any remaining old imports
3. Remove old re-exports if any

**SSOT Location**: `frontend/src/utils/common/performance.ts` (already exists)

### Phase 5: Date Formatting ✅ LOW PRIORITY (Document Only)

**Target**: Document differences, no consolidation needed

**Actions**:
1. Document that these serve different purposes:
   - `utils/index.ts:formatDate()` - Generic formatter (legacy)
   - `i18nService.formatDate()` - i18n-specific (different purpose)
   - Backend date utils - Separate backend implementation
2. No consolidation needed (different purposes)

## Execution Order

1. ✅ Phase 1: Error Handling (highest impact, most duplicates)
2. ✅ Phase 2: Sanitization (medium impact, already has SSOT)
3. ✅ Phase 3: Validation (medium impact, already has SSOT)
4. ✅ Phase 4: Performance (low impact, already consolidated)
5. ✅ Phase 5: Documentation (no code changes)

## Files to Create

- `frontend/src/utils/common/errorHandling.ts` - Consolidated error handling

## Files to Modify

### Error Handling (25+ files):
- `frontend/src/utils/errorExtraction.ts` - Move to common
- `frontend/src/services/errorHandling.ts` - Use common
- All files importing error extraction functions

### Sanitization (5+ files):
- `frontend/src/utils/security.tsx` - Remove duplicates
- `frontend/src/utils/sanitize.ts` - Remove duplicates
- `frontend/src/utils/inputValidation.ts` - Check `sanitizeForRender()`
- All files importing sanitization functions

### Validation (10+ files):
- `frontend/src/utils/passwordValidation.ts` - Remove (duplicate)
- `frontend/src/utils/inputValidation.ts` - Remove duplicates
- `frontend/src/utils/security.tsx` - Remove validation duplicates
- `frontend/src/utils/index.ts` - Remove validation duplicates
- All files importing validation functions

## Files to Archive

- `frontend/src/utils/passwordValidation.ts` (after migration)
- `frontend/src/utils/sanitize.ts` (if empty after migration)
- `frontend/src/utils/errorExtraction.ts` (if fully migrated)

## Backward Compatibility

- Keep re-exports in `frontend/src/utils/index.ts` for old imports
- Add deprecation warnings in old files
- Migration period: 2 weeks before removing old files

## Verification Steps

1. Run linter to check for unused imports
2. Run type checker to verify no type errors
3. Run tests to ensure no regressions
4. Check import statements for old paths
5. Verify SSOT locations are correct

## Success Criteria

- ✅ Zero duplicate function implementations
- ✅ All imports use SSOT locations
- ✅ No linter errors
- ✅ All tests passing
- ✅ Documentation updated

