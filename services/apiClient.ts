// API Client - Stub implementation for the root Next.js app
// This provides a minimal API interface for compatibility

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'draft' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface IngestionJob {
  id: string;
  projectId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  fileSize: number;
  recordCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface ReconciliationRecord {
  id: string;
  projectId: string;
  sourceId: string;
  targetId?: string;
  status: 'matched' | 'unmatched' | 'discrepancy';
  matchScore?: number;
  data: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const result = await this.fetch<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.success && result.data?.token) {
      this.setToken(result.data.token);
    }
    return result;
  }

  async register(email: string, password: string, name: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async logout(): Promise<void> {
    this.setToken(null);
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.fetch('/auth/me');
  }

  // Project endpoints
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.fetch('/projects');
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.fetch(`/projects/${id}`);
  }

  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Project>> {
    return this.fetch('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<ApiResponse<Project>> {
    return this.fetch(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.fetch(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Ingestion endpoints
  async getIngestionJobs(projectId: string): Promise<ApiResponse<IngestionJob[]>> {
    return this.fetch(`/projects/${projectId}/ingestion-jobs`);
  }

  async createIngestionJob(projectId: string, file: File): Promise<ApiResponse<IngestionJob>> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };

    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectId}/ingestion-jobs`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      return { success: response.ok, data: data.data || data, error: data.error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  // Reconciliation endpoints
  async getReconciliationRecords(projectId: string): Promise<ApiResponse<ReconciliationRecord[]>> {
    return this.fetch(`/projects/${projectId}/reconciliation`);
  }

  async updateReconciliationRecord(
    projectId: string,
    recordId: string,
    data: Partial<ReconciliationRecord>
  ): Promise<ApiResponse<ReconciliationRecord>> {
    return this.fetch(`/projects/${projectId}/reconciliation/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string = 'ws://localhost:3001/ws') {
    this.url = url;
  }

  connect(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const listeners = this.listeners.get(message.type);
          if (listeners) {
            listeners.forEach((callback) => callback(message.data));
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket', error);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(eventType: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  send(type: string, data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}

export const apiClient = new ApiClient();
export const wsClient = new WebSocketClient();
