/**
 * Error Context Service
 * Manages context information for errors
 */

export interface ErrorContext {
  correlationId: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

class ErrorContextService {
  private currentContext: Partial<ErrorContext> = {};

  setContext(context: Partial<ErrorContext>): void {
    this.currentContext = { ...this.currentContext, ...context };
  }

  getContext(): Partial<ErrorContext> {
    return { ...this.currentContext };
  }

  clearContext(): void {
    this.currentContext = {};
  }

  generateCorrelationId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const errorContextService = new ErrorContextService();
export default errorContextService;
