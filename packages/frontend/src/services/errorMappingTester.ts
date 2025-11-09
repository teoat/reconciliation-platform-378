// Backend Error Mapping Testing
// Comprehensive testing suite for verifying user-friendly error messages

import React from 'react'

export interface ErrorMappingTest {
  id: string
  name: string
  description: string
  testFunction: () => Promise<ErrorMappingTestResult>
  category: 'http-errors' | 'validation-errors' | 'business-errors' | 'system-errors'
  priority: 'high' | 'medium' | 'low'
  requiresBackendSimulation: boolean
}

export interface ErrorMappingTestResult {
  success: boolean
  message: string
  details?: any
  timestamp: Date
  duration: number
  errors?: string[]
  errorMappings?: ErrorMapping[]
  userMessages?: UserMessage[]
  translationTests?: TranslationTest[]
}

export interface ErrorMapping {
  backendError: BackendError
  userMessage: UserMessage
  mappingSuccess: boolean
  timestamp: Date
}

export interface BackendError {
  code: string
  message: string
  statusCode: number
  details?: any
  timestamp: Date
}

export interface UserMessage {
  title: string
  description: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  actionRequired: boolean
  suggestedAction?: string
  timestamp: Date
}

export interface TranslationTest {
  language: string
  originalMessage: string
  translatedMessage: string
  translationSuccess: boolean
  timestamp: Date
}

export interface ErrorMappingConfig {
  testTimeout: number
  retryAttempts: number
  retryDelay: number
  enableHttpErrorTests: boolean
  enableValidationErrorTests: boolean
  enableBusinessErrorTests: boolean
  enableSystemErrorTests: boolean
  supportedLanguages: string[]
}

const defaultConfig: ErrorMappingConfig = {
  testTimeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableHttpErrorTests: true,
  enableValidationErrorTests: true,
  enableBusinessErrorTests: true,
  enableSystemErrorTests: true,
  supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja']
}

export class ErrorMappingTester {
  private config: ErrorMappingConfig
  private tests: Map<string, ErrorMappingTest> = new Map()
  private results: Map<string, ErrorMappingTestResult[]> = new Map()
  private isRunning: boolean = false
  private errorMappings: Map<string, UserMessage> = new Map()

  constructor(config: Partial<ErrorMappingConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.initializeTests()
    this.initializeErrorMappings()
  }

  private initializeTests(): void {
    // HTTP Error Tests
    if (this.config.enableHttpErrorTests) {
      this.addTest({
        id: 'http-4xx-errors',
        name: 'HTTP 4xx Error Mapping',
        description: 'Verify HTTP 4xx errors are mapped to user-friendly messages',
        category: 'http-errors',
        priority: 'high',
        requiresBackendSimulation: true,
        testFunction: this.testHttp4xxErrors.bind(this)
      })

      this.addTest({
        id: 'http-5xx-errors',
        name: 'HTTP 5xx Error Mapping',
        description: 'Verify HTTP 5xx errors are mapped to user-friendly messages',
        category: 'http-errors',
        priority: 'high',
        requiresBackendSimulation: true,
        testFunction: this.testHttp5xxErrors.bind(this)
      })

      this.addTest({
        id: 'http-timeout-errors',
        name: 'HTTP Timeout Error Mapping',
        description: 'Verify HTTP timeout errors are mapped correctly',
        category: 'http-errors',
        priority: 'medium',
        requiresBackendSimulation: true,
        testFunction: this.testHttpTimeoutErrors.bind(this)
      })
    }

    // Validation Error Tests
    if (this.config.enableValidationErrorTests) {
      this.addTest({
        id: 'validation-field-errors',
        name: 'Validation Field Error Mapping',
        description: 'Verify field validation errors are mapped to user-friendly messages',
        category: 'validation-errors',
        priority: 'high',
        requiresBackendSimulation: true,
        testFunction: this.testValidationFieldErrors.bind(this)
      })

      this.addTest({
        id: 'validation-format-errors',
        name: 'Validation Format Error Mapping',
        description: 'Verify format validation errors are mapped correctly',
        category: 'validation-errors',
        priority: 'high',
        requiresBackendSimulation: true,
        testFunction: this.testValidationFormatErrors.bind(this)
      })

      this.addTest({
        id: 'validation-business-rules',
        name: 'Validation Business Rules Error Mapping',
        description: 'Verify business rule validation errors are mapped correctly',
        category: 'validation-errors',
        priority: 'medium',
        requiresBackendSimulation: true,
        testFunction: this.testValidationBusinessRules.bind(this)
      })
    }

    // Business Error Tests
    if (this.config.enableBusinessErrorTests) {
      this.addTest({
        id: 'business-logic-errors',
        name: 'Business Logic Error Mapping',
        description: 'Verify business logic errors are mapped to user-friendly messages',
        category: 'business-errors',
        priority: 'high',
        requiresBackendSimulation: true,
        testFunction: this.testBusinessLogicErrors.bind(this)
      })

      this.addTest({
        id: 'permission-errors',
        name: 'Permission Error Mapping',
        description: 'Verify permission errors are mapped correctly',
        category: 'business-errors',
        priority: 'high',
        requiresBackendSimulation: true,
        testFunction: this.testPermissionErrors.bind(this)
      })

      this.addTest({
        id: 'resource-conflict-errors',
        name: 'Resource Conflict Error Mapping',
        description: 'Verify resource conflict errors are mapped correctly',
        category: 'business-errors',
        priority: 'medium',
        requiresBackendSimulation: true,
        testFunction: this.testResourceConflictErrors.bind(this)
      })
    }

    // System Error Tests
    if (this.config.enableSystemErrorTests) {
      this.addTest({
        id: 'database-errors',
        name: 'Database Error Mapping',
        description: 'Verify database errors are mapped to user-friendly messages',
        category: 'system-errors',
        priority: 'high',
        requiresBackendSimulation: true,
        testFunction: this.testDatabaseErrors.bind(this)
      })

      this.addTest({
        id: 'network-errors',
        name: 'Network Error Mapping',
        description: 'Verify network errors are mapped correctly',
        category: 'system-errors',
        priority: 'high',
        requiresBackendSimulation: true,
        testFunction: this.testNetworkErrors.bind(this)
      })

      this.addTest({
        id: 'service-unavailable-errors',
        name: 'Service Unavailable Error Mapping',
        description: 'Verify service unavailable errors are mapped correctly',
        category: 'system-errors',
        priority: 'medium',
        requiresBackendSimulation: true,
        testFunction: this.testServiceUnavailableErrors.bind(this)
      })
    }
  }

  private initializeErrorMappings(): void {
    // Initialize error mappings
    this.errorMappings.set('VALIDATION_ERROR', {
      title: 'Validation Error',
      description: 'Please check your input and try again.',
      severity: 'warning',
      actionRequired: true,
      suggestedAction: 'Review the highlighted fields and correct any errors.',
      timestamp: new Date()
    })

    this.errorMappings.set('AUTHENTICATION_ERROR', {
      title: 'Authentication Required',
      description: 'Please log in to continue.',
      severity: 'error',
      actionRequired: true,
      suggestedAction: 'Click the login button to authenticate.',
      timestamp: new Date()
    })

    this.errorMappings.set('PERMISSION_ERROR', {
      title: 'Access Denied',
      description: 'You do not have permission to perform this action.',
      severity: 'error',
      actionRequired: true,
      suggestedAction: 'Contact your administrator for access.',
      timestamp: new Date()
    })

    this.errorMappings.set('NETWORK_ERROR', {
      title: 'Connection Problem',
      description: 'Unable to connect to the server. Please check your internet connection.',
      severity: 'error',
      actionRequired: true,
      suggestedAction: 'Check your internet connection and try again.',
      timestamp: new Date()
    })

    this.errorMappings.set('SERVER_ERROR', {
      title: 'Server Error',
      description: 'Something went wrong on our end. We are working to fix it.',
      severity: 'critical',
      actionRequired: false,
      suggestedAction: 'Please try again later or contact support if the problem persists.',
      timestamp: new Date()
    })
  }

  private addTest(test: ErrorMappingTest): void {
    this.tests.set(test.id, test)
  }

  // Test Implementation Methods
  private async testHttp4xxErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []
      const translationTests: TranslationTest[] = []

      // Test HTTP 4xx errors
      const http4xxErrors = [
        { code: 'BAD_REQUEST', message: 'Invalid request format', statusCode: 400 },
        { code: 'UNAUTHORIZED', message: 'Authentication required', statusCode: 401 },
        { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 },
        { code: 'NOT_FOUND', message: 'Resource not found', statusCode: 404 },
        { code: 'CONFLICT', message: 'Resource conflict', statusCode: 409 },
        { code: 'UNPROCESSABLE_ENTITY', message: 'Validation failed', statusCode: 422 }
      ]

      for (const error of http4xxErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)

        // Test translations
        for (const language of this.config.supportedLanguages) {
          const translationTest = await this.testErrorTranslation(userMessage, language)
          translationTests.push(translationTest)
        }
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const allTranslated = translationTests.every(test => test.translationSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped && allTranslated,
        message: allMapped && allTranslated
          ? 'HTTP 4xx error mapping working correctly'
          : 'HTTP 4xx error mapping issues detected',
        details: {
          http4xxErrors,
          errorMappings,
          userMessages,
          translationTests
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages,
        translationTests
      }
    } catch (error) {
      return {
        success: false,
        message: `HTTP 4xx error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testHttp5xxErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []
      const translationTests: TranslationTest[] = []

      // Test HTTP 5xx errors
      const http5xxErrors = [
        { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error', statusCode: 500 },
        { code: 'BAD_GATEWAY', message: 'Bad gateway', statusCode: 502 },
        { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable', statusCode: 503 },
        { code: 'GATEWAY_TIMEOUT', message: 'Gateway timeout', statusCode: 504 }
      ]

      for (const error of http5xxErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)

        // Test translations
        for (const language of this.config.supportedLanguages) {
          const translationTest = await this.testErrorTranslation(userMessage, language)
          translationTests.push(translationTest)
        }
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const allTranslated = translationTests.every(test => test.translationSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped && allTranslated,
        message: allMapped && allTranslated
          ? 'HTTP 5xx error mapping working correctly'
          : 'HTTP 5xx error mapping issues detected',
        details: {
          http5xxErrors,
          errorMappings,
          userMessages,
          translationTests
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages,
        translationTests
      }
    } catch (error) {
      return {
        success: false,
        message: `HTTP 5xx error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testHttpTimeoutErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []

      // Test HTTP timeout errors
      const timeoutErrors = [
        { code: 'REQUEST_TIMEOUT', message: 'Request timeout', statusCode: 408 },
        { code: 'GATEWAY_TIMEOUT', message: 'Gateway timeout', statusCode: 504 },
        { code: 'NETWORK_TIMEOUT', message: 'Network timeout', statusCode: 0 }
      ]

      for (const error of timeoutErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped,
        message: allMapped
          ? 'HTTP timeout error mapping working correctly'
          : 'HTTP timeout error mapping issues detected',
        details: {
          timeoutErrors,
          errorMappings,
          userMessages
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages
      }
    } catch (error) {
      return {
        success: false,
        message: `HTTP timeout error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testValidationFieldErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []

      // Test validation field errors
      const validationErrors = [
        { code: 'FIELD_REQUIRED', message: 'Field is required', field: 'email' },
        { code: 'FIELD_TOO_LONG', message: 'Field is too long', field: 'name' },
        { code: 'FIELD_TOO_SHORT', message: 'Field is too short', field: 'password' },
        { code: 'FIELD_INVALID_FORMAT', message: 'Field format is invalid', field: 'phone' }
      ]

      for (const error of validationErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: 422,
          details: { field: error.field },
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped,
        message: allMapped
          ? 'Validation field error mapping working correctly'
          : 'Validation field error mapping issues detected',
        details: {
          validationErrors,
          errorMappings,
          userMessages
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages
      }
    } catch (error) {
      return {
        success: false,
        message: `Validation field error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testValidationFormatErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []

      // Test validation format errors
      const formatErrors = [
        { code: 'INVALID_EMAIL_FORMAT', message: 'Invalid email format', field: 'email' },
        { code: 'INVALID_PHONE_FORMAT', message: 'Invalid phone format', field: 'phone' },
        { code: 'INVALID_DATE_FORMAT', message: 'Invalid date format', field: 'birthDate' },
        { code: 'INVALID_URL_FORMAT', message: 'Invalid URL format', field: 'website' }
      ]

      for (const error of formatErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: 422,
          details: { field: error.field },
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped,
        message: allMapped
          ? 'Validation format error mapping working correctly'
          : 'Validation format error mapping issues detected',
        details: {
          formatErrors,
          errorMappings,
          userMessages
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages
      }
    } catch (error) {
      return {
        success: false,
        message: `Validation format error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testValidationBusinessRules(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []

      // Test validation business rules
      const businessRuleErrors = [
        { code: 'DUPLICATE_EMAIL', message: 'Email already exists', field: 'email' },
        { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance', field: 'amount' },
        { code: 'ACCOUNT_LOCKED', message: 'Account is locked', field: 'account' },
        { code: 'QUOTA_EXCEEDED', message: 'Quota exceeded', field: 'usage' }
      ]

      for (const error of businessRuleErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: 422,
          details: { field: error.field },
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped,
        message: allMapped
          ? 'Validation business rules error mapping working correctly'
          : 'Validation business rules error mapping issues detected',
        details: {
          businessRuleErrors,
          errorMappings,
          userMessages
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages
      }
    } catch (error) {
      return {
        success: false,
        message: `Validation business rules error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testBusinessLogicErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []

      // Test business logic errors
      const businessLogicErrors = [
        { code: 'INVALID_OPERATION', message: 'Invalid operation', operation: 'transfer' },
        { code: 'INSUFFICIENT_PERMISSIONS', message: 'Insufficient permissions', operation: 'delete' },
        { code: 'RESOURCE_IN_USE', message: 'Resource is in use', operation: 'update' },
        { code: 'OPERATION_NOT_ALLOWED', message: 'Operation not allowed', operation: 'create' }
      ]

      for (const error of businessLogicErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: 400,
          details: { operation: error.operation },
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped,
        message: allMapped
          ? 'Business logic error mapping working correctly'
          : 'Business logic error mapping issues detected',
        details: {
          businessLogicErrors,
          errorMappings,
          userMessages
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages
      }
    } catch (error) {
      return {
        success: false,
        message: `Business logic error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testPermissionErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []

      // Test permission errors
      const permissionErrors = [
        { code: 'ACCESS_DENIED', message: 'Access denied', resource: 'user-data' },
        { code: 'INSUFFICIENT_ROLE', message: 'Insufficient role', resource: 'admin-panel' },
        { code: 'RESOURCE_OWNERSHIP', message: 'Resource ownership required', resource: 'project' },
        { code: 'OPERATION_PERMISSION', message: 'Operation permission denied', resource: 'delete' }
      ]

      for (const error of permissionErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: 403,
          details: { resource: error.resource },
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped,
        message: allMapped
          ? 'Permission error mapping working correctly'
          : 'Permission error mapping issues detected',
        details: {
          permissionErrors,
          errorMappings,
          userMessages
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages
      }
    } catch (error) {
      return {
        success: false,
        message: `Permission error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testResourceConflictErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []

      // Test resource conflict errors
      const conflictErrors = [
        { code: 'RESOURCE_CONFLICT', message: 'Resource conflict', resource: 'user' },
        { code: 'CONCURRENT_MODIFICATION', message: 'Concurrent modification', resource: 'document' },
        { code: 'DUPLICATE_RESOURCE', message: 'Duplicate resource', resource: 'email' },
        { code: 'RESOURCE_LOCKED', message: 'Resource is locked', resource: 'file' }
      ]

      for (const error of conflictErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: 409,
          details: { resource: error.resource },
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped,
        message: allMapped
          ? 'Resource conflict error mapping working correctly'
          : 'Resource conflict error mapping issues detected',
        details: {
          conflictErrors,
          errorMappings,
          userMessages
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages
      }
    } catch (error) {
      return {
        success: false,
        message: `Resource conflict error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testDatabaseErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []

      // Test database errors
      const databaseErrors = [
        { code: 'DATABASE_CONNECTION_ERROR', message: 'Database connection error', operation: 'query' },
        { code: 'DATABASE_TIMEOUT', message: 'Database timeout', operation: 'insert' },
        { code: 'DATABASE_CONSTRAINT_ERROR', message: 'Database constraint error', operation: 'update' },
        { code: 'DATABASE_DEADLOCK', message: 'Database deadlock', operation: 'transaction' }
      ]

      for (const error of databaseErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: 500,
          details: { operation: error.operation },
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped,
        message: allMapped
          ? 'Database error mapping working correctly'
          : 'Database error mapping issues detected',
        details: {
          databaseErrors,
          errorMappings,
          userMessages
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages
      }
    } catch (error) {
      return {
        success: false,
        message: `Database error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testNetworkErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []

      // Test network errors
      const networkErrors = [
        { code: 'NETWORK_ERROR', message: 'Network error', operation: 'request' },
        { code: 'CONNECTION_REFUSED', message: 'Connection refused', operation: 'connect' },
        { code: 'DNS_ERROR', message: 'DNS error', operation: 'resolve' },
        { code: 'SSL_ERROR', message: 'SSL error', operation: 'secure' }
      ]

      for (const error of networkErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: 0,
          details: { operation: error.operation },
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped,
        message: allMapped
          ? 'Network error mapping working correctly'
          : 'Network error mapping issues detected',
        details: {
          networkErrors,
          errorMappings,
          userMessages
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages
      }
    } catch (error) {
      return {
        success: false,
        message: `Network error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async testServiceUnavailableErrors(): Promise<ErrorMappingTestResult> {
    const startTime = Date.now()
    
    try {
      const errorMappings: ErrorMapping[] = []
      const userMessages: UserMessage[] = []

      // Test service unavailable errors
      const serviceErrors = [
        { code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable', service: 'auth' },
        { code: 'SERVICE_OVERLOADED', message: 'Service overloaded', service: 'api' },
        { code: 'SERVICE_MAINTENANCE', message: 'Service maintenance', service: 'database' },
        { code: 'SERVICE_DEPRECATED', message: 'Service deprecated', service: 'legacy' }
      ]

      for (const error of serviceErrors) {
        const backendError: BackendError = {
          code: error.code,
          message: error.message,
          statusCode: 503,
          details: { service: error.service },
          timestamp: new Date()
        }

        // Map error to user message
        const userMessage = await this.mapErrorToUserMessage(backendError)
        userMessages.push(userMessage)

        // Test error mapping
        const errorMapping: ErrorMapping = {
          backendError,
          userMessage,
          mappingSuccess: userMessage !== null,
          timestamp: new Date()
        }
        errorMappings.push(errorMapping)
      }

      const allMapped = errorMappings.every(mapping => mapping.mappingSuccess)
      const duration = Date.now() - startTime

      return {
        success: allMapped,
        message: allMapped
          ? 'Service unavailable error mapping working correctly'
          : 'Service unavailable error mapping issues detected',
        details: {
          serviceErrors,
          errorMappings,
          userMessages
        },
        timestamp: new Date(),
        duration,
        errorMappings,
        userMessages
      }
    } catch (error) {
      return {
        success: false,
        message: `Service unavailable error mapping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  // Helper Methods (Mock implementations - replace with actual API calls)
  private async mapErrorToUserMessage(backendError: BackendError): Promise<UserMessage | null> {
    // Mock implementation
    const mapping = this.errorMappings.get(backendError.code)
    if (mapping) {
      return {
        ...mapping,
        timestamp: new Date()
      }
    }

    // Default mapping for unmapped errors
    return {
      title: 'Error',
      description: backendError.message,
      severity: backendError.statusCode >= 500 ? 'critical' : backendError.statusCode >= 400 ? 'error' : 'warning',
      actionRequired: backendError.statusCode >= 400,
      suggestedAction: 'Please try again or contact support if the problem persists.',
      timestamp: new Date()
    }
  }

  private async testErrorTranslation(userMessage: UserMessage, language: string): Promise<TranslationTest> {
    // Mock implementation
    const translatedMessage = this.translateMessage(userMessage, language)
    const translationSuccess = translatedMessage !== null

    return {
      language,
      originalMessage: userMessage.description,
      translatedMessage: translatedMessage || userMessage.description,
      translationSuccess,
      timestamp: new Date()
    }
  }

  private translateMessage(userMessage: UserMessage, language: string): string | null {
    // Mock translation implementation
    const translations: Record<string, Record<string, string>> = {
      'es': {
        'Validation Error': 'Error de Validación',
        'Authentication Required': 'Autenticación Requerida',
        'Access Denied': 'Acceso Denegado',
        'Connection Problem': 'Problema de Conexión',
        'Server Error': 'Error del Servidor'
      },
      'fr': {
        'Validation Error': 'Erreur de Validation',
        'Authentication Required': 'Authentification Requise',
        'Access Denied': 'Accès Refusé',
        'Connection Problem': 'Problème de Connexion',
        'Server Error': 'Erreur du Serveur'
      },
      'de': {
        'Validation Error': 'Validierungsfehler',
        'Authentication Required': 'Authentifizierung Erforderlich',
        'Access Denied': 'Zugriff Verweigert',
        'Connection Problem': 'Verbindungsproblem',
        'Server Error': 'Serverfehler'
      },
      'zh': {
        'Validation Error': '验证错误',
        'Authentication Required': '需要身份验证',
        'Access Denied': '访问被拒绝',
        'Connection Problem': '连接问题',
        'Server Error': '服务器错误'
      },
      'ja': {
        'Validation Error': '検証エラー',
        'Authentication Required': '認証が必要',
        'Access Denied': 'アクセス拒否',
        'Connection Problem': '接続の問題',
        'Server Error': 'サーバーエラー'
      }
    }

    return translations[language]?.[userMessage.title] || null
  }

  // Public Methods
  public async runTest(testId: string): Promise<ErrorMappingTestResult> {
    const test = this.tests.get(testId)
    if (!test) {
      throw new Error(`Test with id ${testId} not found`)
    }

    const result = await this.executeTestWithRetry(test)
    
    // Store result
    if (!this.results.has(testId)) {
      this.results.set(testId, [])
    }
    this.results.get(testId)!.push(result)
    
    return result
  }

  public async runAllTests(): Promise<Map<string, ErrorMappingTestResult>> {
    if (this.isRunning) {
      throw new Error('Tests are already running')
    }

    this.isRunning = true
    const results = new Map<string, ErrorMappingTestResult>()

    try {
      const testPromises = Array.from(this.tests.entries()).map(async ([testId, test]) => {
        const result = await this.executeTestWithRetry(test)
        results.set(testId, result)
        return result
      })

      await Promise.all(testPromises)
    } finally {
      this.isRunning = false
    }

    return results
  }

  public async runTestsByCategory(category: ErrorMappingTest['category']): Promise<Map<string, ErrorMappingTestResult>> {
    const categoryTests = Array.from(this.tests.entries()).filter(([, test]) => test.category === category)
    const results = new Map<string, ErrorMappingTestResult>()

    for (const [testId, test] of categoryTests) {
      const result = await this.executeTestWithRetry(test)
      results.set(testId, result)
    }

    return results
  }

  private async executeTestWithRetry(test: ErrorMappingTest): Promise<ErrorMappingTestResult> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await Promise.race([
          test.testFunction(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), this.config.testTimeout)
          )
        ])

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < this.config.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt))
        }
      }
    }

    return {
      success: false,
      message: `Test failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
      timestamp: new Date(),
      duration: 0,
      errors: [lastError?.message || 'Unknown error']
    }
  }

  public getTestResults(testId?: string): ErrorMappingTestResult[] | Map<string, ErrorMappingTestResult[]> {
    if (testId) {
      return this.results.get(testId) || []
    }
    return this.results
  }

  public getTestSummary(): {
    total: number
    passed: number
    failed: number
    successRate: number
    averageDuration: number
    totalErrorMappings: number
    totalUserMessages: number
    totalTranslationTests: number
  } {
    const allResults = Array.from(this.results.values()).flat()
    
    if (allResults.length === 0) {
      return { total: 0, passed: 0, failed: 0, successRate: 0, averageDuration: 0, totalErrorMappings: 0, totalUserMessages: 0, totalTranslationTests: 0 }
    }

    const passed = allResults.filter(r => r.success).length
    const failed = allResults.length - passed
    const successRate = (passed / allResults.length) * 100
    const averageDuration = allResults.reduce((sum, r) => sum + r.duration, 0) / allResults.length
    
    const totalErrorMappings = allResults.reduce((sum, r) => sum + (r.errorMappings?.length || 0), 0)
    const totalUserMessages = allResults.reduce((sum, r) => sum + (r.userMessages?.length || 0), 0)
    const totalTranslationTests = allResults.reduce((sum, r) => sum + (r.translationTests?.length || 0), 0)

    return {
      total: allResults.length,
      passed,
      failed,
      successRate,
      averageDuration,
      totalErrorMappings,
      totalUserMessages,
      totalTranslationTests
    }
  }

  public clearResults(): void {
    this.results.clear()
  }

  public getAvailableTests(): ErrorMappingTest[] {
    return Array.from(this.tests.values())
  }
}

// Export the tester class
export default ErrorMappingTester
