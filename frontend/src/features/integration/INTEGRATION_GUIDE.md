# Feature Registry Integration Guide

## Overview

This guide explains how to integrate the Feature Registry with existing systems:
- Frenly AI components
- Page orchestration
- React components
- Meta Agent framework

## Quick Start

### 1. Initialize Feature Registry

Add to your main app component:

```typescript
import { useFeatureRegistryInit } from '@/features/integration';

function App() {
  const { initialized, error } = useFeatureRegistryInit();
  
  if (error) {
    console.error('Feature registry initialization failed', error);
  }
  
  return (
    <div>
      {initialized && <YourApp />}
    </div>
  );
}
```

### 2. Integrate with Frenly AI

Update `FrenlyProvider` to use feature registry:

```typescript
import { getRelevantFeatures, getFeatureGuidance } from '@/features/integration';

// In your message generation
const relevantFeatures = getRelevantFeatures(currentPage, userProgress);
if (relevantFeatures.length > 0) {
  const guidance = await getFeatureGuidance(relevantFeatures[0].id, {
    page: currentPage,
    userProgress,
  });
  // Use guidance in Frenly messages
}
```

### 3. Integrate with Page Orchestration

Update `PageFrenlyIntegration`:

```typescript
import { registerPageOrchestration } from '@/features/integration';

// When initializing page
const integration = registerPageOrchestration(pageId, pageOrchestration);

// Get contextual guidance
const guidance = await integration.getContextualGuidance(userProgress);

// Track feature usage
await integration.trackFeatureAction('feature-id', 'action-id', userId);
```

### 4. Use in Components

Display feature guidance:

```typescript
import { FeatureGuidanceDisplay } from '@/features/integration';

function MyComponent() {
  return (
    <div>
      <FeatureGuidanceDisplay 
        featureId="my-feature" 
        context={{ page: 'my-page' }}
      />
    </div>
  );
}
```

## Integration Points

### Frenly AI Integration

**Location**: `frontend/src/features/integration/frenly.ts`

**Functions**:
- `getFeatureGuidance(featureId, context)` - Get contextual guidance
- `getRelevantFeatures(page, userProgress)` - Find relevant features
- `trackFeatureUsage(featureId, actionId, userId)` - Track usage
- `getNextSuggestedFeature(completedSteps)` - Get next feature suggestion

**Usage**:
```typescript
import { getFeatureGuidance } from '@/features/integration';

const guidance = await getFeatureGuidance('data-ingestion:file-upload', {
  page: 'upload',
  userProgress: ['step1'],
});
```

### Meta Agent Integration

**Location**: `frontend/src/features/integration/meta-agent.ts`

**Functions**:
- `getCompatibleFeatures(agentType)` - Get features for agent
- `getMonitorableFeatures()` - Get features that can be monitored
- `getExecutableFeatures()` - Get features that can be executed
- `validateActionParameters(featureId, actionId, params)` - Validate action params

**Usage**:
```typescript
import { getCompatibleFeatures } from '@/features/integration';

const features = getCompatibleFeatures('monitoring');
// Features that can be monitored by monitoring agent
```

### Synchronization

**Location**: `frontend/src/features/integration/sync.ts`

**Functions**:
- `initializeFeatureSync()` - Initialize all sync operations
- `syncFeaturesWithFrenly()` - Sync with Frenly AI
- `syncFeaturesWithMetaAgent()` - Sync with Meta Agent
- `getFeatureUsageStats()` - Get usage statistics

**Usage**:
```typescript
import { initializeFeatureSync } from '@/features/integration';

// On app startup
await initializeFeatureSync();
```

### Component Integration

**Location**: `frontend/src/features/integration/component-integration.tsx`

**Hooks**:
- `useFeatureRegistryInit()` - Initialize registry
- `useFeatureGuidanceForContext(pageId, userProgress)` - Get guidance
- `useFeatureStats()` - Get statistics

**Components**:
- `FeatureGuidanceDisplay` - Display feature guidance

### Orchestration Integration

**Location**: `frontend/src/features/integration/orchestration-integration.ts`

**Class**:
- `FeatureAwarePageIntegration` - Enhanced page integration

**Functions**:
- `registerPageOrchestration(pageId, orchestration)` - Register page

## Migration Guide

### Migrating FrenlyProvider

**Before**:
```typescript
const agentMessage = await frenlyAgentService.generateMessage(context);
```

**After**:
```typescript
import { getRelevantFeatures, getFeatureGuidance } from '@/features/integration';

const relevantFeatures = getRelevantFeatures(context.page, userProgress);
if (relevantFeatures.length > 0) {
  const featureGuidance = await getFeatureGuidance(relevantFeatures[0].id, context);
  // Combine with agent message or use as fallback
}
```

### Migrating PageFrenlyIntegration

**Before**:
```typescript
class PageFrenlyIntegration {
  async generateContextualMessage() {
    const agentMessage = await frenlyAgentService.generateMessage(context);
    return frenlyMessage;
  }
}
```

**After**:
```typescript
import { registerPageOrchestration } from '@/features/integration';

const integration = registerPageOrchestration(pageId, orchestration);
const guidance = await integration.getContextualGuidance(userProgress);
// Use guidance in messages
```

## Best Practices

1. **Initialize Early**: Initialize feature registry in main app component
2. **Use Hooks**: Prefer React hooks for component integration
3. **Track Usage**: Track feature usage for analytics
4. **Error Handling**: Always handle errors in async operations
5. **Context**: Provide rich context for better guidance

## Troubleshooting

### Features Not Found

Ensure features are registered by importing their modules:
```typescript
import '@/features/data-ingestion';
import '@/features/reconciliation';
// etc.
```

### Guidance Not Appearing

Check:
1. Feature has `frenlyIntegration.providesGuidance: true`
2. Context is provided correctly
3. Feature is registered in registry

### Sync Failures

Check logs for sync errors. Sync is non-blocking, so failures won't crash the app.

