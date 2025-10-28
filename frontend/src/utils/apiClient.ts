// API Client with Retry Logic
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// Retry configuration
interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private retryConfig: Required<RetryConfig>;

  constructor(baseURL: string, retryConfig: RetryConfig = {}) {
    this.retryConfig = {
      maxRetries: retryConfig.maxRetries || 3,
      baseDelay: retryConfig.baseDelay || 1000,
      maxDelay: retryConfig.maxDelay || 10000,
    };

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add retry interceptor
    this.setupRetryInterceptor();
  }

  private setupRetryInterceptor() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;

        // Don't retry if already retried max times
        if (config._retryCount >= this.retryConfig.maxRetries) {
          return Promise.reject(error);
        }

        // Don't retry on 4xx errors (except network errors)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          return Promise.reject(error);
        }

        // Increment retry count
        config._retryCount = (config._retryCount || 0) + 1;

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, config._retryCount - 1),
          this.retryConfig.maxDelay
        );

        console.warn(`Request failed, retrying in ${delay}ms (attempt ${config._retryCount}/${this.retryConfig.maxRetries})`);

        // Wait before retrying
        await this.sleep(delay);

        // Retry the request
        return this.client(config);
      }
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }
}

export default ApiClient;

