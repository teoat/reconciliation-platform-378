// Lazy Loading Utilities for Heavy Components
// Dynamically imports large components to improve initial bundle size

import { lazy, ComponentType } from 'react';

// Lazy load heavy components
export const LazyDataProvider = lazy(() => import('../components/DataProvider'));
export const LazyProjectComponents = lazy(() => import('../components/ProjectComponents'));
export const LazyCollaborativeFeatures = lazy(() => import('../components/CollaborativeFeatures'));
export const LazyReconciliationInterface = lazy(
  () => import('../components/ReconciliationInterface')
);
export const LazyEnterpriseSecurity = lazy(() => import('../components/EnterpriseSecurity'));
export const LazyFileUploadInterface = lazy(() => import('../components/FileUploadInterface'));
export const LazyWorkflowAutomation = lazy(() => import('../components/WorkflowAutomation'));
export const LazyAPIDevelopment = lazy(() => import('../components/APIDevelopment'));

// Utility function to create lazy components with error boundaries
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return lazy(importFunc);
}

// Preload function for critical components
export const preloadComponent = (component: () => Promise<any>) => {
  // Preload component in the background
  component();
};

// Critical component preloading
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  preloadComponent(() => import('../components/DataProvider'));
  preloadComponent(() => import('../components/ProjectComponents'));
};
