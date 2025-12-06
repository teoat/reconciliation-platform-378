// Error translation service - provides user-friendly error messages

export interface ErrorTranslation {
  code: string;
  message: string;
  userMessage: string;
  locale?: string;
  suggestions?: string[];
}

class ErrorTranslationService {
  private translations: Map<string, ErrorTranslation> = new Map();

  translate(errorCode: string, locale = 'en'): ErrorTranslation {
    const translation = this.translations.get(`${errorCode}_${locale}`);
    if (translation) {
      return translation;
    }

    // Default translation
    return {
      code: errorCode,
      message: `Error: ${errorCode}`,
      userMessage: 'An error occurred. Please try again.',
      locale,
    };
  }

  translateError(errorCode: string, locale = 'en'): ErrorTranslation {
    return this.translate(errorCode, locale);
  }

  setTranslation(translation: ErrorTranslation): void {
    const key = `${translation.code}_${translation.locale || 'en'}`;
    this.translations.set(key, translation);
  }

  hasTranslation(errorCode: string, locale = 'en'): boolean {
    return this.translations.has(`${errorCode}_${locale}`);
  }
}

export const errorTranslationService = new ErrorTranslationService();
