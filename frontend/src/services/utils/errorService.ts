// Unified Error Handling Service
import { BaseService } from '../BaseService'

export interface ErrorInfo {
  id: string
  code: string
  message: string
  stack?: string
  timestamp: Date
  context?: Record<string, unknown>
  resolved?: boolean
}

export class ErrorService extends BaseService<ErrorInfo> {
  private static instance: ErrorService
  
  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService()
    }
    return ErrorService.instance
  }
  
  constructor() {
    super({ persistence: true })
  }
  
  public reportError(error: Error, context?: Record<string, unknown>): string {
    const errorId = this.generateId()
    const errorInfo: ErrorInfo = {
      id: errorId,
      code: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      context,
      resolved: false
    }
    
    this.set(errorId, errorInfo)
    this.emit('error', errorInfo)
    
    return errorId
  }
  
  public resolveError(errorId: string): void {
    const error = this.get(errorId)
    if (error) {
      const updatedError: ErrorInfo = { ...error, resolved: true }
      this.set(errorId, updatedError)
      this.emit('resolved', updatedError)
    }
  }
  
  public getUnresolvedErrors(): ErrorInfo[] {
    return Array.from(this.data.values()).filter((error: ErrorInfo) => !error.resolved)
  }
  
  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const errorService = ErrorService.getInstance()
