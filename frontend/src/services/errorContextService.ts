// Error context service - provides context tracking for errors

export interface ErrorContext {
  timestamp: Date;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

class ErrorContextService {
  private contexts: Map<string, ErrorContext> = new Map();

  setContext(errorId: string, context: ErrorContext): void {
    this.contexts.set(errorId, context);
  }

  getContext(errorId: string): ErrorContext | undefined {
    return this.contexts.get(errorId);
  }

  clearContext(errorId: string): void {
    this.contexts.delete(errorId);
  }

  getAllContexts(): ErrorContext[] {
    return Array.from(this.contexts.values());
  }
}

export const errorContextService = new ErrorContextService();
