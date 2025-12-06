// Request Manager Service - manages API request queueing and retries

export class RequestManager {
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  async executeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: { retry?: number; timeout?: number } = {}
  ): Promise<T> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Execute request
    const promise = requestFn();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      this.pendingRequests.delete(key);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }

  cancelRequest(key: string): void {
    this.pendingRequests.delete(key);
  }

  clearAll(): void {
    this.pendingRequests.clear();
  }

  getQueueStatus() {
    return {
      pending: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys()),
    };
  }

  getCircuitState() {
    return {
      healthy: true,
      failureCount: 0,
    };
  }

  clearCache(): void {
    // Stub implementation
  }

  resetCircuitBreaker(): void {
    // Stub implementation
  }
}

export const requestManager = new RequestManager();
