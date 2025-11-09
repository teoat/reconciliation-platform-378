// ============================================================================
// UNIFIED API CLIENT - BACKEND INTEGRATION
// ============================================================================

import {
   UserResponse, ProjectResponse, ProjectListResponse,
   DashboardData, ProjectStats, UserActivityStats, ReconciliationStats,
   AuthResponse,
   ErrorResponse, ApiError,
   FileInfo, ReconciliationResultDetail, ReconciliationJob
 } from '../types/backend-aligned'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws'

// ============================================================================
// BACKEND RESPONSE TYPES
// ============================================================================

// Re-export types from backend-aligned for consistency
export type BackendUser = UserResponse
export type BackendProject = ProjectResponse
export type BackendDataSource = FileInfo
export type BackendReconciliationRecord = ReconciliationResultDetail
export type BackendReconciliationMatch = ReconciliationResultDetail
export type BackendReconciliationJob = ReconciliationJob

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: BackendUser
  expires_at: number
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
  settings?: any
  status?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  settings?: any
  status?: string
  is_active?: boolean
}

export interface CreateUserRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: string
}

export interface UpdateUserRequest {
  email?: string
  first_name?: string
  last_name?: string
  role?: string
  is_active?: boolean
}

export interface FileUploadRequest {
  project_id: string
  name: string
  source_type: string
}

export interface FileUploadResponse {
  id: string
  name: string
  source_type: string
  file_size: number
  record_count?: number
  status: string
  uploaded_at?: string
  processed_at?: string
}

export interface ApiResponse<T = any> {
   success?: boolean
   data?: T
   message?: string
   error?: {
     message: string
     statusCode: number
     code?: string
     details?: any
     timestamp: string
     path: string
     method: string
   }
 }

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class ApiClientError extends Error implements ApiError {
  statusCode?: number
  code?: string
  details?: any
  response?: ErrorResponse

  constructor(message: string, statusCode?: number, code?: string, details?: any, response?: ErrorResponse) {
    super(message)
    this.name = 'ApiClientError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.response = response
  }
}

// ============================================================================
// UNIFIED API CLIENT CLASS
// ============================================================================

class UnifiedApiClient {
  private baseURL: string
  private accessToken: string | null = null
  private abortController: AbortController | null = null
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.loadTokenFromStorage()
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  private loadTokenFromStorage() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('authToken')
    }
  }

  public setAuthToken(token: string) {
    this.accessToken = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
    }
  }

  public clearAuthToken() {
    this.accessToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  setCache(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  // ============================================================================
  // MAIN REQUEST METHOD
  // ============================================================================

  async makeRequest<T>(
     endpoint: string,
     options: RequestInit & { timeout?: number; skipAuth?: boolean; params?: Record<string, any> } = {}
   ): Promise<ApiResponse<T>> {
     const { timeout = 30000, skipAuth = false, params, ...requestOptions } = options

     let url = `${this.baseURL}${endpoint}`
     if (params) {
       const searchParams = new URLSearchParams()
       Object.entries(params).forEach(([key, value]) => {
         if (value !== undefined && value !== null) {
           searchParams.append(key, String(value))
         }
       })
       const paramString = searchParams.toString()
       if (paramString) {
         url += `?${paramString}`
       }
     }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(requestOptions.headers as Record<string, string>),
    }

    if (!skipAuth && this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    try {
      // Cancel previous request if exists
      if (this.abortController) {
        this.abortController.abort()
      }
      this.abortController = new AbortController()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...requestOptions,
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        // Handle token refresh for 401 errors
        if (response.status === 401 && this.accessToken) {
          this.clearAuthToken()
          window.location.href = '/login'
        }
        
        // Parse backend error response
        let errorResponse: ErrorResponse | undefined
        try {
          errorResponse = data as ErrorResponse
        } catch {
          // If parsing fails, create a generic error response
          errorResponse = {
            error: 'Request failed',
            message: data.message || 'An error occurred',
            code: response.status.toString()
          }
        }
        
        const apiError = new ApiClientError(
          errorResponse.message,
          response.status,
          errorResponse.code,
          data.details,
          errorResponse
        )
        
        throw apiError
      }

      return { data }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request was cancelled')
      }
      
      const apiError: ApiError = error instanceof Error ? error as ApiError : new Error('Network error') as ApiError
      apiError.statusCode = 0
      
      throw apiError
    }
  }

  // ============================================================================
  // CACHED REQUEST METHOD
  // ============================================================================

  async cachedRequest<T>(
    endpoint: string,
    options: RequestInit & { timeout?: number; skipAuth?: boolean } = {},
    cacheKey?: string,
    ttl: number = 300000
  ): Promise<ApiResponse<T>> {
    const key = cacheKey || endpoint
    const cached = this.getCache(key)
    
    if (cached) {
      return { data: cached }
    }

    const response = await this.makeRequest<T>(endpoint, options)
    if (response.data) {
      this.setCache(key, response.data, ttl)
    }

    return response
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  cancelAllRequests() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      skipAuth: true
    })

    if (response.data) {
      this.setAuthToken(response.data.token)
    }

    return response
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true
    })

    if (response.data) {
      this.setAuthToken(response.data.token)
    }

    return response
  }

  async logout(): Promise<ApiResponse> {
    try {
      await this.makeRequest('/auth/logout', {
      method: 'POST',
      })
    } finally {
      this.clearAuthToken()
    }
    return { data: null }
  }

  async getCurrentUser(): Promise<ApiResponse<UserResponse>> {
    return this.makeRequest<UserResponse>('/auth/me')
  }

  async refreshToken(): Promise<ApiResponse<{ token: string; expires_at: number }>> {
    const response = await this.makeRequest<{ token: string; expires_at: number }>('/auth/refresh', {
        method: 'POST',
      skipAuth: true
    })

    if (response.data) {
      this.setAuthToken(response.data.token)
    }

    return response
  }

  // ============================================================================
  // USER MANAGEMENT METHODS
  // ============================================================================

  async getUsers(page: number = 1, perPage: number = 20): Promise<ApiResponse<PaginatedResponse<BackendUser>>> {
    return this.makeRequest<PaginatedResponse<BackendUser>>('/users', {
      params: { page, per_page: perPage }
    })
  }

  async getUserById(userId: string): Promise<ApiResponse<BackendUser>> {
    return this.makeRequest<BackendUser>(`/users/${userId}`)
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<BackendUser>> {
    return this.makeRequest<BackendUser>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<ApiResponse<BackendUser>> {
    return this.makeRequest<BackendUser>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.makeRequest(`/users/${userId}`, {
      method: 'DELETE',
    })
  }

  async searchUsers(query: string, page: number = 1, perPage: number = 20): Promise<ApiResponse<PaginatedResponse<BackendUser>>> {
    return this.makeRequest<PaginatedResponse<BackendUser>>('/users/search', {
      params: { q: query, page, per_page: perPage }
    })
  }

  // ============================================================================
  // PROJECT MANAGEMENT METHODS
  // ============================================================================

  async getProjects(page: number = 1, perPage: number = 20): Promise<ApiResponse<ProjectListResponse>> {
    return this.makeRequest<ProjectListResponse>('/projects', {
      params: { page, per_page: perPage }
    })
  }

  async getProjectById(projectId: string): Promise<ApiResponse<ProjectResponse>> {
    return this.makeRequest<ProjectResponse>(`/projects/${projectId}`)
  }

  async createProject(projectData: CreateProjectRequest): Promise<ApiResponse<ProjectResponse>> {
    return this.makeRequest<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    })
  }

  async updateProject(projectId: string, projectData: UpdateProjectRequest): Promise<ApiResponse<ProjectResponse>> {
    return this.makeRequest<ProjectResponse>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    })
  }

  async deleteProject(projectId: string): Promise<ApiResponse> {
    return this.makeRequest(`/projects/${projectId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // DATA SOURCE METHODS
  // ============================================================================

  async getDataSources(projectId: string): Promise<ApiResponse<BackendDataSource[]>> {
    return this.makeRequest<BackendDataSource[]>(`/projects/${projectId}/data-sources`)
  }

  async getDataSourceById(projectId: string, dataSourceId: string): Promise<ApiResponse<BackendDataSource>> {
    return this.makeRequest<BackendDataSource>(`/projects/${projectId}/data-sources/${dataSourceId}`)
  }

  async uploadFile(projectId: string, file: File, request: FileUploadRequest): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('project_id', projectId)
    formData.append('name', request.name)
    formData.append('source_type', request.source_type)

    const url = `${this.baseURL}/projects/${projectId}/data-sources/upload`
    const headers: HeadersInit = {}

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: {
            message: data.message || 'Upload failed',
            statusCode: response.status,
            timestamp: new Date().toISOString(),
            path: `/projects/${projectId}/data-sources/upload`,
            method: 'POST',
          },
        }
      }

      return { data }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Upload failed',
          statusCode: 0,
          timestamp: new Date().toISOString(),
          path: `/projects/${projectId}/data-sources/upload`,
          method: 'POST',
        },
      }
    }
  }

  async processFile(projectId: string, dataSourceId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/projects/${projectId}/data-sources/${dataSourceId}/process`, {
      method: 'POST',
    })
  }

  async deleteDataSource(projectId: string, dataSourceId: string): Promise<ApiResponse> {
    return this.makeRequest(`/projects/${projectId}/data-sources/${dataSourceId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // RECONCILIATION METHODS
  // ============================================================================

  async getReconciliationRecords(projectId: string, page: number = 1, perPage: number = 20): Promise<ApiResponse<PaginatedResponse<BackendReconciliationRecord>>> {
    return this.makeRequest<PaginatedResponse<BackendReconciliationRecord>>(
      `/projects/${projectId}/reconciliation-records`,
      { params: { page, per_page: perPage } }
    )
  }

  async getReconciliationRecordById(projectId: string, recordId: string): Promise<ApiResponse<BackendReconciliationRecord>> {
    return this.makeRequest<BackendReconciliationRecord>(
      `/projects/${projectId}/reconciliation-records/${recordId}`
    )
  }

  async getReconciliationMatches(projectId: string, page: number = 1, perPage: number = 20): Promise<ApiResponse<PaginatedResponse<BackendReconciliationMatch>>> {
    return this.makeRequest<PaginatedResponse<BackendReconciliationMatch>>(
      `/projects/${projectId}/reconciliation-matches`,
      { params: { page, per_page: perPage } }
    )
  }

  async createReconciliationMatch(projectId: string, matchData: Partial<BackendReconciliationMatch>): Promise<ApiResponse<BackendReconciliationMatch>> {
    return this.makeRequest<BackendReconciliationMatch>(
      `/projects/${projectId}/reconciliation-matches`,
      {
        method: 'POST',
        body: JSON.stringify(matchData),
      }
    )
  }

  async updateReconciliationMatch(projectId: string, matchId: string, matchData: Partial<BackendReconciliationMatch>): Promise<ApiResponse<BackendReconciliationMatch>> {
    return this.makeRequest<BackendReconciliationMatch>(
      `/projects/${projectId}/reconciliation-matches/${matchId}`,
      {
        method: 'PUT',
        body: JSON.stringify(matchData),
      }
    )
  }

  async deleteReconciliationMatch(projectId: string, matchId: string): Promise<ApiResponse> {
    return this.makeRequest(`/projects/${projectId}/reconciliation-matches/${matchId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // RECONCILIATION JOB METHODS
  // ============================================================================

  async getReconciliationJobs(projectId: string): Promise<ApiResponse<BackendReconciliationJob[]>> {
    return this.makeRequest<BackendReconciliationJob[]>(`/projects/${projectId}/reconciliation-jobs`)
  }

  async getReconciliationJobById(projectId: string, jobId: string): Promise<ApiResponse<BackendReconciliationJob>> {
    return this.makeRequest<BackendReconciliationJob>(`/projects/${projectId}/reconciliation-jobs/${jobId}`)
  }

  async createReconciliationJob(projectId: string, jobData: Partial<BackendReconciliationJob>): Promise<ApiResponse<BackendReconciliationJob>> {
    return this.makeRequest<BackendReconciliationJob>(
      `/projects/${projectId}/reconciliation-jobs`,
      {
        method: 'POST',
        body: JSON.stringify(jobData),
      }
    )
  }

  async updateReconciliationJob(projectId: string, jobId: string, jobData: Partial<BackendReconciliationJob>): Promise<ApiResponse<BackendReconciliationJob>> {
    return this.makeRequest<BackendReconciliationJob>(
      `/projects/${projectId}/reconciliation-jobs/${jobId}`,
      {
        method: 'PUT',
        body: JSON.stringify(jobData),
      }
    )
  }

  async startReconciliationJob(projectId: string, jobId: string): Promise<ApiResponse<BackendReconciliationJob>> {
    return this.makeRequest<BackendReconciliationJob>(
      `/projects/${projectId}/reconciliation-jobs/${jobId}/start`,
      { method: 'POST' }
    )
  }

  async stopReconciliationJob(projectId: string, jobId: string): Promise<ApiResponse<BackendReconciliationJob>> {
    return this.makeRequest<BackendReconciliationJob>(
      `/projects/${projectId}/reconciliation-jobs/${jobId}/stop`,
      { method: 'POST' }
    )
  }

  async deleteReconciliationJob(projectId: string, jobId: string): Promise<ApiResponse> {
    return this.makeRequest(`/projects/${projectId}/reconciliation-jobs/${jobId}`, {
      method: 'DELETE',
    })
  }

  // Additional reconciliation job methods
  async getReconciliationJobProgress(jobId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/reconciliation/jobs/${jobId}/progress`)
  }

  async getReconciliationJobResults(jobId: string, page: number = 1, perPage: number = 20, matchType?: string): Promise<ApiResponse<PaginatedResponse<any>>> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('per_page', perPage.toString())
    if (matchType) params.append('match_type', matchType)
    
    return this.makeRequest<PaginatedResponse<any>>(`/reconciliation/jobs/${jobId}/results?${params}`)
  }

  async getReconciliationJobStatistics(jobId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/reconciliation/jobs/${jobId}/statistics`)
  }

  async getActiveReconciliationJobs(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/reconciliation/jobs/active')
  }

  async getQueuedReconciliationJobs(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/reconciliation/jobs/queued')
  }

  async cancelReconciliationJob(jobId: string): Promise<ApiResponse> {
    return this.makeRequest(`/reconciliation/jobs/${jobId}/stop`, {
      method: 'POST',
    })
  }

  // ============================================================================
  // ANALYTICS METHODS
  // ============================================================================

  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    return this.makeRequest<DashboardData>('/analytics/dashboard')
  }

  async getProjectStats(projectId: string): Promise<ApiResponse<ProjectStats>> {
    return this.makeRequest<ProjectStats>(`/analytics/projects/${projectId}/stats`)
  }

  async getUserActivity(userId: string): Promise<ApiResponse<UserActivityStats>> {
    return this.makeRequest<UserActivityStats>(`/analytics/users/${userId}/activity`)
  }

  async getReconciliationStats(): Promise<ApiResponse<ReconciliationStats>> {
    return this.makeRequest<ReconciliationStats>('/analytics/reconciliation/stats')
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health', {
      skipAuth: true,
    })
  }
}

// ============================================================================
// WEBSOCKET CLIENT
// ============================================================================

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private eventHandlers: Map<string, Function[]> = new Map()

  constructor(url: string = WS_URL) {
    this.url = url
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = token ? `${this.url}?token=${token}` : this.url
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect()
      }, delay)
    }
  }

  private handleMessage(message: any) {
    const { type, data } = message
    const handlers = this.eventHandlers.get(type) || []
    handlers.forEach(handler => handler(data))
  }

  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    }
  }

  on(eventType: string, handler: Function) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler)
  }

  off(eventType: string, handler: Function) {
    const handlers = this.eventHandlers.get(eventType) || []
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
    }
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const apiClient = new UnifiedApiClient()
export const wsClient = new WebSocketClient()

// Legacy compatibility exports
export const ApiClient = UnifiedApiClient
export default apiClient