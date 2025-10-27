// ============================================================================
// ORGANIZED HOOKS INDEX - SINGLE SOURCE OF TRUTH
// ============================================================================

// Export all organized hook categories
export * from './state'
export * from './async'
export * from './forms'
export * from './performance'

// Export window hooks
export * from './window'

// Export ref hooks  
export * from './refs'

// Export existing specialized hooks
export * from './useApi'
export * from './useAuth'
export * from './useAutoSaveForm'
export * from './useForm'
export * from './usePerformance'
export * from './useRealtimeSync'
export * from './useSecurity'
export * from './useTheme'
// useWebSocket removed - use useWebSocketIntegration instead
// export * from './useWebSocket'
export * from './useDebounce'

// Export utilities
export * from '../utils'
