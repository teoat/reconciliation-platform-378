/**
 * API Client (SSOT)
 *
 * Unified API client with Tier 4 error handling integration.
 * Wraps Axios with automated retries, error categorization, and pattern detection.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { APP_CONFIG } from '@/config/AppConfig';
import { withTier4ErrorHandling } from '@/utils/tier4Helpers';
import { tier4ErrorHandler } from '@/services/tier4ErrorHandler';
import { logger } from '@/services/logger';

// Types
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  success?: boolean;
}

// Create base instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.API_URL,
  timeout: APP_CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Auth Token Injection
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(APP_CONFIG.AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Basic Error Transformation
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // We let the Tier 4 wrapper handle the recording, but we might want to do
    // immediate token refresh logic here if needed.
    if (error.response?.status === 401) {
        // Potential future: Trigger token refresh flow
        // For now, we propagate so Tier 4 can categorize it as AUTHENTICATION error
    }
    return Promise.reject(error);
  }
);

/**
 * Base API Methods wrapped with Tier 4 Error Handling
 *
 * These methods automatically:
 * 1. Retry on transient errors (Network, 503, etc.)
 * 2. Record errors to the Tier 4 system for pattern detection
 * 3. Provide correlation IDs for tracing
 */

const get = withTier4ErrorHandling(
  async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.get(url, config);
    return response.data;
  },
  {
    componentName: 'ApiClient_GET',
    enableRetry: true,
    maxRetries: APP_CONFIG.API_RETRY_ATTEMPTS,
  }
);

const post = withTier4ErrorHandling(
  async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.post(url, data, config);
    return response.data;
  },
  {
    componentName: 'ApiClient_POST',
    enableRetry: true, // Post requests should be idempotent or carefully retried.
                       // Tier 4 logic handles safe retries mostly on network errors.
    maxRetries: APP_CONFIG.API_RETRY_ATTEMPTS,
  }
);

const put = withTier4ErrorHandling(
  async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.put(url, data, config);
    return response.data;
  },
  {
    componentName: 'ApiClient_PUT',
    enableRetry: true,
    maxRetries: APP_CONFIG.API_RETRY_ATTEMPTS,
  }
);

const del = withTier4ErrorHandling(
  async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response: AxiosResponse<T> = await axiosInstance.delete(url, config);
    return response.data;
  },
  {
    componentName: 'ApiClient_DELETE',
    enableRetry: true,
    maxRetries: APP_CONFIG.API_RETRY_ATTEMPTS,
  }
);

// File Upload Helper (specific configuration)
const upload = withTier4ErrorHandling(
  async <T = any>(url: string, file: File, onProgress?: (percent: number) => void): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<T> = await axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
      timeout: 0, // No timeout for uploads
    });
    return response.data;
  },
  {
    componentName: 'ApiClient_UPLOAD',
    enableRetry: false, // Don't auto-retry large uploads
  }
);

/**
 * Orchestrated API Client
 */
export const apiClient = {
  get,
  post,
  put,
  delete: del,
  upload,
  // Expose instance for cases needing raw access (use sparingly)
  instance: axiosInstance,
};

// Also export a class-based version if legacy code expects it (UnifiedApiClient)
export class UnifiedApiClient {
  static getInstance() {
    return apiClient;
  }
}

export default apiClient;
