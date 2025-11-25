// ============================================================================
// UNIFIED SERVICE REGISTRY - SINGLE SOURCE OF TRUTH
// ============================================================================
// Comprehensive service exports with JSDoc documentation
// All services should be imported from this file
// ============================================================================

// ============================================================================
// API CLIENT SERVICES
// ============================================================================

/**
 * Main API Client
 * @example
 * ```typescript
 * import { apiClient } from '@/services';
 * const response = await apiClient.get('/api/projects');
 * ```
 */
export {
  apiClient,
  wsClient,
  ApiClient,
  WebSocketClient,
  type ApiResponse,
  type RequestConfig,
} from './apiClient';
// Re-export interceptor types
export type {
  RequestInterceptor,
  ResponseInterceptor,
} from './apiClient/interceptors';
// Re-export ApiError type
export type { ApiErrorLike as ApiError } from './apiClient/types';
// Re-export types from backend-aligned
export type {
  User,
  Project,
  ReconciliationResultDetail as ReconciliationRecord,
} from '../types/backend-aligned';
// Re-export PaginationInfo from types/api
export type { PaginationInfo } from '../types/api';
// IngestionJob - use from backend-aligned if exists, otherwise define
export type IngestionJob = {
  id: string;
  project_id: string;
  status: string;
  [key: string]: unknown;
};
// AuthTokens type
export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

// ============================================================================
// BASE SERVICE ARCHITECTURE
// ============================================================================

/**
 * Base Service Classes
 * Provides foundation for all services with persistence and caching
 */
export { BaseService, PersistenceService, CachingService, type ServiceConfig } from './BaseService';

// ============================================================================
// ERROR HANDLING SERVICES
// ============================================================================

/**
 * Unified Error Service
 * Single source of truth for error handling
 * Integrates error parsing, translation, and context tracking
 * @example
 * ```typescript
 * import { unifiedErrorService } from '@/services';
 * unifiedErrorService.handleError(error, { component: 'LoginForm' });
 * const userMessage = unifiedErrorService.getUserFriendlyMessage(error);
 * ```
 */
export {
  UnifiedErrorService,
  unifiedErrorService,
  type UnifiedApiError,
  type ErrorContext,
} from './unifiedErrorService';

/**
 * Error Context Service
 * Tracks error context (user, project, component, etc.)
 */
export {
  errorContextService,
  type ErrorContext as ErrorContextType,
  type ErrorContextEvent,
} from './errorContextService';

/**
 * Error Translation Service
 * Translates backend error codes to user-friendly messages
 */
export {
  errorTranslationService,
  type ErrorTranslation,
  type ErrorTranslationContext,
} from './errorTranslationService';

/**
 * Legacy Error Service (from utils)
 * @deprecated Use unifiedErrorService instead
 */
export { ErrorService, errorService, type ErrorInfo } from './utils/errorService';

// ============================================================================
// RETRY & RESILIENCE SERVICES
// ============================================================================

/**
 * Unified Retry Service
 * Provides exponential backoff, circuit breaker, and retry logic
 * @example
 * ```typescript
 * import { retryService } from '@/services';
 * const result = await retryService.executeWithRetry(
 *   () => fetchData(),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 * ```
 */
export {
  retryService,
  retryWithBackoff,
  retryWithJitter,
  createRetryableFetch,
  useRetry,
  type RetryConfig,
  type RetryResult,
  type CircuitBreakerConfig,
  type CircuitBreakerState,
} from './retryService';

// ============================================================================
// STORAGE & PERSISTENCE SERVICES
// ============================================================================

/**
 * Unified Storage Tester
 * Tests localStorage, sessionStorage, and IndexedDB operations
 * @example
 * ```typescript
 * import { unifiedStorageTester } from '@/services';
 * const result = await unifiedStorageTester.testLocalStorage();
 * ```
 */
export {
  UnifiedStorageTester,
  unifiedStorageTester,
  localStorageTester,
  sessionStorageTester,
  type StorageOperation,
  type StorageTestResult,
  type PersistenceMetrics,
  type DataIntegrityCheck,
} from './unifiedStorageTester';

/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data
 */
export { secureStorage, type SecureStorageConfig } from './secureStorage';

/**
 * Offline Data Service
 * Handles offline data persistence and sync
 */
export { offlineDataService, type OfflineData } from './offlineDataService';

// ============================================================================
// DATA SERVICES
// ============================================================================

/**
 * Data Service (from utils)
 * Generic data management service
 */
export { DataService, dataService, type DataItem } from './utils/dataService';

/**
 * Data Management Service
 * Comprehensive data management with CRUD operations
 */
export { default as DataManagementService } from './dataManagement';

/**
 * Cache Service
 * Provides caching layer for API responses and computed data
 */
export { default as CacheService } from './cacheService';

// ============================================================================
// UI SERVICES
// ============================================================================

/**
 * UI Service
 * Manages UI state, themes, and UI-related operations
 */
export { UIService, uiService, type UIState } from './ui/uiService';

/**
 * Optimistic UI Service
 * Handles optimistic updates for better UX
 */
export { optimisticUIService, type OptimisticUpdate } from './optimisticUIService';

// ============================================================================
// SECURITY SERVICES
// ============================================================================

/**
 * Security Service
 * Comprehensive security service including CSP, CSRF, XSS protection
 * @example
 * ```typescript
 * import { securityService } from '@/services';
 * securityService.validateInput(userInput);
 * securityService.checkCSRFToken(token);
 * ```
 */
export { securityService as SecurityService, default as securityService } from './security/index';

/**
 * Auth Security Service
 * Authentication and authorization security
 */
export { authSecurity } from './authSecurity';

// ============================================================================
// BUSINESS INTELLIGENCE SERVICES
// ============================================================================

/**
 * Business Intelligence Service
 * Analytics, reporting, and data intelligence
 */
export {
  businessIntelligenceService as BusinessIntelligenceService,
  default as businessIntelligenceService,
  useBusinessIntelligence,
} from './businessIntelligence/index';

// ============================================================================
// FILE & FORM SERVICES
// ============================================================================

/**
 * File Service
 * Handles file operations, uploads, and downloads
 */
export { default as FileService } from './fileService';

/**
 * Form Service
 * Form state management and validation
 */
export { default as FormService } from './formService';

// ============================================================================
// LOGGING & MONITORING SERVICES
// ============================================================================

/**
 * Logger Service
 * Centralized logging service
 * @example
 * ```typescript
 * import { logger } from '@/services/logger';
 * logger.info('Operation completed');
 * logger.error('Error occurred', error);
 * ```
 */
export { default as LoggerService, logger } from './logger';

/**
 * Monitoring Services
 * Performance monitoring and error tracking
 */
export { errorTracking, performanceMonitoring } from './monitoring';

// ============================================================================
// REAL-TIME SERVICES
// ============================================================================

/**
 * WebSocket Service
 * Real-time communication via WebSocket
 */
export { default as WebSocketService } from './webSocketService';

/**
 * Realtime Sync Service
 * Real-time data synchronization
 */
export { default as RealtimeSyncService } from './realtimeSync';

// ============================================================================
// ONBOARDING & HELP SERVICES
// ============================================================================

/**
 * Onboarding Service
 * User onboarding and tutorial management
 */
export {
  onboardingService,
  type OnboardingType,
  type OnboardingProgress,
  type OnboardingAnalytics,
} from './onboardingService';

/**
 * Tip Engine Service
 * Contextual tips and suggestions
 */
export {
  tipEngine,
  default as tipEngineService,
  type Tip,
  type TipPriority,
  type TipContext,
  type UserBehavior,
  type TipEngineConfig,
} from './tipEngine';

/**
 * Help Content Service
 * Help documentation and content management
 */
export {
  helpContentService,
  default as helpContentServiceInstance,
  type HelpContent,
  type HelpContentType,
  type HelpContentCategory,
  type HelpSearchResult,
} from './helpContentService';

// ============================================================================
// SERVICE INTEGRATION
// ============================================================================

/**
 * Service Integration Service
 * Ties all critical services together with unified error handling
 * @example
 * ```typescript
 * import { serviceIntegrationService } from '@/services/serviceIntegrationService';
 * const error = await serviceIntegrationService.handleError(error, {
 *   component: 'ProjectList',
 *   action: 'fetchProjects'
 * });
 * ```
 */
export {
  serviceIntegrationService,
  type UnifiedError,
  type ServiceStatus,
  type ServiceIntegrationConfig,
} from './serviceIntegrationService';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export: API Client
 * For convenience: import apiClient from '@/services'
 */
export { apiClient as default };
