// API Client for making HTTP requests
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './logger';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || '/api',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        const token = localStorage.getItem('authToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        logger.error('Request error', { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Response error', { error });
        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  async uploadFile<T = unknown>(
    projectId: string,
    file: File,
    metadata?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    if (metadata) {
      const appendValue = (key: string, val: unknown) => {
        if (val === undefined || val === null) {
          return;
        }
        // Preserve File/Blob instances
        if (val instanceof File || val instanceof Blob) {
          formData.append(key, val);
          return;
        }
        // Dates as ISO strings
        if (val instanceof Date) {
          formData.append(key, val.toISOString());
          return;
        }
        // Arrays: append each entry with bracket notation
        if (Array.isArray(val)) {
          val.forEach((item, idx) => {
            const itemKey = `${key}[${idx}]`;
            appendValue(itemKey, item);
          });
          return;
        }
        // Plain objects: JSON stringify with safety
        if (typeof val === 'object') {
          try {
            const json = JSON.stringify(val, (_k, v) => (v instanceof Date ? v.toISOString() : v));
            formData.append(key, json);
          } catch {
            // Fallback to string to avoid throwing on circular refs
            formData.append(key, String(val));
          }
          return;
        }
        // Primitives
        formData.append(key, String(val));
      };

      Object.keys(metadata).forEach((k) => appendValue(k, metadata[k]));
    }
    return this.client.post<T>('/upload', formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  }

  async login<T = unknown>(credentials: { email: string; password: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>('/auth/login', credentials, config);
  }

  async register<T = unknown>(data: { email: string; password: string; name?: string }, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>('/auth/register', data, config);
  }

  async getCurrentUser<T = unknown>(config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>('/auth/me', config);
  }

  async logout<T = unknown>(config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>('/auth/logout', {}, config);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
