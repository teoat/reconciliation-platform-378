# Accessibility Guidelines

**Last Updated**: January 2025  
**Status**: Active

## Overview

This document provides accessibility guidelines for the Reconciliation Platform frontend. All components should follow WCAG 2.1 Level AA standards.

## Quick Reference

### Critical Requirements
- ✅ All buttons must have accessible names (text or aria-label)
- ✅ All images must have alt text (or be marked decorative)
- ✅ All form inputs must have labels
- ✅ Color contrast must meet WCAG AA standards (4.5:1 for normal text)
- ✅ All interactive elements must be keyboard accessible
- ✅ ARIA attributes must be used correctly

## Button Accessibility

### Icon-Only Buttons
Icon-only buttons **must** have an `aria-label`:

```typescript
// ✅ DO: Icon button with aria-label
<button aria-label="Close modal" onClick={handleClose}>
  <X className="w-6 h-6" aria-hidden="true" />
</button>

// ❌ DON'T: Icon button without aria-label
<button onClick={handleClose}>
  <X className="w-6 h-6" />
</button>
```

### Buttons with Text
Buttons with visible text don't need aria-label:

```typescript
// ✅ DO: Button with visible text
<button onClick={handleSubmit}>
  Submit Form
</button>
```

### Dynamic Buttons
Buttons that change state should update aria-label:

```typescript
// ✅ DO: Dynamic aria-label
<button
  aria-label={isOpen ? "Close menu" : "Open menu"}
  aria-expanded={isOpen}
  onClick={toggleMenu}
>
  {isOpen ? <X /> : <Menu />}
</button>
```

## Image Accessibility

### Informative Images
Images that convey information must have descriptive alt text:

```typescript
// ✅ DO: Descriptive alt text
<img src="/logo.png" alt="Reconciliation Platform Logo" />

// ❌ DON'T: Generic alt text
<img src="/logo.png" alt="image" />
```

### Decorative Images
Decorative images should have empty alt or aria-hidden:

```typescript
// ✅ DO: Decorative image
<img src="/decoration.png" alt="" aria-hidden="true" />

// ✅ DO: CSS background for decorative images
<div className="bg-decoration" aria-hidden="true" />
```

## Form Input Accessibility

### Labeled Inputs
All form inputs must have associated labels:

```typescript
// ✅ DO: Input with label
<label htmlFor="email">Email Address</label>
<input type="email" id="email" name="email" />

// ✅ DO: Input with aria-label
<input 
  type="text" 
  aria-label="Search projects" 
  placeholder="Search..."
/>

// ❌ DON'T: Input without label
<input type="email" name="email" />
```

### Required Fields
Required fields should be clearly indicated:

```typescript
// ✅ DO: Required field with indicator
<label htmlFor="email">
  Email Address <span aria-label="required">*</span>
</label>
<input type="email" id="email" required aria-required="true" />
```

## Color Contrast

### Text Contrast
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18pt+ or 14pt+ bold): Minimum 3:1 contrast ratio

```typescript
// ✅ DO: Sufficient contrast
<div className="text-gray-900 bg-white"> // High contrast
  Readable text
</div>

// ❌ DON'T: Low contrast
<div className="text-gray-400 bg-gray-300"> // Low contrast
  Hard to read text
</div>
```

### Interactive Elements
Interactive elements must have clear focus indicators:

```typescript
// ✅ DO: Visible focus indicator
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500">
  Click me
</button>
```

## Keyboard Navigation

### Focusable Elements
All interactive elements must be keyboard accessible:

```typescript
// ✅ DO: Keyboard accessible
<button onClick={handleClick} onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleClick();
  }
}}>
  Action
</button>

// ❌ DON'T: Div with onClick (not keyboard accessible)
<div onClick={handleClick}>Action</div>
```

### Focus Order
Focus should follow a logical order:

```typescript
// ✅ DO: Logical tab order
<button tabIndex={0}>First</button>
<button tabIndex={0}>Second</button>
<button tabIndex={-1}>Hidden</button> // Not in tab order
```

## ARIA Attributes

### ARIA Labels
Use aria-label when text is not visible:

```typescript
// ✅ DO: aria-label for icon-only elements
<button aria-label="Delete item">
  <TrashIcon />
</button>
```

### ARIA Described By
Use aria-describedby for additional context:

```typescript
// ✅ DO: aria-describedby for help text
<input 
  id="password"
  aria-describedby="password-help"
/>
<span id="password-help">Password must be at least 8 characters</span>
```

### ARIA States
Use aria-expanded, aria-pressed, etc. for state:

```typescript
// ✅ DO: aria-expanded for collapsible content
<button aria-expanded={isOpen} aria-controls="menu">
  Menu
</button>
<div id="menu" hidden={!isOpen}>
  Menu content
</div>
```

## Modal Dialogs

### Dialog Accessibility
Modals must be properly marked up:

```typescript
// ✅ DO: Proper modal markup
<div 
  role="dialog" 
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Confirm Action</h2>
  <button aria-label="Close modal">×</button>
  {/* Modal content */}
</div>
```

### Focus Management
Focus should be trapped in modals:

```typescript
// ✅ DO: Focus trap in modal
useEffect(() => {
  if (isOpen) {
    const firstFocusable = modalRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }
}, [isOpen]);
```

## Testing

### Manual Testing
1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader**: Test with NVDA (Windows) or VoiceOver (Mac)
3. **Color Contrast**: Use browser DevTools or online tools
4. **Focus Indicators**: Ensure all elements have visible focus

### Automated Testing
Run accessibility tests with Playwright:

```bash
npm run test:e2e accessibility.spec.ts
```

### Tools
- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools
- **axe-playwright**: Automated accessibility testing

## Common Issues and Fixes

### Issue: Button without accessible name
**Fix**: Add `aria-label` or visible text

### Issue: Image without alt text
**Fix**: Add descriptive `alt` attribute or mark as decorative

### Issue: Form input without label
**Fix**: Add `<label>` element or `aria-label`

### Issue: Low color contrast
**Fix**: Adjust text/background colors to meet 4.5:1 ratio

### Issue: Missing focus indicator
**Fix**: Add `focus:ring` or `focus:outline` styles

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)

## Checklist

Before submitting code, ensure:
- [ ] All buttons have accessible names
- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements are keyboard accessible
- [ ] ARIA attributes are used correctly
- [ ] Focus indicators are visible
- [ ] Accessibility tests pass

## Related Documentation

- [Security Guidelines](.cursor/rules/security.mdc)
- [TypeScript Patterns](.cursor/rules/typescript_patterns.mdc)
- [Testing Guidelines](.cursor/rules/testing.mdc)

