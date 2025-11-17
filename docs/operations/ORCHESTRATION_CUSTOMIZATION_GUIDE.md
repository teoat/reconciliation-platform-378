# Frenly AI Orchestration Customization Guide

**Date:** January 2025  
**Status:** Active  
**Purpose:** Guide for customizing Frenly AI guidance and orchestration behavior

---

## Overview

This guide explains how to customize Frenly AI guidance messages, onboarding steps, and orchestration behavior for your specific needs.

---

## Customizing Guidance Content

### Page-Specific Guidance

Each page has its own guidance content defined in the orchestration file. To customize:

**Location:** `frontend/src/orchestration/pages/[PageName]PageOrchestration.ts`

**Example - Dashboard Guidance:**

```typescript
export function getDashboardGuidanceContent(topic: string): GuidanceContent[] {
  const guidanceMap: Record<string, GuidanceContent[]> = {
    'getting-started': [
      {
        id: 'welcome-tip',
        title: 'Welcome!',
        content: 'Your custom welcome message here',
        type: 'info',
      },
      // Add more guidance items...
    ],
    // Add more topics...
  };

  return guidanceMap[topic] || [];
}
```

### Adding New Guidance Topics

1. **Add topic to page metadata:**
```typescript
export const dashboardPageMetadata: PageMetadata = {
  // ...
  guidanceTopics: [
    'getting-started',
    'project-management',
    'your-new-topic', // Add here
  ],
};
```

2. **Add guidance content:**
```typescript
export function getDashboardGuidanceContent(topic: string): GuidanceContent[] {
  const guidanceMap: Record<string, GuidanceContent[]> = {
    // ...
    'your-new-topic': [
      {
        id: 'new-topic-tip-1',
        title: 'Your Title',
        content: 'Your guidance content',
        type: 'tip', // or 'info', 'warning', 'help'
      },
    ],
  };
  return guidanceMap[topic] || [];
}
```

---

## Customizing Onboarding Steps

### Modifying Onboarding Steps

**Location:** `frontend/src/orchestration/pages/[PageName]PageOrchestration.ts`

**Example:**

```typescript
export function getDashboardOnboardingSteps(
  hasProjects: boolean,
  hasCompletedProjects: boolean
): OnboardingStep[] {
  return [
    {
      id: 'welcome',
      title: 'Welcome to Dashboard',
      description: 'Your custom description',
      targetElement: 'dashboard-header', // CSS selector or element ID
      completed: true,
      skipped: false,
      order: 1,
    },
    // Add or modify steps...
  ];
}
```

### Adding New Onboarding Steps

1. **Add step ID to page metadata:**
```typescript
export const dashboardPageMetadata: PageMetadata = {
  // ...
  onboardingSteps: [
    'welcome',
    'project-creation',
    'your-new-step', // Add here
  ],
};
```

2. **Add step definition:**
```typescript
export function getDashboardOnboardingSteps(...): OnboardingStep[] {
  return [
    // ... existing steps
    {
      id: 'your-new-step',
      title: 'Your Step Title',
      description: 'Your step description',
      targetElement: 'your-element-id',
      completed: false, // Set based on your logic
      skipped: false,
      order: 5, // Set appropriate order
    },
  ];
}
```

---

## Customizing Guidance Handlers

### Modifying Guidance Handlers

Guidance handlers determine when and what messages to show:

```typescript
export function registerDashboardGuidanceHandlers(): GuidanceHandler[] {
  return [
    {
      id: 'project-guidance',
      featureId: 'project-overview',
      handler: async (context: PageContext) => {
        // Your custom logic here
        if (context.projectsCount === 0) {
          return {
            id: `project-tip-${Date.now()}`,
            type: 'tip',
            content: 'Your custom message',
            timestamp: new Date(),
            page: 'dashboard',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 1,
    },
    // Add more handlers...
  ];
}
```

### Message Types

Available message types:
- `'greeting'`: Welcome messages
- `'tip'`: Helpful tips
- `'warning'`: Warnings
- `'celebration'`: Success messages
- `'question'`: Questions
- `'instruction'`: Step-by-step instructions
- `'encouragement'`: Motivational messages

### Message Priority

- `'low'`: Non-urgent, can be dismissed easily
- `'medium'`: Important but not critical
- `'high'`: Critical, should be noticed

---

## Customizing Workflow State

### Modifying Workflow State

For pages with workflows, customize the workflow state:

```typescript
export function getIngestionWorkflowState(
  uploadedFilesCount: number,
  validatedFilesCount: number,
  processingStatus: string
): WorkflowState {
  const steps = ['upload', 'validate', 'process']; // Customize steps
  const completedSteps: string[] = [];

  // Your custom completion logic
  if (uploadedFilesCount > 0) completedSteps.push('upload');
  if (validatedFilesCount > 0) completedSteps.push('validate');
  if (processingStatus === 'completed') completedSteps.push('process');

  const progress = (completedSteps.length / steps.length) * 100;

  return {
    workflowId: 'ingestion-workflow',
    currentStep: processingStatus === 'processing' ? 'process' : completedSteps[completedSteps.length - 1] || 'upload',
    completedSteps,
    totalSteps: steps.length,
    progress: Math.round(progress),
    metadata: {
      // Add custom metadata
      steps,
      processingStatus,
    },
  };
}
```

---

## Customizing Page Context

### Modifying Page Context

Page context provides information about the current page state:

```typescript
export function getDashboardPageContext(
  projectsCount: number,
  activeProjectsCount: number,
  completedProjectsCount: number,
  productivityScore?: number
): PageContext {
  return {
    projectsCount,
    activeProjectsCount,
    completedProjectsCount,
    productivityScore,
    currentView: 'overview',
    timestamp: Date.now(),
    // Add custom context properties
    customProperty: 'value',
  };
}
```

---

## Customizing Behavior Analytics

### Modifying Behavior Tracking

Customize what behaviors are tracked:

```typescript
import { getBehaviorTracker } from '@/orchestration/modules/BehaviorAnalytics';

const tracker = getBehaviorTracker();

// Track custom interactions
tracker.trackInteraction(userId, 'custom-action', {
  featureId: 'custom-feature',
  customData: 'value',
});

// Track custom page visits
tracker.trackPageVisit(userId, 'custom-page');

// Track custom errors
tracker.trackError(userId);
```

---

## Best Practices

### 1. Keep Messages Concise
- Messages should be short and actionable
- Avoid overwhelming users with too much information
- Use clear, simple language

### 2. Context-Aware Messages
- Messages should be relevant to current page state
- Show messages at appropriate times
- Avoid repetitive messages

### 3. Progressive Disclosure
- Start with basic guidance
- Provide more detailed help on demand
- Show advanced features gradually

### 4. User Control
- Allow users to dismiss messages
- Respect user preferences
- Don't force guidance on users

### 5. Testing
- Test all customizations
- Verify messages appear correctly
- Check timing and context

---

## Examples

### Example 1: Adding Custom Guidance Topic

```typescript
// In DashboardPageOrchestration.ts

// 1. Add to metadata
export const dashboardPageMetadata: PageMetadata = {
  // ...
  guidanceTopics: [
    'getting-started',
    'project-management',
    'advanced-features', // New topic
  ],
};

// 2. Add guidance content
export function getDashboardGuidanceContent(topic: string): GuidanceContent[] {
  const guidanceMap: Record<string, GuidanceContent[]> = {
    // ...
    'advanced-features': [
      {
        id: 'advanced-tip-1',
        title: 'Advanced Features',
        content: 'Explore advanced features in the settings menu',
        type: 'tip',
      },
    ],
  };
  return guidanceMap[topic] || [];
}
```

### Example 2: Custom Guidance Handler

```typescript
export function registerDashboardGuidanceHandlers(): GuidanceHandler[] {
  return [
    // ... existing handlers
    {
      id: 'custom-guidance',
      featureId: 'custom-feature',
      handler: async (context: PageContext) => {
        // Custom logic
        if (context.customCondition) {
          return {
            id: `custom-tip-${Date.now()}`,
            type: 'tip',
            content: 'Custom guidance message',
            timestamp: new Date(),
            page: 'dashboard',
            priority: 'medium',
            dismissible: true,
          };
        }
        return null;
      },
      priority: 2,
    },
  ];
}
```

---

## Related Documentation

- [Integration Guide](../../frontend/src/orchestration/INTEGRATION_GUIDE.md)
- [Testing Guide](../testing/ORCHESTRATION_TESTING_GUIDE.md)
- [Monitoring Guide](./ORCHESTRATION_MONITORING.md)

