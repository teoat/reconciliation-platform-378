/**
 * Error Translation Service (SSOT)
 *
 * Translates technical error codes into user-friendly messages.
 */

export interface ErrorTranslation {
  code: string;
  userMessage: string;
  actionableHint?: string;
}

class ErrorTranslationService {
  private static instance: ErrorTranslationService;

  private translations: Record<string, string> = {
    'NETWORK_ERROR': 'We are having trouble connecting to the server.',
    'TIMEOUT': 'The request timed out. Please try again.',
    'VALIDATION_ERROR': 'Please check your input.',
    'AUTHENTICATION_ERROR': 'Please log in to continue.',
    'AUTHORIZATION_ERROR': 'You do not have permission to perform this action.',
    'NOT_FOUND': 'The requested resource could not be found.',
    'SERVER_ERROR': 'Something went wrong on our end.',
    'UNKNOWN_ERROR': 'An unexpected error occurred.',
  };

  private constructor() {}

  static getInstance(): ErrorTranslationService {
    if (!ErrorTranslationService.instance) {
      ErrorTranslationService.instance = new ErrorTranslationService();
    }
    return ErrorTranslationService.instance;
  }

  translateError(code: string, context?: any): ErrorTranslation {
    const message = this.translations[code] || this.translations['UNKNOWN_ERROR'];

    return {
      code,
      userMessage: message,
    };
  }

  registerTranslation(code: string, message: string): void {
    this.translations[code] = message;
  }
}

export const errorTranslationService = ErrorTranslationService.getInstance();
