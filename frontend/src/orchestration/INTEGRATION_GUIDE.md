# Frenly AI Orchestration Integration Guide

This guide explains how to integrate pages with the Frenly AI orchestration system.

## Quick Start

### 1. Import Required Dependencies

```typescript
import { usePageOrchestration } from '@/hooks/usePageOrchestration';
import {
  dashboardPageMetadata,
  getDashboardOnboardingSteps,
  getDashboardPageContext,
  registerDashboardGuidanceHandlers,
  getDashboardGuidanceContent,
} from '@/orchestration/pages/DashboardPageOrchestration';
```

### 2. Use the Orchestration Hook

```typescript
const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use orchestration hook
  const { updatePageContext, trackFeatureUsage, trackFeatureError, trackUserAction } =
    usePageOrchestration({
      pageMetadata: dashboardPageMetadata,
      getPageContext: () =>
        getDashboardPageContext(
          projects.length,
          projects.filter((p) => p.status === 'active').length,
          projects.filter((p) => p.status === 'completed').length,
          productivityScore
        ),
      getOnboardingSteps: () =>
        getDashboardOnboardingSteps(
          projects.length > 0,
          projects.filter((p) => p.status === 'completed').length > 0
        ),
      registerGuidanceHandlers: () =>
        registerDashboardGuidanceHandlers(
          () => {
            /* show project help */
          },
          () => {
            /* show insights help */
          }
        ),
      getGuidanceContent: (topic) => getDashboardGuidanceContent(topic),
      onContextChange: (changes) => {
        // Handle context changes if needed
        console.log('Context changed:', changes);
      },
    });

  // Track feature usage
  const handleCreateProject = async () => {
    trackFeatureUsage('project-creation', 'create-project-started');
    try {
      // ... create project logic
      trackFeatureUsage('project-creation', 'create-project-success');
    } catch (error) {
      trackFeatureError('project-creation', error);
    }
  };

  // Update context when data changes
  useEffect(() => {
    updatePageContext({
      projectsCount: projects.length,
    });
  }, [projects, updatePageContext]);

  // ... rest of component
};
```

## Available Page Orchestrations

### Dashboard

- **File**: `@/orchestration/pages/DashboardPageOrchestration`
- **Metadata**: `dashboardPageMetadata`
- **Features**: Project overview, quick actions, recent activity, smart insights

### Reconciliation

- **File**: `@/orchestration/pages/ReconciliationPageOrchestration` (example)
- **Metadata**: `reconciliationPageMetadata`
- **Features**: Upload, configure, run jobs, results

### Ingestion

- **File**: `@/orchestration/pages/IngestionPageOrchestration`
- **Metadata**: `ingestionPageMetadata`
- **Features**: File upload, data validation, processing

### Adjudication

- **File**: `@/orchestration/pages/AdjudicationPageOrchestration`
- **Metadata**: `adjudicationPageMetadata`
- **Features**: Match review, discrepancy resolution, approval

### Summary

- **File**: `@/orchestration/pages/SummaryPageOrchestration`
- **Metadata**: `summaryPageMetadata`
- **Features**: Report generation, export, analytics

### Visualization

- **File**: `@/orchestration/pages/VisualizationPageOrchestration`
- **Metadata**: `visualizationPageMetadata`
- **Features**: Chart creation, dashboard, interactive visualizations

## Integration Patterns

### Basic Integration

```typescript
const { updatePageContext, trackFeatureUsage } = usePageOrchestration({
  pageMetadata: yourPageMetadata,
  getPageContext: () => yourPageContextFunction(),
});
```

### With Onboarding

```typescript
const { updatePageContext, trackFeatureUsage } = usePageOrchestration({
  pageMetadata: yourPageMetadata,
  getPageContext: () => yourPageContextFunction(),
  getOnboardingSteps: () => yourOnboardingStepsFunction(),
  completeOnboardingStep: async (stepId) => {
    // Handle step completion
  },
  skipOnboardingStep: async (stepId) => {
    // Handle step skip
  },
});
```

### With Workflow State

```typescript
const { updatePageContext, trackFeatureUsage } = usePageOrchestration({
  pageMetadata: yourPageMetadata,
  getPageContext: () => yourPageContextFunction(),
  getWorkflowState: () => yourWorkflowStateFunction(),
  updateWorkflowState: async (state) => {
    // Handle workflow state update
  },
});
```

### With Guidance Handlers

```typescript
const { updatePageContext, trackFeatureUsage } = usePageOrchestration({
  pageMetadata: yourPageMetadata,
  getPageContext: () => yourPageContextFunction(),
  registerGuidanceHandlers: () => yourGuidanceHandlersFunction(),
  getGuidanceContent: (topic) => yourGuidanceContentFunction(topic),
});
```

## Tracking Events

### Feature Usage

```typescript
trackFeatureUsage('feature-id', 'action-name', { additionalData: 'value' });
```

### Feature Errors

```typescript
try {
  // ... operation
} catch (error) {
  trackFeatureError('feature-id', error);
}
```

### User Actions

```typescript
trackUserAction('button-click', 'create-project-button', { projectId: '123' });
```

## Context Updates

Update page context when relevant data changes:

```typescript
useEffect(() => {
  updatePageContext({
    projectsCount: projects.length,
    activeTab: currentTab,
  });
}, [projects, currentTab, updatePageContext]);
```

## Best Practices

1. **Always provide page metadata** - This helps Frenly AI understand the page context
2. **Update context regularly** - Keep context up-to-date with current page state
3. **Track significant events** - Track feature usage, errors, and user actions
4. **Provide onboarding steps** - Help users learn the page features
5. **Register guidance handlers** - Provide contextual help based on page state
6. **Handle errors gracefully** - Use `trackFeatureError` for error tracking

## Advanced Features

### Custom Onboarding Adapter

```typescript
import { getOnboardingOrchestrator, type PageOnboardingAdapter } from '@/orchestration';

const adapter: PageOnboardingAdapter = {
  getPageSteps: () => [...],
  getCurrentStep: () => currentStep,
  completeStep: async (stepId) => { ... },
  skipStep: async (stepId) => { ... },
  syncWithFrenly: async () => { ... },
};

const orchestrator = getOnboardingOrchestrator();
orchestrator.registerPageAdapter('your-page-id', adapter);
```

### Workflow Orchestration

```typescript
import { getWorkflowOrchestrator } from '@/orchestration';

const workflowOrchestrator = getWorkflowOrchestrator();
workflowOrchestrator.registerWorkflow('workflow-id', initialState);
await workflowOrchestrator.completeStep('workflow-id', 'step-id');
```

### Behavior Analytics

```typescript
import { getBehaviorTracker } from '@/orchestration';

const tracker = getBehaviorTracker();
tracker.trackInteraction(userId, 'action', { featureId: 'feature' });
tracker.trackPageVisit(userId, 'page-id');
tracker.trackError(userId, 'error-type');
```

## Troubleshooting

### Messages Not Appearing

- Check that FrenlyProvider is mounted in your app
- Verify page metadata is correctly configured
- Check browser console for errors

### Context Not Updating

- Ensure `updatePageContext` is called when data changes
- Check that context function returns valid data
- Verify page is properly mounted

### Onboarding Not Working

- Check onboarding service is initialized
- Verify onboarding steps are properly configured
- Check localStorage for onboarding progress

## Related Documentation

- [Frenly AI Orchestration Proposal](../../docs/architecture/FRENLY_AI_ORCHESTRATION_PROPOSAL.md)
- [Frenly AI Comprehensive Analysis](../../docs/features/frenly-ai/FRENLY_AI_COMPREHENSIVE_ANALYSIS.md)
- [Onboarding Architecture](../../docs/features/onboarding/ONBOARDING_ARCHITECTURE.md)
