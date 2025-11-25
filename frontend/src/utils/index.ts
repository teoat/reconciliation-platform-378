// ============================================================================
// UTILITIES INDEX - SINGLE SOURCE OF TRUTH
// Organized by domain for better maintainability
// ============================================================================
//
// ✅ Consolidated: debounce, throttle, memoize are now in ./common/performance (SSOT)
// ⚠️ NOTE: Some modules may still have overlapping exports (e.g., performanceConfig).
// If you encounter import conflicts, import directly from the specific module.
//

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================
// Common performance utilities (debounce, throttle, memoize) - single source of truth
export { debounce, throttle, memoize } from './common/performance';
// Performance exports - using named exports to avoid conflicts
export {
  usePerformanceMonitoring as usePerformanceMonitoringBasic,
  basicPerformanceConfig,
} from './performance';
export * from './performanceConfig';
export {
  usePerformanceMonitoring,
  useRenderPerformance,
  useMemoryMonitoring,
  useNetworkMonitoring,
  useBundleMonitoring,
  withPerformanceMonitoring,
} from './performanceMonitoring';
export {
  useRenderPerformanceOptimized,
  useDeepMemo,
  useDeepCallback,
  useConditionalMemo,
  useDebounce as useAdvancedDebounce,
  useThrottle as useAdvancedThrottle,
} from './performanceOptimizations';
export * from './bundleOptimization';
export * from './codeSplitting';
export * from './advancedCodeSplitting';
export * from './lazyLoading';
export * from './routeSplitting';
export * from './dynamicImports';
// Virtual scrolling - using .tsx version (more features)
// NOTE: Both .ts and .tsx exist - .tsx has more features (containerRef, scrollToIndex, etc.)
// Components import directly, so this export is for convenience
export * from './virtualScrolling';
export * from './caching';
export * from './memoryOptimization';

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================
export * from './errorHandler';
export * from './errorHandling';
export * from './errorMessages';
export * from './errorExtraction';
export * from './errorExtractionAsync';
export * from './errorSanitization';
export * from './errorStandardization';
export * from './retryUtility';

// ============================================================================
// DATE FORMATTING UTILITIES
// ============================================================================
// Common date formatting utilities - single source of truth
export {
  formatTimeAgo,
  formatTimestamp,
  formatTime,
  formatDate,
} from './common/dateFormatting';

// ============================================================================
// SECURITY UTILITIES
// ============================================================================
// Common sanitization utilities - single source of truth
export {
  sanitizeHtml,
  sanitizeForReact,
  sanitizeTextOnly,
  sanitizeInput,
  escapeHtml,
} from './common/sanitization';
  // Common validation utilities - single source of truth
  export {
    validateEmail,
    emailSchema,
    passwordSchema,
    validatePassword,
    getPasswordStrength,
    getPasswordFeedback,
    validatePasswordStrength,
    validateFile,
    validateFileType,
    validateFileSize,
    nameSchema,
    textSchema,
    validateFormInput,
  } from './common/validation';
// Common error handling utilities - single source of truth
export {
  getErrorMessage,
  getErrorMessageFromApiError,
  extractErrorMessage,
  toError,
  extractErrorCode,
  extractCorrelationId,
  extractErrorFromApiResponse,
  isRetryableError,
  type ExtractedErrorInfo,
} from './common/errorHandling';
export * from './security';
export * from './securityConfig';
export * from './securityAudit';
export * from './sanitize';
// Legacy exports - deprecated, use common/validation instead
export * from './passwordValidation';
export * from './inputValidation';
export * from './fileValidation';
export * from './cspNonce';

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================
export * from './accessibility';
export * from './accessibilityColors';
export * from './colorContrast';
export * from './ariaLiveRegionsHelper';

// ============================================================================
// INGESTION UTILITIES
// ============================================================================
export * from './ingestion/dataTransformation';
export * from './ingestion/qualityMetrics';
export * from './ingestion/validation';

// ============================================================================
// RECONCILIATION UTILITIES
// ============================================================================
export * from './reconciliation/matching';

// ============================================================================
// COMMON UTILITIES
// ============================================================================
export * from './common/filteringSorting';

// ============================================================================
// UI/UX UTILITIES
// ============================================================================
export * from './confetti';
export * from './conversationStorage';
export * from './pwaUtils';

// ============================================================================
// ASSET OPTIMIZATION UTILITIES
// ============================================================================
export * from './imageOptimization';
export * from './fontOptimization';

// ============================================================================
// TESTING UTILITIES
// ============================================================================
export * from './testing';

// ============================================================================
// SERVICE WORKER UTILITIES
// ============================================================================
export * from './serviceWorker';

// ============================================================================
// DEFAULT EXPORTS (for backward compatibility)
// ============================================================================
export { default as performanceUtils } from './performance';
export { default as lazyLoadingUtils } from './lazyLoading';
export { default as bundleOptimizationUtils } from './bundleOptimization';
export { default as testingUtils } from './testing';
