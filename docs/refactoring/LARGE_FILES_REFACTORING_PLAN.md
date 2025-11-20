# Large Files Refactoring Plan

**Last Updated**: January 2025  
**Status**: Active

## Overview

This document outlines the refactoring plan for large files (>1,000 lines) in the Reconciliation Platform codebase. The goal is to reduce file sizes to ~500 lines by extracting components, hooks, and utilities.

## Files Identified for Refactoring

### Frontend Files (>1,000 lines)

1. **`frontend/src/store/index.ts`** (1,020 lines)
   - **Action**: Extract store slices into separate files
   - **Target**: ~200 lines per slice file
   - **Priority**: 🟠 HIGH

2. **`frontend/src/components/index.tsx`** (1,007 lines)
   - **Action**: Split into feature-specific component exports
   - **Target**: ~300 lines per feature module
   - **Priority**: 🟠 HIGH

3. **`frontend/src/store/unifiedStore.ts`** (999 lines)
   - **Action**: Split into domain-specific stores
   - **Target**: ~300 lines per domain
   - **Priority**: 🟠 HIGH

4. **`frontend/src/services/stale-data/testDefinitions.ts`** (967 lines)
   - **Action**: Split test definitions by category
   - **Target**: ~200 lines per category
   - **Priority**: 🟡 MEDIUM

5. **`frontend/src/hooks/useApi.ts`** (939 lines)
   - **Action**: Extract API hooks by resource type
   - **Target**: ~200 lines per resource hook
   - **Priority**: 🟠 HIGH

6. **`frontend/src/services/error-recovery/testDefinitions.ts`** (931 lines)
   - **Action**: Split test definitions by error type
   - **Target**: ~200 lines per error type
   - **Priority**: 🟡 MEDIUM

7. **`frontend/src/services/progressVisualizationService.ts`** (891 lines)
   - **Action**: Extract visualization components and utilities
   - **Target**: ~300 lines main file + component files
   - **Priority**: 🟡 MEDIUM

8. **`frontend/src/services/keyboardNavigationService.ts`** (889 lines)
   - **Action**: Split by navigation context (pages, modals, forms)
   - **Target**: ~300 lines per context
   - **Priority**: 🟡 MEDIUM

9. **`frontend/src/components/WorkflowAutomation.tsx`** (889 lines)
   - **Action**: Extract workflow steps into separate components
   - **Target**: ~200 lines per step component
   - **Priority**: 🟠 HIGH

10. **`frontend/src/components/APIDevelopment.tsx`** (869 lines)
    - **Action**: Extract API testing components
    - **Target**: ~300 lines main + component files
    - **Priority**: 🟡 MEDIUM

11. **`frontend/src/services/network-interruption/testDefinitions.ts`** (867 lines)
    - **Action**: Split test definitions by scenario
    - **Target**: ~200 lines per scenario
    - **Priority**: 🟡 MEDIUM

12. **`frontend/src/components/EnterpriseSecurity.tsx`** (849 lines)
    - **Action**: Extract security feature components
    - **Target**: ~300 lines main + feature components
    - **Priority**: 🟠 HIGH

13. **`frontend/src/services/webSocketService.ts`** (847 lines)
    - **Action**: Extract WebSocket handlers by message type
    - **Target**: ~300 lines main + handler files
    - **Priority**: 🟡 MEDIUM

14. **`frontend/src/components/EnhancedIngestionPage.tsx`** (792 lines)
    - **Action**: Extract ingestion steps into components
    - **Target**: ~200 lines per step
    - **Priority**: 🟠 HIGH

### Critical Refactoring Targets

#### TODO-148: IngestionPage.tsx (3,137 lines → ~500 lines)

**Current Structure:**
- Single large component with all ingestion logic
- Mixed concerns (UI, state, API calls, validation)

**Refactoring Strategy:**
1. **Extract Hooks** (~500 lines):
   - `useIngestionState.ts` - State management
   - `useFileUpload.ts` - File upload logic
   - `useDataValidation.ts` - Validation logic
   - `useIngestionAPI.ts` - API calls

2. **Extract Components** (~1,000 lines):
   - `IngestionHeader.tsx` - Page header
   - `FileUploadSection.tsx` - Upload UI
   - `DataPreviewSection.tsx` - Data preview
   - `ValidationSection.tsx` - Validation results
   - `ProcessingSection.tsx` - Processing status
   - `IngestionSettings.tsx` - Settings modal

3. **Extract Utilities** (~500 lines):
   - `ingestionHelpers.ts` - Helper functions
   - `ingestionValidators.ts` - Validation functions
   - `ingestionFormatters.ts` - Data formatting

4. **Main Component** (~500 lines):
   - Orchestration only
   - Component composition
   - Event handlers

**Target Structure:**
```
frontend/src/pages/ingestion/
  ├── IngestionPage.tsx (main, ~500 lines)
  ├── components/
  │   ├── IngestionHeader.tsx
  │   ├── FileUploadSection.tsx
  │   ├── DataPreviewSection.tsx
  │   ├── ValidationSection.tsx
  │   ├── ProcessingSection.tsx
  │   └── IngestionSettings.tsx
  ├── hooks/
  │   ├── useIngestionState.ts
  │   ├── useFileUpload.ts
  │   ├── useDataValidation.ts
  │   └── useIngestionAPI.ts
  └── utils/
      ├── ingestionHelpers.ts
      ├── ingestionValidators.ts
      └── ingestionFormatters.ts
```

#### TODO-149: ReconciliationPage.tsx (2,680 lines → ~500 lines)

**Current Structure:**
- Single large component with all reconciliation logic
- Complex state management
- Multiple tabs and modals

**Refactoring Strategy:**
1. **Extract Hooks** (~600 lines):
   - `useReconciliationState.ts` - State management
   - `useReconciliationJobs.ts` - Job management
   - `useReconciliationMatches.ts` - Match management
   - `useReconciliationConfig.ts` - Configuration

2. **Extract Components** (~1,200 lines):
   - `ReconciliationHeader.tsx` - Page header
   - `UploadTab.tsx` - Upload tab content
   - `ConfigureTab.tsx` - Configuration tab
   - `RunTab.tsx` - Execution tab
   - `ResultsTab.tsx` - Results display
   - `ReconciliationSettings.tsx` - Settings modal
   - `MatchList.tsx` - Match list component
   - `MatchDetail.tsx` - Match detail view

3. **Extract Utilities** (~400 lines):
   - `reconciliationHelpers.ts` - Helper functions
   - `reconciliationFormatters.ts` - Data formatting
   - `reconciliationValidators.ts` - Validation

4. **Main Component** (~500 lines):
   - Tab navigation
   - Component composition
   - Event handlers

**Target Structure:**
```
frontend/src/pages/reconciliation/
  ├── ReconciliationPage.tsx (main, ~500 lines)
  ├── components/
  │   ├── ReconciliationHeader.tsx
  │   ├── tabs/
  │   │   ├── UploadTab.tsx
  │   │   ├── ConfigureTab.tsx
  │   │   ├── RunTab.tsx
  │   │   └── ResultsTab.tsx
  │   ├── ReconciliationSettings.tsx
  │   ├── MatchList.tsx
  │   └── MatchDetail.tsx
  ├── hooks/
  │   ├── useReconciliationState.ts
  │   ├── useReconciliationJobs.ts
  │   ├── useReconciliationMatches.ts
  │   └── useReconciliationConfig.ts
  └── utils/
      ├── reconciliationHelpers.ts
      ├── reconciliationFormatters.ts
      └── reconciliationValidators.ts
```

## Refactoring Principles

1. **Single Responsibility**: Each file should have one clear purpose
2. **Feature-Based Organization**: Group related code by feature/domain
3. **Reusability**: Extract common patterns into shared utilities
4. **Testability**: Smaller files are easier to test
5. **Maintainability**: Easier to find and modify code

## Implementation Steps

### Phase 1: Planning (2 hours)
- ✅ Identify all large files
- ✅ Create refactoring plan
- ✅ Document target structure
- ⏳ Get approval for refactoring approach

### Phase 2: Extract Utilities (5 hours)
- Extract helper functions
- Extract validation functions
- Extract formatting functions
- Create shared utilities

### Phase 3: Extract Hooks (8 hours)
- Extract state management hooks
- Extract API hooks
- Extract business logic hooks
- Test hooks independently

### Phase 4: Extract Components (12 hours)
- Extract UI components
- Extract feature components
- Extract modal components
- Test components independently

### Phase 5: Refactor Main Files (8 hours)
- Update main components
- Integrate extracted pieces
- Test integration
- Update imports

### Phase 6: Testing & Cleanup (5 hours)
- Update tests
- Fix any issues
- Update documentation
- Code review

## Success Criteria

- ✅ All files < 1,000 lines
- ✅ Main page components < 500 lines
- ✅ No circular dependencies
- ✅ All tests passing
- ✅ No functionality regressions
- ✅ Improved code maintainability

## Risks & Mitigation

**Risk**: Breaking existing functionality
- **Mitigation**: Comprehensive testing, incremental refactoring

**Risk**: Import path changes
- **Mitigation**: Use absolute imports, update all references

**Risk**: Increased file count
- **Mitigation**: Organize by feature, clear directory structure

---

**Next Steps**: Begin with IngestionPage.tsx refactoring (TODO-148)

