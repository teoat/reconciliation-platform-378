# Consolidation Quick Reference

**Last Updated**: November 2025

## 🎯 Quick Consolidation Targets

### Utility Files to Merge

| Old Path | New Path | Action |
|----------|----------|--------|
| `utils/passwordValidation.ts` | `utils/common/validation.ts` | Merge functions |
| `utils/inputValidation.ts` | `utils/common/validation.ts` | Merge functions |
| `utils/fileValidation.ts` | `utils/common/validation.ts` | Merge functions |
| `utils/errorExtraction.ts` | `utils/common/errorHandling.ts` | Merge with async version |
| `utils/errorExtractionAsync.ts` | `utils/common/errorHandling.ts` | Merge with sync version |
| `utils/errorSanitization.ts` | `utils/common/errorHandling.ts` | Merge functions |
| `utils/sanitize.ts` | `utils/common/sanitization.ts` | Merge duplicate functions |
| `utils/ariaLiveRegionsHelper.ts` | `utils/accessibility.ts` | Merge functions |
| `utils/dynamicImports.ts` | `utils/codeSplitting.tsx` | Merge utilities |

### Service Files to Consolidate

| Old Path | New Path | Action |
|----------|----------|--------|
| `services/utils.ts` | `services/utils/helpers.ts` | Consolidate utilities |
| `services/utils/params.ts` | `services/utils/helpers.ts` | Merge into helpers |
| `services/utils/errorService.ts` | `services/utils/helpers.ts` | Merge into helpers |
| `services/constants.ts` | `constants/index.ts` | Move to shared constants |

### Test Files to Consolidate

| Old Path | New Path | Action |
|----------|----------|--------|
| `services/dataPersistenceTester.ts` | `services/testers/index.ts` | Consolidate test utilities |
| `services/networkInterruptionTester.ts` | `services/testers/index.ts` | Consolidate test utilities |
| `services/errorRecoveryTester.ts` | `services/testers/index.ts` | Consolidate test utilities |
| `services/staleDataTester.ts` | `services/testers/index.ts` | Consolidate test utilities |

## 🔧 Large Files to Refactor

### Frontend

| File | Lines | Target Structure |
|------|-------|------------------|
| `services/workflowSyncTester.ts` | 1307 | Split into `workflowSyncTester/` modules |
| `components/CollaborativeFeatures.tsx` | 1196 | Split into `collaboration/` components |
| `pages/AuthPage.tsx` | 1110 | Split into `auth/` components |
| `store/index.ts` | 1080 | Split into `store/slices/` |
| `hooks/useApiEnhanced.ts` | 1064 | Split into `hooks/api/` modules |
| `store/unifiedStore.ts` | 1039 | Split into `store/slices/` |
| `components/index.tsx` | 973 | Optimize barrel exports |
| `hooks/useApi.ts` | 961 | Merge with useApiEnhanced |

### Backend

| File | Lines | Target Structure |
|------|-------|------------------|
| `handlers/auth.rs` | 1015 | Split into `handlers/auth/` modules |

## 📝 Import Migration Examples

### Before
```typescript
import { validatePassword } from '@/utils/passwordValidation';
import { validateEmail } from '@/utils/inputValidation';
import { validateFile } from '@/utils/fileValidation';
```

### After
```typescript
import { 
  validatePassword, 
  validateEmail, 
  validateFile 
} from '@/utils/common/validation';
```

### Before
```typescript
import { extractError } from '@/utils/errorExtraction';
import { extractErrorAsync } from '@/utils/errorExtractionAsync';
```

### After
```typescript
import { 
  extractError, 
  extractErrorAsync 
} from '@/utils/common/errorHandling';
```

## 🚀 Quick Start Commands

### Find Files Using Old Imports
```bash
# Find all files using old validation imports
grep -r "from '@/utils/passwordValidation'" frontend/src
grep -r "from '@/utils/inputValidation'" frontend/src
grep -r "from '@/utils/fileValidation'" frontend/src

# Find all files using old error imports
grep -r "from '@/utils/errorExtraction'" frontend/src
grep -r "from '@/utils/errorExtractionAsync'" frontend/src
```

### Update Imports (Manual)
```bash
# Use find and replace in your IDE
# Old: from '@/utils/passwordValidation'
# New: from '@/utils/common/validation'
```

## ⚠️ Important Notes

1. **Always test** after each consolidation
2. **Update imports** incrementally
3. **Keep old exports** during transition (with deprecation warnings)
4. **Document changes** in commit messages
5. **Run linter** after each change

## 📚 Full Documentation

See [CONSOLIDATION_OPTIMIZATION_PLAN.md](./CONSOLIDATION_OPTIMIZATION_PLAN.md) for detailed implementation plan.

