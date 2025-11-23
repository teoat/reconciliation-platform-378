# Large Files Refactoring Plan

**Last Updated**: January 2025  
**Status**: Active

## Overview

This document outlines the refactoring plan for large files (>1,000 lines) in the Reconciliation Platform codebase. The goal is to reduce file sizes to ~500 lines by extracting components, hooks, and utilities.

## Files Identified for Refactoring

**Last Updated**: November 23, 2025  
**Note**: IngestionPage.tsx and ReconciliationPage.tsx already refactored (701 lines each)

### Frontend Files (>1,000 lines) - **ACTUAL SIZES**

1. **`frontend/src/services/workflowSyncTester.ts`** (1,307 lines) 🔴
   - **Action**: Extract test scenarios into separate files
   - **Target**: ~300 lines per scenario file
   - **Priority**: 🟠 HIGH

2. **`frontend/src/components/CollaborativeFeatures.tsx`** (1,188 lines) 🔴
   - **Action**: Extract collaboration features into sub-components
   - **Target**: ~300 lines per feature component
   - **Priority**: 🟠 HIGH

3. **`frontend/src/store/index.ts`** (1,080 lines) 🟡
   - **Action**: Extract store slices into separate files
   - **Target**: ~200 lines per slice file
   - **Priority**: 🟡 MEDIUM

4. **`frontend/src/store/unifiedStore.ts`** (1,039 lines) 🟡
   - **Action**: Split into domain-specific stores
   - **Target**: ~300 lines per domain
   - **Priority**: 🟡 MEDIUM

### Frontend Files (800-1,000 lines)

5. **`frontend/src/services/stale-data/testDefinitions.ts`** (967 lines) 🟡
   - **Action**: Split test definitions by category
   - **Target**: ~200 lines per category
   - **Priority**: 🟡 MEDIUM

6. **`frontend/src/components/index.tsx`** (940 lines) 🟡
   - **Action**: Split into feature-specific component exports
   - **Target**: ~300 lines per feature module
   - **Priority**: 🟡 MEDIUM

7. **`frontend/src/hooks/useApi.ts`** (939 lines) 🟡
   - **Action**: Extract API hooks by resource type
   - **Target**: ~200 lines per resource hook
   - **Priority**: 🟡 MEDIUM

8. **`frontend/src/services/error-recovery/testDefinitions.ts`** (931 lines) 🟡
   - **Action**: Split test definitions by error type
   - **Target**: ~200 lines per error type
   - **Priority**: 🟡 MEDIUM

9. **`frontend/src/pages/AuthPage.tsx`** (911 lines) 🟡
   - **Action**: Extract auth form components
   - **Target**: ~300 lines main + form components
   - **Priority**: 🟡 MEDIUM

10. **`frontend/src/hooks/useApiEnhanced.ts`** (898 lines) 🟡
    - **Action**: Extract enhanced API hooks by resource
    - **Target**: ~200 lines per resource hook
    - **Priority**: 🟡 MEDIUM

11. **`frontend/src/services/keyboardNavigationService.ts`** (893 lines) 🟡
    - **Action**: Split by navigation context (pages, modals, forms)
    - **Target**: ~300 lines per context
    - **Priority**: 🟡 MEDIUM

12. **`frontend/src/services/progressVisualizationService.ts`** (891 lines) 🟡
    - **Action**: Extract visualization components and utilities
    - **Target**: ~300 lines main file + component files
    - **Priority**: 🟡 MEDIUM

13. **`frontend/src/components/WorkflowAutomation.tsx`** (887 lines) 🟡
    - **Action**: Extract workflow steps into separate components
    - **Target**: ~200 lines per step component
    - **Priority**: 🟡 MEDIUM

14. **`frontend/src/components/AnalyticsDashboard.tsx`** (880 lines) 🟡
    - **Action**: Extract dashboard sections into components
    - **Target**: ~300 lines main + section components
    - **Priority**: 🟡 MEDIUM

15. **`frontend/src/components/APIDevelopment.tsx`** (871 lines) 🟡
    - **Action**: Extract API testing components
    - **Target**: ~300 lines main + component files
    - **Priority**: 🟡 MEDIUM

16. **`frontend/src/services/network-interruption/testDefinitions.ts`** (867 lines) 🟡
    - **Action**: Split test definitions by scenario
    - **Target**: ~200 lines per scenario
    - **Priority**: 🟡 MEDIUM

17. **`frontend/src/services/webSocketService.ts`** (847 lines) 🟡
    - **Action**: Extract WebSocket handlers by message type
    - **Target**: ~300 lines main + handler files
    - **Priority**: 🟡 MEDIUM

18. **`frontend/src/components/EnterpriseSecurity.tsx`** (844 lines) 🟡
    - **Action**: Extract security feature components
    - **Target**: ~300 lines main + feature components
    - **Priority**: 🟡 MEDIUM

19. **`frontend/src/components/EnhancedIngestionPage.tsx`** (840 lines) 🟡
    - **Action**: Extract ingestion steps into components
    - **Target**: ~200 lines per step
    - **Priority**: 🟡 MEDIUM

### Critical Refactoring Targets

#### ✅ TODO-148: IngestionPage.tsx - **ALREADY REFACTORED**

**Status**: ✅ **COMPLETE** - File already refactored  
**Current Size**: 701 lines (not 3,137 as originally stated)  
**Date Completed**: Prior to November 2025

**Current Structure**:
- ✅ Hooks extracted: `useIngestionUpload.ts`, `useIngestionFileOperations.ts`, `useIngestionWorkflow.ts`
- ✅ Uses `BasePage` component for structure
- ✅ Uses orchestration hooks: `usePageOrchestration`
- ✅ Component is well-organized and modular

**Note**: File is already at acceptable size (701 lines). Further refactoring optional.

---

#### ✅ TODO-149: ReconciliationPage.tsx - **ALREADY REFACTORED**

**Status**: ✅ **COMPLETE** - File already refactored  
**Current Size**: 701 lines (not 2,680 as originally stated)  
**Date Completed**: Prior to November 2025

**Current Structure**:
- ✅ Hooks extracted: `useReconciliationJobs.ts`, `useReconciliationEngine.ts`, `useReconciliationOperations.ts`
- ✅ Components organized in `components/reconciliation/`
- ✅ Well-structured and modular

**Note**: File is already at acceptable size (701 lines). Further refactoring optional.

---

### Actual Large Files Requiring Refactoring

Based on current codebase analysis (November 2025):

1. **`workflowSyncTester.ts`** - 1,307 lines 🔴 **HIGH PRIORITY**
   - **Action**: Extract test scenarios into separate files
   - **Target**: ~300 lines per scenario file
   - **Priority**: 🟠 HIGH

2. **`CollaborativeFeatures.tsx`** - 1,188 lines 🔴 **HIGH PRIORITY**
   - **Action**: Extract collaboration features into sub-components
   - **Target**: ~300 lines per feature component
   - **Priority**: 🟠 HIGH

3. **`store/index.ts`** - 1,080 lines 🟡 **MEDIUM PRIORITY**
   - **Action**: Extract store slices into separate files
   - **Target**: ~200 lines per slice file
   - **Priority**: 🟡 MEDIUM

4. **`store/unifiedStore.ts`** - 1,039 lines 🟡 **MEDIUM PRIORITY**
   - **Action**: Split into domain-specific stores
   - **Target**: ~300 lines per domain
   - **Priority**: 🟡 MEDIUM

5. **`testDefinitions.ts` (stale-data)** - 967 lines 🟡 **MEDIUM PRIORITY**
   - **Action**: Split test definitions by category
   - **Target**: ~200 lines per category
   - **Priority**: 🟡 MEDIUM

6. **`components/index.tsx`** - 940 lines 🟡 **MEDIUM PRIORITY**
   - **Action**: Split into feature-specific component exports
   - **Target**: ~300 lines per feature module
   - **Priority**: 🟡 MEDIUM

7. **`hooks/useApi.ts`** - 939 lines 🟡 **MEDIUM PRIORITY**
   - **Action**: Extract API hooks by resource type
   - **Target**: ~200 lines per resource hook
   - **Priority**: 🟡 MEDIUM

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

## ✅ Completed Refactoring

- ✅ **IngestionPage.tsx**: Already refactored (701 lines, hooks extracted)
- ✅ **ReconciliationPage.tsx**: Already refactored (701 lines, hooks extracted)

**Next Steps**: Focus on actual large files (>1,000 lines) - `workflowSyncTester.ts` and `CollaborativeFeatures.tsx`

