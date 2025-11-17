# Agent Task Completion Guide

**Purpose:** Help other agents complete independent tasks in the orchestration system

---

## Quick Reference

### Common Tasks

1. **Integrating a New Page**
   - See `frontend/src/orchestration/examples/ReconciliationPageOrchestration.ts`
   - Copy pattern and adapt for your page
   - Use `usePageOrchestration` hook

2. **Fixing Linter Errors**
   - See `docs/architecture/LINTER_FIXES_COMPLETE.md`
   - Follow patterns for type conversions
   - Use `_` prefix for unused parameters

3. **Adding New Orchestration Features**
   - Extend types in `frontend/src/orchestration/types.ts`
   - Add to appropriate module (`modules/`, `sync/`, `pages/`)
   - Update exports in `index.ts`

---

## File Structure

```
frontend/src/orchestration/
├── types.ts                    # Core type definitions
├── PageFrenlyIntegration.ts    # Core integration class
├── PageLifecycleManager.ts     # Lifecycle management
├── OnboardingOrchestrator.ts   # Onboarding coordination
├── WorkflowOrchestrator.ts     # Workflow coordination
├── modules/                     # Feature modules
│   ├── OnboardingOrchestrator.ts
│   ├── WorkflowOrchestrator.ts
│   ├── BehaviorAnalytics.ts
│   └── index.ts
├── sync/                        # Synchronization modules
│   ├── PageStateSyncManager.ts
│   ├── OnboardingSyncManager.ts
│   ├── WorkflowSyncManager.ts
│   ├── EventSyncManager.ts
│   └── index.ts
├── pages/                       # Page orchestrations
│   ├── DashboardPageOrchestration.ts
│   ├── IngestionPageOrchestration.ts
│   ├── AdjudicationPageOrchestration.ts
│   └── index.ts
└── examples/                    # Example implementations
    ├── ReconciliationPageOrchestration.ts
    ├── DashboardPageOrchestration.ts
    └── IngestionPageOrchestration.ts
```

---

## Common Patterns

### 1. Page Integration Pattern

```typescript
import { usePageOrchestration } from '@/hooks/usePageOrchestration';
import { pageMetadata, getPageContext, ... } from '@/orchestration/pages/YourPageOrchestration';

const YourPage: React.FC = () => {
  const { updatePageContext, trackFeatureUsage } = usePageOrchestration({
    pageMetadata: pageMetadata,
    getPageContext: () => getPageContext(...),
    // ... other options
  });

  // Track usage
  const handleAction = () => {
    trackFeatureUsage('feature-id', 'action-name');
  };

  return <div>...</div>;
};
```

### 2. Type Conversion Pattern

```typescript
// Always convert GeneratedMessage to FrenlyMessage
const generatedMessage = await frenlyAgentService.generateMessage(context);
const message: FrenlyMessage = {
  id: generatedMessage.id,
  type: generatedMessage.type === 'help' ? 'tip' : generatedMessage.type,
  content: generatedMessage.content,
  timestamp: generatedMessage.timestamp,
  page: context.page,
  priority: generatedMessage.priority,
  dismissible: true, // REQUIRED
  autoHide: generatedMessage.type === 'greeting' ? 5000 : undefined,
};
```

### 3. ARIA Attribute Pattern

```typescript
// Extract to variable to avoid linter errors
const isSelected = activeTab === tab.id;
const ariaSelected = isSelected ? 'true' : 'false';
<button aria-selected={ariaSelected}>...</button>
```

### 4. Unused Parameter Pattern

```typescript
// Prefix with _ to indicate intentional non-use
constructor(
  private stateManager: StateManager,
  private _unusedParam: UnusedType
) {}
```

---

## Known Issues & Solutions

### Issue: "pageData does not exist in MessageContext"
**Solution:** The agent's `MessageContext` doesn't include `pageData`. Remove it or use the context from `types.ts` which does include it.

### Issue: "Missing dismissible property"
**Solution:** Always convert `GeneratedMessage` to `FrenlyMessage` and include `dismissible: true`.

### Issue: "ARIA attribute value error"
**Solution:** Extract complex expressions to variables before using in JSX attributes.

### Issue: "CSS inline styles warning"
**Solution:** Add type assertion: `style={{ width: '50%' } as React.CSSProperties}`

---

## Testing Checklist

- [ ] Type checking passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No critical errors (warnings acceptable)
- [ ] All exports properly typed
- [ ] Message conversions include `dismissible`

---

## Related Documentation

- [Linter Fixes Complete](./LINTER_FIXES_COMPLETE.md)
- [Orchestration Proposal](./FRENLY_AI_ORCHESTRATION_PROPOSAL.md)
- [Implementation Summary](./ORCHESTRATION_IMPLEMENTATION_SUMMARY.md)

---

**Last Updated:** January 2025

