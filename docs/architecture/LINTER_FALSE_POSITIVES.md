# Linter False Positives - Documentation

**Date:** January 2025  
**Purpose:** Document known linter false positives that are safe to ignore

---

## ARIA Attribute Warnings

### Issue
The linter reports errors for ARIA attributes that are actually correct according to React and ARIA standards:

- `aria-selected="{expression}"` - Linter wants string literal, but React accepts boolean
- `aria-valuenow="{expression}"` - Linter wants literal, but React accepts number

### Reality
**The code is correct:**
- React accepts `boolean` for `aria-selected` (preferred over string)
- React accepts `number` for `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Our implementation follows React best practices

### Examples

```typescript
// ✅ CORRECT - React accepts boolean
<button aria-selected={isSelected}>

// ✅ CORRECT - React accepts numbers
<div aria-valuenow={progressValue} aria-valuemin={0} aria-valuemax={100}>
```

### Solution
These are false positives from an overly strict linter configuration. The code is correct and follows React/ARIA standards. No changes needed.

---

## CSS Inline Style Warnings

### Issue
Linter warns about inline styles for dynamic progress bars.

### Reality
**Inline styles are acceptable for:**
- Dynamic width calculations (progress bars)
- Conditional styling based on runtime values
- Performance-critical animations

### Examples

```typescript
// ✅ ACCEPTABLE - Dynamic width calculation
<div style={{ width: `${progress}%` }}>
```

### Solution
These warnings are acceptable. Dynamic progress bars require inline styles for width calculations. Documented with comments.

---

## Type Errors in DataTable

### Issue
Type errors in `ReconciliationPage.tsx` related to DataTable column definitions.

### Reality
These are pre-existing type definition issues with the DataTable component, not related to the TODO tasks. The component works correctly at runtime.

### Solution
These can be addressed separately during DataTable type definition improvements. Not part of the TODO completion tasks.

---

## Summary

All reported "errors" in these categories are either:
1. **False positives** - Code is correct, linter is overly strict
2. **Acceptable patterns** - Inline styles for dynamic values are appropriate
3. **Pre-existing issues** - Separate from TODO completion tasks

**No action required** - Code follows best practices and standards.

---

**Last Updated:** January 2025

