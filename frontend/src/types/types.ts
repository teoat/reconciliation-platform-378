// ============================================================================
// TYPES INDEX - SINGLE SOURCE OF TRUTH
// ============================================================================

// Export all type definitions
export * from './index'

// Export TypeScript configuration
export * from './typescript'

// Re-export commonly used types for convenience
export type {
  ID,
  Timestamp,
  Status,
  Priority,
  User,
  Project,
  IngestionJob,
  ReconciliationRecord,
  DashboardData,
  UIState,
  FormField,
  FormState,
  ApiResponse,
  PaginatedResponse,
  ApiError,
  WebSocketMessage,
  FileUpload,
} from './index'

// Re-export utility types
export type {
  Optional,
  Required,
  DeepPartial,
  DeepReadonly,
  NonNullable,
  ValueOf,
  KeysOfType,
  ComponentProps,
  ComponentRef,
  ApiEndpoint,
  ReduxAction,
  ReduxState,
  ReduxSelector,
} from './typescript'

// Default export for convenience
export { default as types } from './index'
export { default as tsConfig } from './typescript'
