# Phase 5 Implementation Guide

**Date**: 2025-01-28  
**Purpose**: Step-by-step guide for implementing Phase 5 refactoring

---

## Quick Start

1. **Review Strategy**: Read `PHASE_5_COMPLETION_STRATEGY.md`
2. **Follow Pattern**: Use standard extraction pattern for each file
3. **Check Progress**: Update `PHASE_5_STATUS.md` as you complete files
4. **Test Thoroughly**: Verify functionality after each refactoring

---

## Implementation Checklist (Per File)

- [ ] Read the file and understand its structure
- [ ] Create directory structure (`[feature]/types/`, `hooks/`, `components/`, `utils/`)
- [ ] Extract types to `types/index.ts`
- [ ] Extract hooks to `hooks/use[Feature].ts`
- [ ] Extract components to `components/[Component].tsx`
- [ ] Extract utilities to `utils/[utility].ts`
- [ ] Refactor main file to use extracted modules
- [ ] Update all imports across codebase
- [ ] Run linter: `npm run lint`
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Test functionality
- [ ] Update documentation
- [ ] Mark complete in status document

---

## File-Specific Guides

See `PHASE_5_COMPLETION_STRATEGY.md` for detailed extraction plans for each file.

---

## Common Patterns

### Extracting a Hook
```typescript
// Before: Logic in component
const [state, setState] = useState()
useEffect(() => { /* logic */ }, [])

// After: Extract to hook
// hooks/useFeature.ts
export const useFeature = () => {
  const [state, setState] = useState()
  useEffect(() => { /* logic */ }, [])
  return { state, setState }
}

// Component
const { state, setState } = useFeature()
```

### Extracting a Component
```typescript
// Before: Inline component
const MyComponent = () => {
  return (
    <div>
      {/* complex JSX */}
    </div>
  )
}

// After: Extract to component file
// components/MyComponent.tsx
export const MyComponent = ({ props }) => {
  return (
    <div>
      {/* complex JSX */}
    </div>
  )
}
```

---

## Testing After Refactoring

1. **Import Check**: Verify all imports resolve
2. **Type Check**: Run `npx tsc --noEmit`
3. **Linter**: Run `npm run lint`
4. **Manual Test**: Test the feature in browser
5. **Integration Test**: Verify feature works with other features

---

## Success Criteria

- ✅ Main file <500 lines (ideally <300)
- ✅ All extracted modules properly organized
- ✅ All imports updated and working
- ✅ No TypeScript errors
- ✅ No linter errors
- ✅ Functionality preserved
- ✅ Tests passing

---

**Guide Created**: 2025-01-28  
**For**: Phase 5 Implementation

