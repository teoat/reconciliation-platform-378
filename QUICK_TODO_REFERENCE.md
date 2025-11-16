# Quick Todo Reference - For Agents 🎯

**Last Updated**: November 16, 2025  
**Purpose**: Quick lookup for remaining todos

---

## 🔥 Immediate Next Tasks (Pick One)

### Option A: Type Integration (30 min) ⭐ RECOMMENDED
- [ ] Update `IngestionPage.tsx` to use `types/ingestion` (remove duplicates)
- [ ] Update `ReconciliationPage.tsx` to use `types/reconciliation` (remove duplicates)
- **Impact**: Reduces file size, eliminates duplication
- **Files**: `frontend/src/pages/IngestionPage.tsx`, `frontend/src/pages/ReconciliationPage.tsx`

### Option B: Extract First Component (1-2 hours)
- [ ] Extract `DataQualityPanel` from `IngestionPage.tsx`
- [ ] Create `frontend/src/components/ingestion/DataQualityPanel.tsx`
- **Impact**: Establishes pattern, reduces page size
- **Files**: `frontend/src/pages/IngestionPage.tsx` (source), new component file

### Option C: Fix Linting (30 min)
- [ ] Fix 13 frontend lint warnings
- [ ] Replace `any` types with proper types
- [ ] Remove unused variables
- **Impact**: Cleaner code, better type safety
- **Files**: Various frontend files (see `npm run lint` output)

---

## 📋 Remaining Refactoring Tasks

### Phase 2: Utilities (2-3 hours)
- [ ] Extract data transformation utilities
- [ ] Extract validation utilities
- [ ] Extract quality metrics utilities
- [ ] Extract reconciliation matching utilities
- [ ] Extract filtering/sorting utilities

### Phase 3: Components (12-16 hours)
**From IngestionPage**:
- [ ] DataQualityPanel
- [ ] FieldMappingEditor
- [ ] DataPreviewTable
- [ ] ValidationResults
- [ ] FileUploadZone
- [ ] DataTransformPanel

**From ReconciliationPage**:
- [ ] ReconciliationResults
- [ ] MatchingRules
- [ ] ConflictResolution
- [ ] ReconciliationSummary

### Phase 4: Hooks (8-10 hours)
- [ ] useIngestionWorkflow
- [ ] useDataValidation
- [ ] useFieldMapping
- [ ] useDataPreview
- [ ] useReconciliationEngine
- [ ] useMatchingRules
- [ ] useConflictResolution

### Phase 5: Final Refactoring (4-6 hours)
- [ ] Refactor IngestionPage.tsx to ~500 lines
- [ ] Refactor ReconciliationPage.tsx to ~500 lines

### Phase 6: Testing (2-3 hours)
- [ ] Run full test suite
- [ ] Fix linting errors
- [ ] Verify no functionality lost
- [ ] Performance testing

---

## 🎯 Task Selection Guide

**If you have 30 minutes**: Do Type Integration (Option A)
**If you have 1-2 hours**: Extract first component (Option B)
**If you have 2-3 hours**: Extract utilities (Phase 2)
**If you have 4+ hours**: Extract multiple components (Phase 3)

---

## 📁 Key Files Reference

### Source Files (To Refactor)
- `frontend/src/pages/IngestionPage.tsx` (3344 lines)
- `frontend/src/pages/ReconciliationPage.tsx` (2821 lines)

### Type Files (Already Created)
- `types/ingestion/index.ts` ✅
- `types/reconciliation/index.ts` ✅
- `types/user/index.ts` ✅
- `types/common/index.ts` ✅
- `types/websocket/index.ts` ✅
- `types/project/index.ts` ✅

### Target Directories (Create as needed)
- `frontend/src/components/ingestion/`
- `frontend/src/components/reconciliation/`
- `frontend/src/hooks/ingestion/`
- `frontend/src/hooks/reconciliation/`
- `frontend/src/utils/ingestion/`
- `frontend/src/utils/reconciliation/`

---

## 🛠️ Quick Commands

```bash
# Check current status
cd frontend && npm run lint
cd backend && cargo clippy

# Verify after changes
npm run build
cargo build

# Count progress
wc -l frontend/src/pages/IngestionPage.tsx
find frontend/src/components -name "*.tsx" | wc -l
```

---

## 📊 Progress Tracking

**Current State**:
- Types extracted: ✅ 6/6 domains
- Components extracted: 0/10
- Hooks extracted: 0/7
- Utils extracted: 0/5
- Pages refactored: 0/2

**Target State**:
- IngestionPage: 3344 → ~500 lines
- ReconciliationPage: 2821 → ~500 lines
- Components: 0 → 10
- Hooks: 0 → 7

---

**See `AGENT_ACCELERATION_GUIDE.md` for detailed instructions!**

