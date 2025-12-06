// ============================================================================
// API CLIENT - SINGLE SOURCE OF TRUTH FOR API COMMUNICATION
// ============================================================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import {
  ApiResponse,
  ApiError,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  FileUploadRequest,
  FileUploadResponse,
} from './types';

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_API_URL || 'http://localhost:2000/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear auth and redirect to login
          this.clearAuthToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const authTokens = localStorage.getItem('authTokens');
      if (authTokens) {
        const parsed = JSON.parse(authTokens);
        return parsed.accessToken || parsed.token || null;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    return null;
  }

  private setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    try {
      const authTokens = {
        accessToken: token,
        token: token,
      };
      localStorage.setItem('authTokens', JSON.stringify(authTokens));
    } catch (error) {
      console.error('Failed to set auth token:', error);
    }
  }

  private clearAuthToken(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('authTokens');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      return {
        message: axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.message || 'An error occurred',
        code: axiosError.code,
        status: axiosError.response?.status,
        details: axiosError.response?.data as Record<string, unknown>,
      };
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }

    return {
      message: 'An unexpected error occurred',
    };
  }

  // ============================================================================
  // HTTP METHODS
  // ============================================================================

  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const config: AxiosRequestConfig = {};
      if (params) {
        config.params = params;
      }
      
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const apiError = this.handleError(error);
      return {
        data: null as T,
        error: apiError.message,
        status: apiError.status,
      };
    }
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const apiError = this.handleError(error);
      return {
        data: null as T,
        error: apiError.message,
        status: apiError.status,
      };
    }
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const apiError = this.handleError(error);
      return {
        data: null as T,
        error: apiError.message,
        status: apiError.status,
      };
    }
  }

  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url);
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const apiError = this.handleError(error);
      return {
        data: null as T,
        error: apiError.message,
        status: apiError.status,
      };
    }
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/login', credentials);
    
    if (response.data && !response.error) {
      this.setAuthToken(response.data.token);
    }
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/register', userData);
    
    if (response.data && !response.error) {
      this.setAuthToken(response.data.token);
    }
    
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<AuthResponse['user']>> {
    return this.get<AuthResponse['user']>('/auth/me');
  }

  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    const response = await this.post<{ success: boolean }>('/auth/logout');
    
    if (response.data && !response.error) {
      this.clearAuthToken();
    }
    
    return response;
  }

  // ============================================================================
  // FILE UPLOAD METHODS
  // ============================================================================

  async uploadFile(
    projectId: string,
    file: File,
    metadata: FileUploadRequest
  ): Promise<ApiResponse<FileUploadResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);
      formData.append('name', metadata.name);
      formData.append('source_type', metadata.source_type);
      
      if (metadata.description) {
        formData.append('description', metadata.description);
      }
      
      if (metadata.metadata) {
        formData.append('metadata', JSON.stringify(metadata.metadata));
      }

      const response: AxiosResponse<FileUploadResponse> = await this.client.post(
        `/projects/${projectId}/files/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const apiError = this.handleError(error);
      return {
        data: null as FileUploadResponse,
        error: apiError.message,
        status: apiError.status,
      };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const apiClient = new ApiClient();
export default apiClient;
