/**
 * Error Context Service (SSOT)
 *
 * Manages error context and tracking.
 */

import { logger } from '@/services/logger';

export interface ErrorContextType {
  userId?: string;
  projectId?: string;
  component?: string;
  action?: string;
  workflowStage?: string;
  [key: string]: unknown;
}

class ErrorContextService {
  private static instance: ErrorContextService;
  private currentContext: ErrorContextType | null = null;
  private errorHistory: Array<{ error: Error; context: ErrorContextType; timestamp: Date }> = [];
  private readonly maxHistory = 50;

  private constructor() {}

  static getInstance(): ErrorContextService {
    if (!ErrorContextService.instance) {
      ErrorContextService.instance = new ErrorContextService();
    }
    return ErrorContextService.instance;
  }

  setContext(context: ErrorContextType): void {
    this.currentContext = { ...this.currentContext, ...context };
  }

  clearContext(): void {
    this.currentContext = null;
  }

  getCurrentContext(): ErrorContextType | null {
    return this.currentContext;
  }

  trackError(error: Error, additionalContext: ErrorContextType = {}): void {
    const context = { ...this.currentContext, ...additionalContext };

    this.errorHistory.unshift({
      error,
      context,
      timestamp: new Date(),
    });

    if (this.errorHistory.length > this.maxHistory) {
      this.errorHistory.pop();
    }
  }

  getErrorHistory() {
    return this.errorHistory;
  }
}

export const errorContextService = ErrorContextService.getInstance();
