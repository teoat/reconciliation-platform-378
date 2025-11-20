# Page Orchestration Module

**Purpose:** Unified orchestration system for integrating pages with Frenly AI meta-agent

---

## Overview

The orchestration module provides a standardized way to integrate pages with the Frenly AI meta-agent system. It handles:

- Page lifecycle management
- Context collection and synchronization
- Onboarding integration
- Guidance coordination
- Workflow state tracking
- Event handling

---

## Quick Start

### 1. Import the hook

```typescript
import { usePageOrchestration } from '@/hooks/usePageOrchestration';
```

### 2. Define page metadata

```typescript
const pageMetadata: PageMetadata = {
  id: 'my-page',
  name: 'My Page',
  description: 'Page description',
  category: 'core',
  features: ['feature1', 'feature2'],
  onboardingSteps: ['step1', 'step2'],
  guidanceTopics: ['topic1', 'topic2'],
};
```

### 3. Use the hook in your component

```typescript
const MyPage: React.FC = () => {
  const { updatePageContext, trackFeatureUsage } = usePageOrchestration({
    pageMetadata,
    getPageContext: () => ({
      // Your page context
    }),
    // ... other options
  });

  // Track feature usage
  const handleAction = () => {
    trackFeatureUsage('feature1', 'action-performed');
  };

  return <div>...</div>;
};
```

---

## Core Concepts

### Page Orchestration Interface

All pages should implement the `PageOrchestrationInterface`:

```typescript
interface PageOrchestrationInterface {
  getPageId(): string;
  getPageMetadata(): PageMetadata;
  getPageContext(): PageContext;
  getOnboardingSteps(): OnboardingStep[];
  getWorkflowState(): WorkflowState | null;
  syncWithFrenly(): Promise<void>;
  // ... more methods
}
```

### Page Lifecycle

Pages go through these lifecycle stages:

1. **Mount** - Page is mounted, Frenly AI is initialized
2. **Update** - Page context changes, state is synchronized
3. **Unmount** - Page is unmounted, state is saved

### Context Collection

The system automatically collects page context including:

- Current page/view state
- User progress
- Workflow state
- User preferences
- Behavior metrics

### Synchronization

State is synchronized with Frenly AI:

- On page mount
- On context changes
- On user actions
- Periodically (if configured)

---

## API Reference

### `usePageOrchestration(options)`

React hook for page orchestration.

**Options:**

- `pageMetadata: PageMetadata` - Page metadata
- `getPageContext: () => PageContext` - Function to get page context
- `getOnboardingSteps?: () => OnboardingStep[]` - Get onboarding steps
- `getWorkflowState?: () => WorkflowState | null` - Get workflow state
- `registerGuidanceHandlers?: () => GuidanceHandler[]` - Register guidance handlers
- `onContextChange?: (changes: Partial<PageContext>) => void` - Context change callback

**Returns:**

- `updatePageContext(changes)` - Update page context
- `trackFeatureUsage(featureId, action, data?)` - Track feature usage
- `trackFeatureError(featureId, error)` - Track feature error
- `trackUserAction(action, target?, data?)` - Track user action
- `getFrenlyIntegration()` - Get Frenly integration instance

### `PageLifecycleManager`

Manages page lifecycle events.

**Methods:**

- `onPageMount(page)` - Handle page mount
- `onPageUpdate(page, changes)` - Handle page update
- `onPageUnmount(page)` - Handle page unmount
- `trackFeatureUsage(featureId, action, data?)` - Track feature usage
- `trackFeatureError(featureId, error)` - Track feature error

### `PageFrenlyIntegration`

Handles Frenly AI integration for a page.

**Methods:**

- `initialize()` - Initialize integration
- `collectPageContext()` - Collect page context
- `generateContextualMessage()` - Generate contextual message
- `syncPageState()` - Sync page state
- `showMessage(message)` - Show message
- `hideMessage(messageId)` - Hide message

---

## Examples

See `examples/ReconciliationPageOrchestration.ts` for a complete example.

---

## Best Practices

1. **Define clear page metadata** - Helps Frenly AI understand your page
2. **Provide accurate context** - Better context = better guidance
3. **Track feature usage** - Helps personalize the experience
4. **Handle errors gracefully** - Don't break if Frenly AI is unavailable
5. **Update context on changes** - Keep Frenly AI informed

---

## Related Documentation

- [Orchestration Proposal](../../../docs/architecture/FRENLY_AI_ORCHESTRATION_PROPOSAL.md)
- [Frenly AI Analysis](../../../docs/features/frenly-ai/FRENLY_AI_COMPREHENSIVE_ANALYSIS.md)
