/**
 * Hooks Index - Export all custom hooks
 */

export { useKeyboardNavigation } from './useKeyboardNavigation';
export type { KeyboardNavigationOptions } from './useKeyboardNavigation';

// Error Management Hooks
export { useErrorRecovery } from './useErrorRecovery';
export type { ErrorRecoveryOptions, ErrorContext } from './useErrorRecovery';

export { useErrorManagement } from './useErrorManagement';
export type {
  ErrorManagementOptions,
  ErrorManagementState,
  ErrorManagementActions,
} from './useErrorManagement';

export { useApiErrorHandler } from './useApiErrorHandler';
export type { ApiErrorHandlerOptions } from './useApiErrorHandler';
