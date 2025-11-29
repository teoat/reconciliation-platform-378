// UI Components Export - SSOT

// Core UI Components
export { default as Button } from './Button';
export { default as Modal } from './Modal';
export { default as ToastContainer } from './ToastContainer';

// Error Handling (Unified)
export { 
  UnifiedErrorBoundary,
  ErrorBoundary,
  withUnifiedErrorBoundary,
  useUnifiedErrorBoundary 
} from './UnifiedErrorBoundary';

// Legacy Error Boundary (deprecated - use UnifiedErrorBoundary)
// export { ErrorBoundary } from './ErrorBoundary';

// Smart Features
export { default as SmartTipProvider } from './SmartTipProvider';
export { default as SmartTip } from './SmartTip';
export { default as EnhancedFeatureTour } from './EnhancedFeatureTour';
export { default as EnhancedContextualHelp } from './EnhancedContextualHelp';
export { default as HelpSearch } from './HelpSearch';
export { default as ProgressiveFeatureDisclosure } from './ProgressiveFeatureDisclosure';

// Loading & Progress
export { LoadingSpinner } from './LoadingSpinner';

// Status Components
export { default as StatusBadge } from './StatusBadge';

// Other UI Components
// Add more exports as needed
