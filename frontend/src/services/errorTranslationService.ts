/**
 * Error Translation Service
 * Translates error codes to user-friendly messages
 */

export interface TranslatedError {
  code: string;
  message: string;
  userMessage: string;
  action?: string;
}

class ErrorTranslationService {
  private translations: Map<string, TranslatedError> = new Map();

  constructor() {
    this.initializeTranslations();
  }

  private initializeTranslations(): void {
    const defaultTranslations: TranslatedError[] = [
      { code: 'NETWORK_ERROR', message: 'Network error', userMessage: 'Unable to connect. Please check your internet connection.' },
      { code: 'AUTH_ERROR', message: 'Authentication error', userMessage: 'Please log in again to continue.' },
      { code: 'VALIDATION_ERROR', message: 'Validation error', userMessage: 'Please check your input and try again.' },
      { code: 'SERVER_ERROR', message: 'Server error', userMessage: 'Something went wrong. Please try again later.' },
      { code: 'NOT_FOUND', message: 'Not found', userMessage: 'The requested resource was not found.' },
    ];

    defaultTranslations.forEach((t) => this.translations.set(t.code, t));
  }

  translate(errorCode: string): TranslatedError {
    return (
      this.translations.get(errorCode) || {
        code: errorCode,
        message: 'Unknown error',
        userMessage: 'An unexpected error occurred.',
      }
    );
  }

  addTranslation(translation: TranslatedError): void {
    this.translations.set(translation.code, translation);
  }
}

export const errorTranslationService = new ErrorTranslationService();
export default errorTranslationService;
