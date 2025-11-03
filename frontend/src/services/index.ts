// ============================================================================
// UNIFIED SERVICE EXPORTS - SINGLE SOURCE OF TRUTH
// ============================================================================

// Main API Client
export { 
  apiClient, 
  wsClient, 
  UnifiedApiClient as ApiClient,
  WebSocketClient,
  type ApiResponse,
  type PaginationInfo,
  type AuthTokens,
  type User,
  type Project,
  type IngestionJob,
  type ReconciliationRecord,
  type ApiError,
  type RequestInterceptor,
  type ResponseInterceptor,
  type RequestConfig
} from './apiClient'

// Base Service Architecture
export { 
  BaseService, 
  PersistenceService, 
  CachingService,
  type ServiceConfig 
} from './BaseService'

// Utility Services
export { 
  ErrorService, 
  errorService,
  type ErrorInfo 
} from './utils/errorService'

export { 
  DataService, 
  dataService,
  type DataItem 
} from './utils/dataService'

// UI Services
export { 
  UIService, 
  uiService,
  type UIState 
} from './ui/uiService'

// Specialized Services
export { default as DataManagementService } from './dataManagement'
export { securityService as SecurityService, default as securityService } from './security/index'
export { businessIntelligenceService as BusinessIntelligenceService, default as businessIntelligenceService, useBusinessIntelligence } from './businessIntelligence/index'
export { default as CacheService } from './cacheService'
export { default as FileService } from './fileService'
export { default as FormService } from './formService'
export { default as LoggerService } from './logger'
// PerformanceMonitor removed - use performanceService or monitoringService instead
// PWAService removed - functionality integrated elsewhere
export { default as RealtimeSyncService } from './realtimeSync'
export { default as RetryService } from './retryService'
export { default as WebSocketService } from './webSocketService'

// Onboarding Services
export { 
  onboardingService,
  type OnboardingType,
  type OnboardingProgress,
  type OnboardingAnalytics
} from './onboardingService'

// Tip Engine Service
export { 
  tipEngine,
  default as tipEngineService,
  type Tip,
  type TipPriority,
  type TipContext,
  type UserBehavior,
  type TipEngineConfig
} from './tipEngine'

// Help Content Service
export { 
  helpContentService,
  default as helpContentServiceInstance,
  type HelpContent,
  type HelpContentType,
  type HelpContentCategory,
  type HelpSearchResult
} from './helpContentService'

// Constants
// Constants moved to config/AppConfig.ts
// export * from './constants'

// Default export for convenience
export { apiClient as default }
