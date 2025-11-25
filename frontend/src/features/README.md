# Features Registry - AI Integration Guide

## Overview

The Features Registry provides a centralized, self-describing system for all application features. This enables:

- **Meta Agent Discovery**: Agents can discover and understand available features
- **Frenly AI Integration**: Contextual guidance and assistance based on feature metadata
- **Type Safety**: Strongly-typed feature definitions
- **Documentation**: Self-documenting feature capabilities

## Architecture

```
frontend/src/features/
├── registry.ts              # Core registry implementation
├── index.ts                 # Main export point
├── data-ingestion/          # Data upload and processing
├── reconciliation/          # Matching and comparison
├── adjudication/            # Discrepancy resolution
├── analytics/               # Reporting and visualization
├── collaboration/           # Real-time collaboration
├── security/                # Auth and security
├── performance/             # Performance monitoring
├── ui-components/           # Reusable UI components
├── utilities/               # General utilities
├── orchestration/           # Page and workflow orchestration
├── frenly/                  # Frenly AI specific features
└── meta-agent/              # Meta agent framework features
```

## Usage

### Registering a Feature

```typescript
import { registerFeature } from '@/features/registry';

registerFeature({
  id: 'my-feature:unique-id',
  name: 'My Feature',
  description: 'Description for AI understanding',
  category: 'data-ingestion',
  status: 'active',
  version: '1.0.0',
  actions: [
    {
      id: 'do-something',
      name: 'Do Something',
      description: 'Action description',
      parameters: [
        { name: 'param1', type: 'string', required: true },
      ],
    },
  ],
  frenlyIntegration: {
    providesGuidance: true,
    helpContentIds: ['my-feature-guide'],
    tips: ['Tip 1', 'Tip 2'],
  },
  metaAgentIntegration: {
    monitorable: true,
    executable: true,
    compatibleAgents: ['monitoring', 'processing'],
    metrics: [
      { name: 'my_metric', type: 'gauge', description: 'Metric description' },
    ],
  },
});
```

### Querying Features

```typescript
import { featureRegistry } from '@/features/registry';

// Get all features
const allFeatures = featureRegistry.getAll();

// Get features by category
const ingestionFeatures = featureRegistry.getByCategory('data-ingestion');

// Get features compatible with agent
const monitorableFeatures = featureRegistry.getCompatibleWithAgent('monitoring');

// Search features
const searchResults = featureRegistry.search('upload');

// Get feature metadata
const feature = featureRegistry.get('data-ingestion:file-upload');
```

### Frenly AI Integration

Features with `frenlyIntegration.providesGuidance: true` automatically enable:

- Contextual help content
- Onboarding step tracking
- Progress milestones
- Tips and suggestions

### Meta Agent Integration

Features with `metaAgentIntegration` enable:

- **Monitoring**: Agents can monitor feature metrics and events
- **Execution**: Agents can execute feature actions
- **Compatibility**: Specifies which agent types can interact

## Feature Categories

- `data-ingestion`: File upload, processing, transformation
- `reconciliation`: Matching, comparing, reconciling records
- `adjudication`: Discrepancy resolution and approval
- `analytics`: Reporting, visualization, dashboards
- `collaboration`: Real-time collaboration, comments
- `security`: Authentication, authorization, encryption
- `performance`: Monitoring, optimization, caching
- `ui-component`: Reusable UI components
- `utility`: General utilities and helpers
- `orchestration`: Page lifecycle, workflow, AI integration

## Best Practices

1. **Unique IDs**: Use format `category:feature-name` for IDs
2. **Descriptive Names**: Use clear, human-readable names
3. **Complete Metadata**: Fill in all relevant fields
4. **Action Definitions**: Define all available actions with parameters
5. **AI Integration**: Enable Frenly and Meta Agent integration where appropriate
6. **Version Tracking**: Update version when features change

## Integration with Existing Code

Features are registered in their respective module files (e.g., `features/data-ingestion/index.ts`). The registry is automatically populated when modules are imported.

## Integration with Existing Systems

### Frenly AI Integration

The feature registry automatically integrates with Frenly AI:

```typescript
import { useFeatureGuidanceForContext } from '@/features/integration';

function MyPage() {
  const { guidance } = useFeatureGuidanceForContext('my-page', ['step1']);
  // guidance contains contextual help from relevant features
}
```

### Page Orchestration Integration

Pages can register with the feature registry:

```typescript
import { registerPageOrchestration } from '@/features/integration';

const integration = registerPageOrchestration('my-page', pageOrchestration);
const guidance = await integration.getContextualGuidance(['step1']);
```

### Component Integration

Use React hooks to access feature registry:

```typescript
import { useFeatureRegistryInit, FeatureGuidanceDisplay } from '@/features/integration';

function App() {
  const { initialized } = useFeatureRegistryInit();
  
  return (
    <div>
      {initialized && <FeatureGuidanceDisplay featureId="my-feature" />}
    </div>
  );
}
```

## Synchronization

Features are automatically synchronized with:
- Frenly AI service (on app initialization)
- Meta Agent framework (on app initialization)
- Page orchestration system (when pages register)

Use `initializeFeatureSync()` to manually trigger synchronization.

## Future Enhancements

- Feature dependency graph
- Feature usage analytics
- Automatic feature discovery
- Feature deprecation warnings
- Feature testing utilities
