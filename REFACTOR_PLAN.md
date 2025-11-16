# Ingestion & Reconciliation Pages Refactoring Plan

**Goal**: Reduce massive page files to ~500 lines each by extracting components

## Current State
- `./pages/IngestionPage.tsx`: **3344 lines** ❌
- `./pages/ReconciliationPage.tsx`: **2821 lines** ❌
- Total: 6165 lines of monolithic code

## Target State
- `./pages/IngestionPage.tsx`: **~500 lines** ✅
- `./pages/ReconciliationPage.tsx`: **~500 lines** ✅
- Extracted components in `./components/ingestion/` and `./components/reconciliation/`
- Shared types in `./types/ingestion/` and `./types/reconciliation/`

## Refactoring Strategy

### Phase 1: Extract Type Definitions
1. Extract interfaces and types to dedicated type files
2. Create `./types/ingestion/index.ts` with:
   - DataQualityMetrics
   - FieldMapping
   - DataValidation
   - ColumnValue, DataRow
   - All ingestion-specific types
3. Create `./types/reconciliation/index.ts` with reconciliation types

### Phase 2: Extract Utility Functions
1. Create `./utils/ingestion/` with helper functions
2. Create `./utils/reconciliation/` with helper functions
3. Extract data transformation logic
4. Extract validation logic

### Phase 3: Extract Sub-Components
1. **Ingestion Components** (`./components/ingestion/`):
   - DataQualityPanel.tsx (metrics display)
   - FieldMappingEditor.tsx (field mapping UI)
   - DataPreviewTable.tsx (data preview)
   - ValidationResults.tsx (validation display)
   - FileUploadZone.tsx (dropzone)
   - DataTransformPanel.tsx (transformations)

2. **Reconciliation Components** (`./components/reconciliation/`):
   - ReconciliationResults.tsx (results display)
   - MatchingRules.tsx (rule configuration)
   - ConflictResolution.tsx (conflict handling)
   - ReconciliationSummary.tsx (stats/summary)

### Phase 4: Extract Hooks
1. **Ingestion Hooks** (`./hooks/ingestion/`):
   - useIngestionWorkflow.ts
   - useDataValidation.ts
   - useFieldMapping.ts
   - useDataPreview.ts

2. **Reconciliation Hooks** (`./hooks/reconciliation/`):
   - useReconciliationEngine.ts
   - useMatchingRules.ts
   - useConflictResolution.ts

### Phase 5: Reassemble Main Pages
1. Import extracted components
2. Keep only:
   - Main page layout
   - Top-level state management
   - Component orchestration
3. Target: ~500 lines per page

## Implementation Order

1. ✅ Create directory structure
2. Extract types (30 min)
3. Extract utilities (30 min)
4. Extract components (2-3 hours per page)
5. Extract hooks (1-2 hours per page)
6. Refactor main pages (1 hour per page)
7. Test and verify (1 hour)

**Total Estimate**: 8-10 hours

## Success Criteria
- [ ] IngestionPage.tsx < 600 lines
- [ ] ReconciliationPage.tsx < 600 lines
- [ ] All exports working correctly
- [ ] No linting errors
- [ ] Application runs without errors
- [ ] All functionality preserved

## Benefits
- ✅ Improved maintainability
- ✅ Better testability
- ✅ Easier code navigation
- ✅ Reusable components
- ✅ Clearer separation of concerns
- ✅ +10-15 health score points

