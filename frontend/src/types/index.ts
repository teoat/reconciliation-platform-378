// ============================================================================
// BACKEND-ALIGNED TYPE DEFINITIONS - SINGLE SOURCE OF TRUTH
// ============================================================================

// Export base types and backend-aligned types (excluding duplicates)
export type {
  ID,
  Timestamp,
  Status,
  Priority,
  User,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  AuthResponse,
  Project,
  ProjectSettings,
  ProjectMetadata,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
  ReconciliationJob,
  ReconciliationRecord,
  ReconciliationStatus,
  ReconciliationConfig,
  ReconciliationRule,
  ReconciliationResult,
  ReconciliationMetrics,
  DataSource,
  DataDestination,
  ConnectionConfig,
  DataSchema,
  SchemaField,
  FieldConstraints,
  IndexConfig,
  PartitionConfig,
  IngestionConfig,
  ValidationConfig,
  ValidationRule,
  TransformationConfig,
  TransformationRule,
  ScheduleConfig,
  IngestionJob,
  IngestionStatistics,
  FileUploadRequest,
  ProcessingResult,
  ActivityItem,
  ActivityDetails,
  PerformanceMetrics,
  ProjectStats,
  ErrorDetails,
  ErrorResponse,
  ValidationError,
  WebSocketPayload,
  RealtimeUpdate,
  FormFieldValue,
} from './backend-aligned';

// Export backend-aligned interfaces that don't conflict (using type aliases)
export type {
  FileInfo as BackendFileInfo,
  DashboardData as BackendDashboardData,
  ApiError as BackendApiError,
  WebSocketMessage as BackendWebSocketMessage,
  FormField as BackendFormField,
  FormState as BackendFormState,
  Notification as BackendNotification,
  NotificationAction as BackendNotificationAction,
} from './backend-aligned';

// ============================================================================
// FEATURE-SPECIFIC TYPE MODULES
// ============================================================================

// Authentication types
export * from './auth';

// Reconciliation types
export * from './reconciliation';

// Analytics & Reporting types (frontend-specific DashboardData)
export * from './analytics';

// UI & Component types (frontend-specific Notification)
export * from './ui';

// Form types (frontend-specific FormField, FormState)
export * from './forms';

// WebSocket types (frontend-specific WebSocketMessage)
export * from './websocket';

// File types (frontend-specific FileInfo)
export * from './files';

// Ingestion types
export * from './ingestion';

// Data types (DataSource, DataMapping, DataTransfer)
export * from './data';

// API types (frontend-specific ApiError, ApiResponse, PaginatedResponse)
export * from './api';

// ============================================================================
// LEGACY TYPE DEFINITIONS (kept for backward compatibility)
// ============================================================================

// Note: Base types (ID, Status, Priority, Timestamp) are now in backend-aligned.ts
// Note: User and Project types are now in backend-aligned.ts
// Note: Auth types are now in auth.ts
// Note: Reconciliation types are now in reconciliation.ts
// Note: Analytics types are now in analytics.ts
// Note: UI types are now in ui.ts
// Note: Form types are now in forms.ts
// Note: WebSocket types are now in websocket.ts
// Note: File types are now in files.ts
// Note: Ingestion types are now in ingestion/index.ts
// Note: API types are now in api.ts

// LogLevel type (not in backend-aligned, keeping here for now)
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ============================================================================
// RECONCILIATION TYPES
// ============================================================================
// Note: All reconciliation types are now exported from './reconciliation'

// ============================================================================
// ANALYTICS & REPORTING TYPES
// ============================================================================
// Note: All analytics types are now exported from './analytics'

// ============================================================================
// UI & COMPONENT TYPES
// ============================================================================
// Note: All UI types are now exported from './ui'

// ============================================================================
// FORM TYPES
// ============================================================================
// Note: All form types are now exported from './forms'

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================
// Note: All WebSocket types are now exported from './websocket'

// ============================================================================
// FILE TYPES
// ============================================================================
// Note: All file types are now exported from './files'

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// Default export commented out to prevent type errors
/* export default {
  // Base types - commented out as they're not exported
  // ID,
  // Timestamp,
  // Status,
  // Priority,
  
  // User & Auth - commented out as they're not exported
  // User,
  UserPreferences,
  NotificationSettings,
  DashboardSettings,
  AuthTokens,
  LoginCredentials,
  
  // Project
  Project,
  ProjectSettings,
  ProjectMetadata,
  
  // Ingestion
  IngestionJob,
  DataSource,
  DataDestination,
  ConnectionConfig,
  DataSchema,
  SchemaField,
  FieldConstraints,
  IndexConfig,
  PartitionConfig,
  IngestionConfig,
  ValidationConfig,
  ValidationRule,
  TransformationConfig,
  TransformationRule,
  ScheduleConfig,
  IngestionStatistics,
  
  // Reconciliation
  ReconciliationRecord,
  ReconciliationStatus,
  MatchType,
  Discrepancy,
  DiscrepancyResolution,
  RecordMetadata,
  ReconciliationConfig,
  ReconciliationRule,
  RuleCondition,
  RuleAction,
  ReconciliationThresholds,
  AutomationConfig,
  EscalationRule,
  NotificationConfig,
  NotificationChannel,
  NotificationTrigger,
  
  // Analytics
  DashboardData,
  DashboardOverview,
  Metric,
  TrendData,
  Chart,
  ChartData,
  ChartConfig,
  AxisConfig,
  Activity,
  Alert,
  
  // UI
  UIState,
  Notification,
  NotificationAction,
  ModalState,
  LoadingStates,
  ErrorState,
  Breadcrumb,
  
  // Forms
  FormField,
  SelectOption,
  FieldValidation,
  FormState,
  
  // API
  ApiResponse,
  PaginatedResponse,
  PaginationInfo,
  ApiError,
  RequestConfig,
  
  // WebSocket
  WebSocketMessage,
  WebSocketConfig,
  
  // Files
  FileUpload,
  FileInfo,
} */
