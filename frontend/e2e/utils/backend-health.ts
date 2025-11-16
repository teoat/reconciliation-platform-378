/**
 * Backend Health Check Utility for E2E Tests
 * Provides utilities to check if backend is running and handle graceful degradation
 */

export interface BackendHealthStatus {
  isRunning: boolean;
  url: string;
  responseTime?: number;
  error?: string;
}

/**
 * Check if backend API is running and healthy
 */
export async function checkBackendHealth(
  baseUrl: string = 'http://localhost:2000',
  timeout: number = 5000
): Promise<BackendHealthStatus> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        isRunning: true,
        url: baseUrl,
        responseTime,
      };
    } else {
      return {
        isRunning: false,
        url: baseUrl,
        responseTime,
        error: `Backend returned status ${response.status}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      isRunning: false,
      url: baseUrl,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Wait for backend to be available with retries
 */
export async function waitForBackend(
  baseUrl: string = 'http://localhost:2000',
  maxRetries: number = 10,
  retryDelay: number = 1000
): Promise<BackendHealthStatus> {
  for (let i = 0; i < maxRetries; i++) {
    const status = await checkBackendHealth(baseUrl);
    if (status.isRunning) {
      return status;
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return await checkBackendHealth(baseUrl);
}

/**
 * Skip test if backend is not available
 * Use in test.beforeEach or test.beforeAll
 */
export function skipIfBackendUnavailable(status: BackendHealthStatus) {
  if (!status.isRunning) {
    test.skip();
  }
}

/**
 * Log backend status for debugging
 */
export function logBackendStatus(status: BackendHealthStatus): void {
  if (status.isRunning) {
    console.log(`✅ Backend is running at ${status.url} (${status.responseTime}ms)`);
  } else {
    console.warn(`⚠️  Backend is not available at ${status.url}: ${status.error}`);
    console.warn('   Tests will run with graceful degradation (mocked responses)');
  }
}

