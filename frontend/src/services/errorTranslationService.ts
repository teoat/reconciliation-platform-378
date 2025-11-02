// Error Translation Service - Frontend equivalent of backend error translation
// Translates backend error codes to user-friendly messages

export interface ErrorTranslationContext {
  component?: string;
  action?: string;
  data?: any;
  statusCode?: number;
}

export interface ErrorTranslation {
  userMessage: string;
  suggestion?: string;
  category:
    | 'authentication'
    | 'authorization'
    | 'validation'
    | 'network'
    | 'database'
    | 'file'
    | 'payment'
    | 'system'
    | 'user_action';
}

class ErrorTranslationService {
  private static instance: ErrorTranslationService;
  private translations: Map<string, ErrorTranslation>;

  public static getInstance(): ErrorTranslationService {
    if (!ErrorTranslationService.instance) {
      ErrorTranslationService.instance = new ErrorTranslationService();
    }
    return ErrorTranslationService.instance;
  }

  constructor() {
    this.translations = new Map();

    // Initialize translations based on backend error codes
    this.initializeTranslations();
  }

  private initializeTranslations(): void {
    // Authentication errors
    this.translations.set('UNAUTHORIZED', {
      userMessage: 'Please log in to continue',
      suggestion: 'Click the login button to sign in',
      category: 'authentication',
    });

    this.translations.set('INVALID_TOKEN', {
      userMessage: 'Your session has expired. Please log in again',
      suggestion: 'Click the login button to sign in again',
      category: 'authentication',
    });

    this.translations.set('AUTH_INVALID_CREDENTIALS', {
      userMessage: 'Invalid email or password',
      suggestion: 'Please check your credentials and try again',
      category: 'authentication',
    });

    this.translations.set('AUTH_INSUFFICIENT_PERMISSIONS', {
      userMessage: "You don't have permission to perform this action",
      suggestion: 'Contact your administrator if you believe this is an error',
      category: 'authorization',
    });

    // Authorization errors
    this.translations.set('FORBIDDEN', {
      userMessage: "You don't have permission to perform this action",
      suggestion: 'Contact your administrator if you believe this is an error',
      category: 'authorization',
    });

    this.translations.set('AUTHORIZATION_ERROR', {
      userMessage: 'Access denied',
      suggestion: 'You may not have the required permissions for this action',
      category: 'authorization',
    });

    // Validation errors
    this.translations.set('VALIDATION_ERROR', {
      userMessage: 'Please check your input and try again',
      suggestion: 'Review the highlighted fields for errors',
      category: 'validation',
    });

    this.translations.set('VALIDATION_FAILED', {
      userMessage: 'Some information is missing or incorrect',
      suggestion: 'Please review all fields and correct any errors',
      category: 'validation',
    });

    this.translations.set('EMAIL_INVALID', {
      userMessage: 'Please enter a valid email address',
      suggestion: 'Check that your email address is formatted correctly',
      category: 'validation',
    });

    // Network errors
    this.translations.set('CONNECTION_ERROR', {
      userMessage: 'Unable to connect to the server',
      suggestion: 'Check your internet connection and try again',
      category: 'network',
    });

    this.translations.set('TIMEOUT', {
      userMessage: 'The request timed out',
      suggestion: 'Please try again in a moment',
      category: 'network',
    });

    // Database errors
    this.translations.set('DATABASE_ERROR', {
      userMessage: 'A database error occurred',
      suggestion: 'Please try again. If the problem persists, contact support',
      category: 'database',
    });

    this.translations.set('REDIS_ERROR', {
      userMessage: 'Cache service is temporarily unavailable',
      suggestion: 'Some features may be slower than usual',
      category: 'database',
    });

    // File errors
    this.translations.set('FILE_ERROR', {
      userMessage: 'File upload failed',
      suggestion: 'Check the file format and size, then try again',
      category: 'file',
    });

    // System errors
    this.translations.set('INTERNAL_ERROR', {
      userMessage: 'An unexpected error occurred',
      suggestion: 'Please try again. If the problem persists, contact support',
      category: 'system',
    });

    this.translations.set('SERVICE_UNAVAILABLE', {
      userMessage: 'Service is temporarily unavailable',
      suggestion: 'Please try again in a few minutes',
      category: 'system',
    });

    this.translations.set('CONFIG_ERROR', {
      userMessage: 'Configuration error',
      suggestion: 'The application is not properly configured. Please contact support',
      category: 'system',
    });

    // Resource errors
    this.translations.set('RESOURCE_NOT_FOUND', {
      userMessage: 'The requested item was not found',
      suggestion: 'The item may have been deleted or you may not have access to it',
      category: 'user_action',
    });

    this.translations.set('NOT_FOUND', {
      userMessage: 'The requested resource was not found',
      suggestion: 'Please check the URL and try again',
      category: 'user_action',
    });

    this.translations.set('RESOURCE_CONFLICT', {
      userMessage: 'This action conflicts with existing data',
      suggestion: 'Please review your changes and try again',
      category: 'user_action',
    });

    this.translations.set('CONFLICT', {
      userMessage: 'A conflict occurred',
      suggestion: 'The item may have been modified by someone else',
      category: 'user_action',
    });

    // Rate limiting
    this.translations.set('RATE_LIMIT_EXCEEDED', {
      userMessage: 'Too many requests',
      suggestion: 'Please wait a moment before trying again',
      category: 'system',
    });

    // CSRF errors
    this.translations.set('CSRF_TOKEN_MISSING', {
      userMessage: 'Security token missing',
      suggestion: 'Please refresh the page and try again',
      category: 'system',
    });

    this.translations.set('CSRF_TOKEN_INVALID', {
      userMessage: 'Invalid security token',
      suggestion: 'Please refresh the page and try again',
      category: 'system',
    });

    // JWT errors
    this.translations.set('JWT_ERROR', {
      userMessage: 'Authentication token error',
      suggestion: 'Please log in again',
      category: 'authentication',
    });

    // IO errors
    this.translations.set('IO_ERROR', {
      userMessage: 'File system error occurred',
      suggestion: 'Please try again. If the problem persists, contact support',
      category: 'system',
    });

    // Serialization errors
    this.translations.set('SERIALIZATION_ERROR', {
      userMessage: 'Invalid data format',
      suggestion: 'The data received is not in the expected format',
      category: 'system',
    });

    // Alert errors
    this.translations.set('ALERT', {
      userMessage: 'System alert',
      suggestion: 'Please check system notifications for more information',
      category: 'system',
    });

    // Offline errors
    this.translations.set('OFFLINE', {
      userMessage: 'You appear to be offline',
      suggestion: 'Check your internet connection and try again',
      category: 'network',
    });

    // Optimistic update errors
    this.translations.set('OPTIMISTIC_UPDATE', {
      userMessage: 'Your changes could not be saved',
      suggestion: 'The data may have been modified by someone else. Please refresh and try again',
      category: 'user_action',
    });

    // Bad request
    this.translations.set('BAD_REQUEST', {
      userMessage: 'Invalid request',
      suggestion: 'Please check your input and try again',
      category: 'validation',
    });

    // Unknown errors
    this.translations.set('UNKNOWN_ERROR', {
      userMessage: 'An unexpected error occurred',
      suggestion: 'Please try again. If the problem persists, contact support',
      category: 'system',
    });
  }

  public translateError(errorCode: string, _context?: ErrorTranslationContext): ErrorTranslation {
    const translation = this.translations.get(errorCode);

    if (translation) {
      return translation;
    }

    // Return default translation for unknown error codes
    return {
      userMessage: 'An unexpected error occurred',
      suggestion: 'Please try again. If the problem persists, contact support',
      category: 'system',
    };
  }

  public addTranslation(errorCode: string, translation: ErrorTranslation): void {
    this.translations.set(errorCode, translation);
  }

  public removeTranslation(errorCode: string): void {
    this.translations.delete(errorCode);
  }

  public getAllTranslations(): Map<string, ErrorTranslation> {
    return new Map(this.translations);
  }

  public hasTranslation(errorCode: string): boolean {
    return this.translations.has(errorCode);
  }
}

// Export singleton instance
export const errorTranslationService = ErrorTranslationService.getInstance();
