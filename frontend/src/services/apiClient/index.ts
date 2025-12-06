// ============================================================================
// API CLIENT - SINGLE SOURCE OF TRUTH FOR ALL API COMMUNICATION
// ============================================================================
// This is the centralized API client using axios
// All API calls should go through this client for consistent error handling,
// authentication, and request/response transformation

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type {
  ApiResponse,
  ApiError,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserResponse,
  FileUploadRequest,
  FileUploadResponse,
} from './types';

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_TIMEOUT = 30000; // 30 seconds

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // ============================================================================
  // INTERCEPTORS
  // ============================================================================

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          // Token refresh logic would go here
          // For now, just clear the token
          this.clearToken();
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  public setToken(token: string): void {
    this.accessToken = token;
    // Also store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  public clearToken(): void {
    this.accessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  public getToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  // ============================================================================
  // ERROR NORMALIZATION
  // ============================================================================

  private normalizeError(error: AxiosError): ApiError {
    const responseData = error.response?.data as { message?: string; code?: string } | undefined;
    
    return {
      message: responseData?.message || error.message || 'An unexpected error occurred',
      code: responseData?.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 500,
      details: responseData as Record<string, unknown>,
    };
  }

  // ============================================================================
  // GENERIC HTTP METHODS
  // ============================================================================

  public async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, {
        params,
        ...config,
      });
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const apiError = this.normalizeError(error as AxiosError);
      return {
        data: {} as T,
        error: apiError,
        status: apiError.status || 500,
      };
    }
  }

  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const apiError = this.normalizeError(error as AxiosError);
      return {
        data: {} as T,
        error: apiError,
        status: apiError.status || 500,
      };
    }
  }

  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const apiError = this.normalizeError(error as AxiosError);
      return {
        data: {} as T,
        error: apiError,
        status: apiError.status || 500,
      };
    }
  }

  public async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const apiError = this.normalizeError(error as AxiosError);
      return {
        data: {} as T,
        error: apiError,
        status: apiError.status || 500,
      };
    }
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  public async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/login', credentials);
    if (response.data?.accessToken) {
      this.setToken(response.data.accessToken);
    }
    return response;
  }

  public async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/register', userData);
    if (response.data?.accessToken) {
      this.setToken(response.data.accessToken);
    }
    return response;
  }

  public async logout(): Promise<ApiResponse<void>> {
    const response = await this.post<void>('/auth/logout');
    this.clearToken();
    return response;
  }

  public async getCurrentUser(): Promise<ApiResponse<UserResponse>> {
    return this.get<UserResponse>('/auth/me');
  }

  public async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/refresh', { refreshToken });
    if (response.data?.accessToken) {
      this.setToken(response.data.accessToken);
    }
    return response;
  }

  // ============================================================================
  // FILE UPLOAD
  // ============================================================================

  public async uploadFile(
    projectId: string,
    file: File,
    metadata: FileUploadRequest
  ): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    return this.post<FileUploadResponse>(`/projects/${projectId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  public async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.get<{ status: string }>('/health');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const apiClient = new ApiClient();
export default apiClient;
