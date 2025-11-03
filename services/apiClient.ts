// API Service Layer for Frontend-Backend Integration
import type {
  ApiResponse,
  User,
  AuthTokens,
  PaginationInfo,
  Project,
  IngestionJob,
  ReconciliationRecord,
} from '../types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:2000';

// API Client Class
class ApiClient {
  baseURL: string;
  accessToken: string | null = null;
  refreshToken: string | null = null;

  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadTokensFromStorage();
  }

  // Token Management
  loadTokensFromStorage() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  saveTokensToStorage(tokens: AuthTokens) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
    }
  }

  clearTokensFromStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  // HTTP Request Helper
  async makeRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle token refresh for 401 errors
        if (response.status === 401 && this.refreshToken) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry the original request
            return this.makeRequest<T>(endpoint, options);
          }
        }

        return {
          success: false,
          error: {
            code: 'REQUEST_FAILED',
            message: data.error?.message || 'Request failed',
            details: data.error?.details,
            field: data.error?.field,
            timestamp: new Date(),
          },
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
          timestamp: new Date(),
        },
      };
    }
  }

  // Authentication Methods
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.makeRequest<{ user: User; tokens: AuthTokens }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      this.saveTokensToStorage(response.data.tokens);
    }

    return response;
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.makeRequest<{ user: User; tokens: AuthTokens }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.saveTokensToStorage(response.data.tokens);
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.makeRequest('/auth/logout', {
      method: 'POST',
    });

    this.clearTokensFromStorage();
    return response;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    const response = await this.makeRequest<{ tokens: AuthTokens }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (response.success && response.data) {
      this.saveTokensToStorage(response.data.tokens);
      return true;
    }

    this.clearTokensFromStorage();
    return false;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.makeRequest<{ user: User }>('/auth/me');
  }

  // Project Methods
  async getProjects(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{ projects: Project[]; pagination: PaginationInfo }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = queryParams.toString() ? `/projects?${queryParams.toString()}` : '/projects';

    return this.makeRequest<{ projects: Project[]; pagination: PaginationInfo }>(endpoint);
  }

  async getProject(id: string): Promise<ApiResponse<{ project: Project & { stats: any } }>> {
    return this.makeRequest<{ project: Project & { stats: any } }>(`/projects/${id}`);
  }

  async createProject(projectData: {
    name: string;
    description?: string;
    settings?: any;
  }): Promise<ApiResponse<{ project: Project }>> {
    return this.makeRequest<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(
    id: string,
    updates: Partial<Project>
  ): Promise<ApiResponse<{ project: Project }>> {
    return this.makeRequest<{ project: Project }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getProjectAnalytics(
    id: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<
    ApiResponse<{
      stats: any;
      dailyStats: any[];
      ingestionStats: any;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = queryParams.toString()
      ? `/projects/${id}/analytics?${queryParams.toString()}`
      : `/projects/${id}/analytics`;

    return this.makeRequest<{
      stats: any;
      dailyStats: any[];
      ingestionStats: any;
    }>(endpoint);
  }

  // Ingestion Methods
  async uploadFile(
    file: File,
    projectId: string,
    dataSourceId?: string
  ): Promise<ApiResponse<{ job: IngestionJob }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    if (dataSourceId) {
      formData.append('dataSourceId', dataSourceId);
    }

    const url = `${this.baseURL}/ingestion/upload`;
    const headers: Record<string, string> = {};

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'UPLOAD_FAILED',
            message: data.error?.message || 'Upload failed',
            timestamp: new Date(),
          },
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Upload failed',
          timestamp: new Date(),
        },
      };
    }
  }

  async processData(
    jobId: string,
    options?: any
  ): Promise<
    ApiResponse<{
      job: IngestionJob;
      records: ReconciliationRecord[];
    }>
  > {
    return this.makeRequest<{
      job: IngestionJob;
      records: ReconciliationRecord[];
    }>('/ingestion/process', {
      method: 'POST',
      body: JSON.stringify({ jobId, options }),
    });
  }

  async getIngestionJobs(params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: string;
  }): Promise<ApiResponse<{ jobs: IngestionJob[]; pagination: PaginationInfo }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = queryParams.toString()
      ? `/ingestion/jobs?${queryParams.toString()}`
      : '/ingestion/jobs';

    return this.makeRequest<{ jobs: IngestionJob[]; pagination: PaginationInfo }>(endpoint);
  }

  async getIngestionJob(id: string): Promise<ApiResponse<{ job: IngestionJob }>> {
    return this.makeRequest<{ job: IngestionJob }>(`/ingestion/jobs/${id}`);
  }

  // Health Check
  async healthCheck(): Promise<
    ApiResponse<{
      status: string;
      timestamp: string;
      uptime: number;
      version: string;
    }>
  > {
    const url = `${this.baseURL.replace('/api', '')}/health`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'HEALTH_CHECK_FAILED',
            message: 'Health check failed',
            timestamp: new Date(),
          },
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Health check failed',
          timestamp: new Date(),
        },
      };
    }
  }
}

// WebSocket Client
export class WebSocketClient {
  ws: WebSocket | null = null;
  url: string;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  reconnectTimeout: NodeJS.Timeout | null = null;
  eventHandlers = new Map<string, Function[]>();

  constructor(url = WS_URL) {
    this.url = url;
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = token ? `${this.url}?token=${token}` : this.url;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  private handleMessage(message: any) {
    const { type, data } = message;
    const handlers = this.eventHandlers.get(type) || [];
    handlers.forEach((handler) => handler(data));
  }

  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  on(eventType: string, handler: Function) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: Function) {
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
  }
}

// Create singleton instances
export const apiClient = new ApiClient();
export const wsClient = new WebSocketClient();
