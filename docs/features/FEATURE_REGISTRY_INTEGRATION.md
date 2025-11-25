# Feature Registry Integration Documentation

**Last Updated**: January 2025  
**Status**: Active

## Overview

The Feature Registry provides a centralized, self-describing system for all application features, enabling seamless integration with Frenly AI and Meta Agent frameworks.

## Architecture

```
frontend/src/features/
├── registry.ts                    # Core registry implementation
├── index.ts                      # Main export point
├── integration/                  # Integration modules
│   ├── frenly.ts                # Frenly AI integration
│   ├── meta-agent.ts             # Meta Agent integration
│   ├── sync.ts                   # Synchronization
│   ├── orchestration-integration.ts  # Page orchestration
│   ├── component-integration.tsx     # React components
│   └── frenly-provider-integration.ts # FrenlyProvider helpers
├── data-ingestion/               # Data upload features
├── reconciliation/               # Matching features
├── adjudication/                 # Resolution features
└── ...                          # Other feature modules
```

## Integration Points

### 1. App Initialization

Initialize feature registry on app startup:

```typescript
import { useFeatureRegistryInit } from '@/features/integration';

function App() {
  const { initialized, error } = useFeatureRegistryInit();
  // Registry is now synchronized with Frenly AI and Meta Agent
}
```

### 2. Frenly AI Integration

Features with `frenlyIntegration.providesGuidance: true` automatically provide:
- Contextual help content
- Onboarding step tracking
- Progress milestones
- Tips and suggestions

**Usage in FrenlyProvider**:
```typescript
import { generateFeatureAwareMessage } from '@/features/integration/frenly-provider-integration';

const message = await generateFeatureAwareMessage(
  currentPage,
  userProgress,
  async () => {
    // Fallback message generation
    return defaultMessage;
  }
);
```

### 3. Page Orchestration Integration

Pages register with feature registry for enhanced integration:

```typescript
import { registerPageOrchestration } from '@/features/integration';

const integration = registerPageOrchestration(pageId, pageOrchestration);
const guidance = await integration.getContextualGuidance(userProgress);
```

### 4. Component Integration

Use React hooks and components:

```typescript
import { 
  useFeatureGuidanceForContext,
  FeatureGuidanceDisplay 
} from '@/features/integration';

function MyComponent() {
  const { guidance } = useFeatureGuidanceForContext('my-page', ['step1']);
  
  return (
    <div>
      <FeatureGuidanceDisplay featureId="my-feature" />
    </div>
  );
}
```

## Feature Registration

Features are registered in their module files:

```typescript
import { registerFeature } from '@/features/registry';

registerFeature({
  id: 'category:feature-name',
  name: 'Feature Name',
  description: 'Description for AI understanding',
  category: 'data-ingestion',
  status: 'active',
  version: '1.0.0',
  actions: [/* ... */],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['guide-id'],
    tips: ['Tip 1', 'Tip 2'],
    onboardingSteps: ['step1', 'step2'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'processing'],
  },
});
```

## Synchronization

Features are automatically synchronized with:
- **Frenly AI**: On app initialization
- **Meta Agent**: On app initialization
- **Page Orchestration**: When pages register

Manual synchronization:
```typescript
import { initializeFeatureSync } from '@/features/integration';

await initializeFeatureSync();
```

## Statistics

Get feature usage statistics:

```typescript
import { useFeatureStats } from '@/features/integration';

function Stats() {
  const stats = useFeatureStats();
  // { totalFeatures, frenlyEnabled, metaAgentEnabled, byCategory }
}
```

## Migration Guide

### From Direct Frenly Service Calls

**Before**:
```typescript
const message = await frenlyAgentService.generateMessage(context);
```

**After**:
```typescript
import { generateFeatureAwareMessage } from '@/features/integration/frenly-provider-integration';

const message = await generateFeatureAwareMessage(
  context.page,
  context.progress,
  () => frenlyAgentService.generateMessage(context)
);
```

### From PageFrenlyIntegration

**Before**:
```typescript
const integration = new PageFrenlyIntegration(orchestration);
const message = await integration.generateContextualMessage();
```

**After**:
```typescript
import { registerPageOrchestration } from '@/features/integration';

const integration = registerPageOrchestration(pageId, orchestration);
const guidance = await integration.getContextualGuidance(userProgress);
```

## Best Practices

1. **Register Early**: Import feature modules early in app lifecycle
2. **Rich Metadata**: Provide complete feature metadata for better AI understanding
3. **Context**: Always provide context when requesting guidance
4. **Error Handling**: Handle errors gracefully, fallback to defaults
5. **Tracking**: Track feature usage for analytics

## Troubleshooting

### Features Not Appearing

- Ensure feature modules are imported
- Check feature registration syntax
- Verify feature status is 'active'

### Guidance Not Loading

- Check `frenlyIntegration.providesGuidance` is true
- Verify context is provided correctly
- Check browser console for errors

### Sync Failures

- Check network connectivity
- Verify Frenly AI service is available
- Check logs for detailed error messages

## Related Documentation

- [Feature Registry README](../frontend/src/features/README.md)
- [Integration Guide](../frontend/src/features/integration/INTEGRATION_GUIDE.md)
- [Frenly AI Documentation](../agents/guidance/FrenlyGuidanceAgent.md)

