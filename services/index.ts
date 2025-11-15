// ============================================================================
// CENTRALIZED SERVICES - SINGLE SOURCE OF TRUTH
// ============================================================================

import { 
  HTTP_STATUS, 
  API_TIMEOUT, 
  API_RETRY_ATTEMPTS,
  ERROR_CODES,
  SUCCESS_CODES
} from './constants'
import { retry, timeout, createError, createSuccess } from './utils'

// ============================================================================
// API SERVICE
// ============================================================================

// Import ApiResponse from types to avoid duplication
import { ApiResponse } from '../types'

export interface ApiRequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  baseURL?: string
  headers?: Record<string, string>
}

class ApiService {
  private baseURL: string
  private defaultTimeout: number
  private defaultRetries: number
  private defaultHeaders: Record<string, string>

  constructor(
    baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000/api',
    defaultTimeout: number = API_TIMEOUT,
    defaultRetries: number = API_RETRY_ATTEMPTS
  ) {
    this.baseURL = baseURL
    this.defaultTimeout = defaultTimeout
    this.defaultRetries = defaultRetries
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout: requestTimeout = this.defaultTimeout,
      retries = this.defaultRetries,
      baseURL = this.baseURL,
      headers = {},
      ...fetchOptions
    } = options

    const url = `${baseURL}${endpoint}`
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers
    }

    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers: requestHeaders
    }

    try {
      const response = await retry(
        () => timeout(fetch(url, requestOptions), requestTimeout),
        retries
      )

      if (!response.ok) {
        throw createError(
          `HTTP ${response.status}: ${response.statusText}`,
          this.getErrorCode(response.status)
        )
      }

      const data = await response.json()
      return {
        success: true,
        data,
        metadata: {
          timestamp: new Date(),
          requestId: response.headers.get('X-Request-ID') || '',
          version: response.headers.get('X-API-Version') || '1.0.0'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: this.getErrorCode(error),
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined,
          timestamp: new Date()
        }
      }
    }
  }

  private getErrorCode(error: any): string {
    if (error?.status) {
      switch (error.status) {
        case HTTP_STATUS.BAD_REQUEST:
          return ERROR_CODES.VALIDATION_ERROR
        case HTTP_STATUS.UNAUTHORIZED:
          return ERROR_CODES.AUTHENTICATION_ERROR
        case HTTP_STATUS.FORBIDDEN:
          return ERROR_CODES.AUTHORIZATION_ERROR
        case HTTP_STATUS.NOT_FOUND:
          return ERROR_CODES.NOT_FOUND_ERROR
        case HTTP_STATUS.CONFLICT:
          return ERROR_CODES.CONFLICT_ERROR
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          return ERROR_CODES.SERVER_ERROR
        default:
          return ERROR_CODES.UNKNOWN_ERROR
      }
    }
    return ERROR_CODES.UNKNOWN_ERROR
  }

  async get<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' })
  }

  async upload<T>(endpoint: string, file: File, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        ...options.headers
        // Let browser set multipart/form-data automatically
      }
    })
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization']
  }

  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL
  }
}

export const apiService = new ApiService()

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

export interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  preferences: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresAt: Date
}

class AuthService {
  private tokenKey = 'auth_token'
  private refreshTokenKey = 'refresh_token'
  private userKey = 'user_data'

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials)
    
    if (response.success && response.data) {
      this.setTokens(response.data.token, response.data.refreshToken)
      this.setUser(response.data.user)
    }
    
    return response
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>('/auth/register', data)
    
    if (response.success && response.data) {
      this.setTokens(response.data.token, response.data.refreshToken)
      this.setUser(response.data.user)
    }
    
    return response
  }

  async logout(): Promise<ApiResponse> {
    const response = await apiService.post('/auth/logout')
    this.clearAuth()
    return response
  }

  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'No refresh token available',
          timestamp: new Date()
        }
      }
    }

    const response = await apiService.post<AuthResponse>('/auth/refresh', {
      refreshToken
    })
    
    if (response.success && response.data) {
      this.setTokens(response.data.token, response.data.refreshToken)
      this.setUser(response.data.user)
    }
    
    return response
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return apiService.post('/auth/forgot-password', { email })
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return apiService.post('/auth/reset-password', { token, password })
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    return apiService.post('/auth/verify-email', { token })
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiService.put('/auth/profile', data)
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return apiService.post('/auth/change-password', {
      currentPassword,
      newPassword
    })
  }

  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp > Date.now() / 1000
    } catch {
      return false
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey)
  }

  getUser(): User | null {
    const userData = localStorage.getItem(this.userKey)
    return userData ? JSON.parse(userData) : null
  }

  private setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.tokenKey, token)
    localStorage.setItem(this.refreshTokenKey, refreshToken)
    apiService.setAuthToken(token)
  }

  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user))
  }

  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.refreshTokenKey)
    localStorage.removeItem(this.userKey)
    apiService.removeAuthToken()
  }
}

export const authService = new AuthService()

// ============================================================================
// PROJECT SERVICE
// ============================================================================

export interface Project {
  id: string
  name: string
  description: string
  status: string
  type: string
  owner: User
  team: ProjectMember[]
  settings: ProjectSettings
  data: ProjectData
  analytics: ProjectAnalytics
  createdAt: Date
  updatedAt: Date
}

export interface ProjectMember {
  user: User
  role: string
  permissions: string[]
  joinedAt: Date
}

export interface ProjectSettings {
  dataRetention: number
  autoMatching: boolean
  notificationSettings: Record<string, any>
  integrationSettings: Record<string, any>
  securitySettings: Record<string, any>
}

export interface ProjectData {
  ingestion: Record<string, any>
  reconciliation: Record<string, any>
  adjudication: Record<string, any>
  visualization: Record<string, any>
}

export interface ProjectAnalytics {
  performance: Record<string, any>
  quality: Record<string, any>
  trends: Record<string, any>
  insights: Record<string, any>[]
}

export interface ProjectFilters {
  status?: string[]
  type?: string[]
  owner?: string[]
  createdAfter?: Date
  createdBefore?: Date
  search?: string
}

export interface ProjectSort {
  field: string
  direction: 'asc' | 'desc'
}

export interface ProjectPagination {
  page: number
  limit: number
}

class ProjectService {
  async getProjects(
    filters?: ProjectFilters,
    sort?: ProjectSort,
    pagination?: ProjectPagination
  ): Promise<ApiResponse<Project[]>> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)))
          } else {
            params.append(key, String(value))
          }
        }
      })
    }
    
    if (sort) {
      params.append('sort', `${sort.field}:${sort.direction}`)
    }
    
    if (pagination) {
      params.append('page', String(pagination.page))
      params.append('limit', String(pagination.limit))
    }
    
    return apiService.get<Project[]>(`/projects?${params.toString()}`)
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return apiService.get<Project>(`/projects/${id}`)
  }

  async createProject(data: Partial<Project>): Promise<ApiResponse<Project>> {
    return apiService.post<Project>('/projects', data)
  }

  async updateProject(id: string, data: Partial<Project>): Promise<ApiResponse<Project>> {
    return apiService.put<Project>(`/projects/${id}`, data)
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    return apiService.delete(`/projects/${id}`)
  }

  async getProjectMembers(id: string): Promise<ApiResponse<ProjectMember[]>> {
    return apiService.get<ProjectMember[]>(`/projects/${id}/members`)
  }

  async addProjectMember(id: string, userId: string, role: string): Promise<ApiResponse<ProjectMember>> {
    return apiService.post<ProjectMember>(`/projects/${id}/members`, { userId, role })
  }

  async removeProjectMember(id: string, userId: string): Promise<ApiResponse> {
    return apiService.delete(`/projects/${id}/members/${userId}`)
  }

  async updateProjectMember(id: string, userId: string, role: string): Promise<ApiResponse<ProjectMember>> {
    return apiService.put<ProjectMember>(`/projects/${id}/members/${userId}`, { role })
  }

  async getProjectSettings(id: string): Promise<ApiResponse<ProjectSettings>> {
    return apiService.get<ProjectSettings>(`/projects/${id}/settings`)
  }

  async updateProjectSettings(id: string, settings: Partial<ProjectSettings>): Promise<ApiResponse<ProjectSettings>> {
    return apiService.put<ProjectSettings>(`/projects/${id}/settings`, settings)
  }

  async getProjectAnalytics(id: string): Promise<ApiResponse<ProjectAnalytics>> {
    return apiService.get<ProjectAnalytics>(`/projects/${id}/analytics`)
  }

  async getProjectTemplates(): Promise<ApiResponse<Project[]>> {
    return apiService.get<Project[]>('/projects/templates')
  }

  async duplicateProject(id: string, name: string): Promise<ApiResponse<Project>> {
    return apiService.post<Project>(`/projects/${id}/duplicate`, { name })
  }

  async archiveProject(id: string): Promise<ApiResponse> {
    return apiService.post(`/projects/${id}/archive`)
  }

  async restoreProject(id: string): Promise<ApiResponse> {
    return apiService.post(`/projects/${id}/restore`)
  }
}

export const projectService = new ProjectService()

// ============================================================================
// DATA INGESTION SERVICE
// ============================================================================

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: string
  uploadedAt: Date
  processedAt?: Date
  error?: string
  metadata: Record<string, any>
}

export interface ProcessedData {
  id: string
  fileId: string
  data: Record<string, any>[]
  quality: Record<string, any>
  validation: Record<string, any>[]
  createdAt: Date
}

export interface DataQualityMetrics {
  completeness: number
  accuracy: number
  consistency: number
  validity: number
  duplicates: number
  errors: number
}

export interface ValidationResult {
  id: string
  type: string
  field: string
  status: string
  message: string
  severity: string
  suggestions: string[]
}

class DataIngestionService {
  async uploadFile(file: File, projectId: string): Promise<ApiResponse<UploadedFile>> {
    return apiService.upload<UploadedFile>(`/ingestion/upload?projectId=${projectId}`, file)
  }

  async getFiles(projectId: string): Promise<ApiResponse<UploadedFile[]>> {
    return apiService.get<UploadedFile[]>(`/ingestion/files?projectId=${projectId}`)
  }

  async getFile(id: string): Promise<ApiResponse<UploadedFile>> {
    return apiService.get<UploadedFile>(`/ingestion/files/${id}`)
  }

  async deleteFile(id: string): Promise<ApiResponse> {
    return apiService.delete(`/ingestion/files/${id}`)
  }

  async processFile(id: string): Promise<ApiResponse<ProcessedData>> {
    return apiService.post<ProcessedData>(`/ingestion/process/${id}`)
  }

  async validateFile(id: string): Promise<ApiResponse<ValidationResult[]>> {
    return apiService.post<ValidationResult[]>(`/ingestion/validate/${id}`)
  }

  async getProcessingStatus(id: string): Promise<ApiResponse<{ status: string; progress: number }>> {
    return apiService.get<{ status: string; progress: number }>(`/ingestion/status/${id}`)
  }

  async getDataQualityMetrics(projectId: string): Promise<ApiResponse<DataQualityMetrics>> {
    return apiService.get<DataQualityMetrics>(`/ingestion/quality/${projectId}`)
  }

  async getProcessedData(projectId: string): Promise<ApiResponse<ProcessedData[]>> {
    return apiService.get<ProcessedData[]>(`/ingestion/processed/${projectId}`)
  }

  async exportProcessedData(projectId: string, format: string = 'csv'): Promise<ApiResponse<Blob>> {
    return apiService.get<Blob>(`/ingestion/export/${projectId}?format=${format}`, {
      headers: {
        'Accept': format === 'csv' ? 'text/csv' : 'application/json'
      }
    })
  }
}

export const dataIngestionService = new DataIngestionService()

// ============================================================================
// RECONCILIATION SERVICE
// ============================================================================

export interface ReconciliationRecord {
  id: string
  projectId: string
  status: string
  confidence: number
  matchScore: number
  sources: DataSource[]
  discrepancies: Discrepancy[]
  matchingRules: MatchingRule[]
  auditTrail: AuditEntry[]
  createdAt: Date
  updatedAt: Date
}

export interface DataSource {
  id: string
  type: string
  name: string
  data: Record<string, any>
  metadata: Record<string, any>
  quality: Record<string, any>
  createdAt: Date
}

export interface Discrepancy {
  id: string
  type: string
  field: string
  expectedValue: any
  actualValue: any
  severity: string
  description: string
  resolution?: Record<string, any>
}

export interface MatchingRule {
  id: string
  name: string
  type: string
  criteria: Record<string, any>[]
  weight: number
  applied: boolean
  result?: Record<string, any>
  confidence: number
}

// Import AuditEntry from types to avoid duplication
import { AuditEntry } from '../types'

export interface ReconciliationFilters {
  status?: string[]
  confidence?: { min: number; max: number }
  dateRange?: { start: Date; end: Date }
  sources?: string[]
  discrepancies?: string[]
  search?: string
}

export interface ReconciliationSort {
  field: string
  direction: 'asc' | 'desc'
}

export interface ReconciliationPagination {
  page: number
  limit: number
}

class ReconciliationService {
  async getRecords(
    projectId: string,
    filters?: ReconciliationFilters,
    sort?: ReconciliationSort,
    pagination?: ReconciliationPagination
  ): Promise<ApiResponse<ReconciliationRecord[]>> {
    const params = new URLSearchParams()
    params.append('projectId', projectId)
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)))
          } else if (typeof value === 'object') {
            Object.entries(value).forEach(([k, v]) => {
              params.append(`${key}.${k}`, String(v))
            })
          } else {
            params.append(key, String(value))
          }
        }
      })
    }
    
    if (sort) {
      params.append('sort', `${sort.field}:${sort.direction}`)
    }
    
    if (pagination) {
      params.append('page', String(pagination.page))
      params.append('limit', String(pagination.limit))
    }
    
    return apiService.get<ReconciliationRecord[]>(`/reconciliation/records?${params.toString()}`)
  }

  async getRecord(id: string): Promise<ApiResponse<ReconciliationRecord>> {
    return apiService.get<ReconciliationRecord>(`/reconciliation/records/${id}`)
  }

  async runMatching(projectId: string, rules?: MatchingRule[]): Promise<ApiResponse<{ matched: number; total: number }>> {
    return apiService.post<{ matched: number; total: number }>(`/reconciliation/match/${projectId}`, { rules })
  }

  async getMatchingRules(projectId: string): Promise<ApiResponse<MatchingRule[]>> {
    return apiService.get<MatchingRule[]>(`/reconciliation/rules/${projectId}`)
  }

  async createMatchingRule(projectId: string, rule: Partial<MatchingRule>): Promise<ApiResponse<MatchingRule>> {
    return apiService.post<MatchingRule>(`/reconciliation/rules/${projectId}`, rule)
  }

  async updateMatchingRule(projectId: string, ruleId: string, rule: Partial<MatchingRule>): Promise<ApiResponse<MatchingRule>> {
    return apiService.put<MatchingRule>(`/reconciliation/rules/${projectId}/${ruleId}`, rule)
  }

  async deleteMatchingRule(projectId: string, ruleId: string): Promise<ApiResponse> {
    return apiService.delete(`/reconciliation/rules/${projectId}/${ruleId}`)
  }

  async getDiscrepancies(projectId: string): Promise<ApiResponse<Discrepancy[]>> {
    return apiService.get<Discrepancy[]>(`/reconciliation/discrepancies/${projectId}`)
  }

  async resolveDiscrepancy(projectId: string, discrepancyId: string, resolution: Record<string, any>): Promise<ApiResponse> {
    return apiService.post(`/reconciliation/discrepancies/${projectId}/${discrepancyId}/resolve`, resolution)
  }

  async getAnalytics(projectId: string): Promise<ApiResponse<Record<string, any>>> {
    return apiService.get<Record<string, any>>(`/reconciliation/analytics/${projectId}`)
  }

  async exportRecords(projectId: string, format: string = 'csv'): Promise<ApiResponse<Blob>> {
    return apiService.get<Blob>(`/reconciliation/export/${projectId}?format=${format}`, {
      headers: {
        'Accept': format === 'csv' ? 'text/csv' : 'application/json'
      }
    })
  }

  async getAuditTrail(projectId: string): Promise<ApiResponse<AuditEntry[]>> {
    return apiService.get<AuditEntry[]>(`/reconciliation/audit/${projectId}`)
  }
}

export const reconciliationService = new ReconciliationService()

// ============================================================================
// ADJUDICATION SERVICE
// ============================================================================

export interface Workflow {
  id: string
  name: string
  type: string
  status: string
  steps: WorkflowStep[]
  currentStep: number
  assignedTo: User[]
  priority: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowStep {
  id: string
  name: string
  type: string
  status: string
  assignedTo: User[]
  dueDate: Date
  completedAt?: Date
  notes: string
  attachments: Record<string, any>[]
}

export interface Decision {
  id: string
  workflowId: string
  type: string
  decision: string
  reason: string
  madeBy: User
  madeAt: Date
  notes: string
}

export interface Escalation {
  id: string
  workflowId: string
  reason: string
  escalatedBy: User
  escalatedTo: User[]
  escalatedAt: Date
  resolvedAt?: Date
  notes: string
}

export interface Approval {
  id: string
  workflowId: string
  type: string
  status: string
  approver: User
  requestedAt: Date
  approvedAt?: Date
  notes: string
}

class AdjudicationService {
  async getWorkflows(projectId: string): Promise<ApiResponse<Workflow[]>> {
    return apiService.get<Workflow[]>(`/adjudication/workflows/${projectId}`)
  }

  async getWorkflow(id: string): Promise<ApiResponse<Workflow>> {
    return apiService.get<Workflow>(`/adjudication/workflows/${id}`)
  }

  async createWorkflow(projectId: string, workflow: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
    return apiService.post<Workflow>(`/adjudication/workflows/${projectId}`, workflow)
  }

  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<ApiResponse<Workflow>> {
    return apiService.put<Workflow>(`/adjudication/workflows/${id}`, workflow)
  }

  async deleteWorkflow(id: string): Promise<ApiResponse> {
    return apiService.delete(`/adjudication/workflows/${id}`)
  }

  async getDecisions(projectId: string): Promise<ApiResponse<Decision[]>> {
    return apiService.get<Decision[]>(`/adjudication/decisions/${projectId}`)
  }

  async createDecision(workflowId: string, decision: Partial<Decision>): Promise<ApiResponse<Decision>> {
    return apiService.post<Decision>(`/adjudication/decisions/${workflowId}`, decision)
  }

  async getEscalations(projectId: string): Promise<ApiResponse<Escalation[]>> {
    return apiService.get<Escalation[]>(`/adjudication/escalations/${projectId}`)
  }

  async createEscalation(workflowId: string, escalation: Partial<Escalation>): Promise<ApiResponse<Escalation>> {
    return apiService.post<Escalation>(`/adjudication/escalations/${workflowId}`, escalation)
  }

  async resolveEscalation(id: string, resolution: Record<string, any>): Promise<ApiResponse> {
    return apiService.post(`/adjudication/escalations/${id}/resolve`, resolution)
  }

  async getApprovals(projectId: string): Promise<ApiResponse<Approval[]>> {
    return apiService.get<Approval[]>(`/adjudication/approvals/${projectId}`)
  }

  async createApproval(workflowId: string, approval: Partial<Approval>): Promise<ApiResponse<Approval>> {
    return apiService.post<Approval>(`/adjudication/approvals/${workflowId}`, approval)
  }

  async approveApproval(id: string, notes?: string): Promise<ApiResponse> {
    return apiService.post(`/adjudication/approvals/${id}/approve`, { notes })
  }

  async rejectApproval(id: string, reason: string): Promise<ApiResponse> {
    return apiService.post(`/adjudication/approvals/${id}/reject`, { reason })
  }

  async getTasks(projectId: string): Promise<ApiResponse<WorkflowStep[]>> {
    return apiService.get<WorkflowStep[]>(`/adjudication/tasks/${projectId}`)
  }

  async completeTask(id: string, notes: string): Promise<ApiResponse> {
    return apiService.post(`/adjudication/tasks/${id}/complete`, { notes })
  }

  async reassignTask(id: string, userId: string): Promise<ApiResponse> {
    return apiService.post(`/adjudication/tasks/${id}/reassign`, { userId })
  }
}

export const adjudicationService = new AdjudicationService()

// ============================================================================
// VISUALIZATION SERVICE
// ============================================================================

export interface Chart {
  id: string
  name: string
  type: string
  data: Record<string, any>
  config: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Dashboard {
  id: string
  name: string
  description: string
  layout: Record<string, any>
  widgets: Record<string, any>[]
  filters: Record<string, any>[]
  refreshInterval: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Report {
  id: string
  name: string
  description: string
  type: string
  template: Record<string, any>
  data: Record<string, any>
  schedule: Record<string, any>
  recipients: Record<string, any>[]
  createdAt: Date
  updatedAt: Date
}

export interface Export {
  id: string
  name: string
  type: string
  format: string
  data: Record<string, any>
  status: string
  createdAt: Date
  completedAt?: Date
  downloadUrl?: string
}

class VisualizationService {
  async getCharts(projectId: string): Promise<ApiResponse<Chart[]>> {
    return apiService.get<Chart[]>(`/visualization/charts/${projectId}`)
  }

  async getChart(id: string): Promise<ApiResponse<Chart>> {
    return apiService.get<Chart>(`/visualization/charts/${id}`)
  }

  async createChart(projectId: string, chart: Partial<Chart>): Promise<ApiResponse<Chart>> {
    return apiService.post<Chart>(`/visualization/charts/${projectId}`, chart)
  }

  async updateChart(id: string, chart: Partial<Chart>): Promise<ApiResponse<Chart>> {
    return apiService.put<Chart>(`/visualization/charts/${id}`, chart)
  }

  async deleteChart(id: string): Promise<ApiResponse> {
    return apiService.delete(`/visualization/charts/${id}`)
  }

  async getDashboards(projectId: string): Promise<ApiResponse<Dashboard[]>> {
    return apiService.get<Dashboard[]>(`/visualization/dashboards/${projectId}`)
  }

  async getDashboard(id: string): Promise<ApiResponse<Dashboard>> {
    return apiService.get<Dashboard>(`/visualization/dashboards/${id}`)
  }

  async createDashboard(projectId: string, dashboard: Partial<Dashboard>): Promise<ApiResponse<Dashboard>> {
    return apiService.post<Dashboard>(`/visualization/dashboards/${projectId}`, dashboard)
  }

  async updateDashboard(id: string, dashboard: Partial<Dashboard>): Promise<ApiResponse<Dashboard>> {
    return apiService.put<Dashboard>(`/visualization/dashboards/${id}`, dashboard)
  }

  async deleteDashboard(id: string): Promise<ApiResponse> {
    return apiService.delete(`/visualization/dashboards/${id}`)
  }

  async getReports(projectId: string): Promise<ApiResponse<Report[]>> {
    return apiService.get<Report[]>(`/visualization/reports/${projectId}`)
  }

  async getReport(id: string): Promise<ApiResponse<Report>> {
    return apiService.get<Report>(`/visualization/reports/${id}`)
  }

  async createReport(projectId: string, report: Partial<Report>): Promise<ApiResponse<Report>> {
    return apiService.post<Report>(`/visualization/reports/${projectId}`, report)
  }

  async updateReport(id: string, report: Partial<Report>): Promise<ApiResponse<Report>> {
    return apiService.put<Report>(`/visualization/reports/${id}`, report)
  }

  async deleteReport(id: string): Promise<ApiResponse> {
    return apiService.delete(`/visualization/reports/${id}`)
  }

  async generateReport(id: string): Promise<ApiResponse<Blob>> {
    return apiService.post<Blob>(`/visualization/reports/${id}/generate`)
  }

  async getExports(projectId: string): Promise<ApiResponse<Export[]>> {
    return apiService.get<Export[]>(`/visualization/exports/${projectId}`)
  }

  async createExport(projectId: string, exportData: Partial<Export>): Promise<ApiResponse<Export>> {
    return apiService.post<Export>(`/visualization/exports/${projectId}`, exportData)
  }

  async getExport(id: string): Promise<ApiResponse<Export>> {
    return apiService.get<Export>(`/visualization/exports/${id}`)
  }

  async downloadExport(id: string): Promise<ApiResponse<Blob>> {
    return apiService.get<Blob>(`/visualization/exports/${id}/download`)
  }
}

export const visualizationService = new VisualizationService()

// ============================================================================
// INTEGRATION SERVICE
// ============================================================================

export interface ApiConfiguration {
  id: string
  name: string
  type: string
  baseUrl: string
  authentication: Record<string, any>
  endpoints: Record<string, any>[]
  rateLimits: Record<string, any>[]
  enabled: boolean
}

export interface WebhookConfiguration {
  id: string
  name: string
  url: string
  events: Record<string, any>[]
  authentication: Record<string, any>
  retryPolicy: Record<string, any>
  enabled: boolean
}

export interface ExportConfiguration {
  id: string
  name: string
  type: string
  format: string
  destination: Record<string, any>
  schedule: Record<string, any>
  enabled: boolean
}

class IntegrationService {
  async getApiConfigurations(projectId: string): Promise<ApiResponse<ApiConfiguration[]>> {
    return apiService.get<ApiConfiguration[]>(`/integrations/apis/${projectId}`)
  }

  async getApiConfiguration(id: string): Promise<ApiResponse<ApiConfiguration>> {
    return apiService.get<ApiConfiguration>(`/integrations/apis/${id}`)
  }

  async createApiConfiguration(projectId: string, config: Partial<ApiConfiguration>): Promise<ApiResponse<ApiConfiguration>> {
    return apiService.post<ApiConfiguration>(`/integrations/apis/${projectId}`, config)
  }

  async updateApiConfiguration(id: string, config: Partial<ApiConfiguration>): Promise<ApiResponse<ApiConfiguration>> {
    return apiService.put<ApiConfiguration>(`/integrations/apis/${id}`, config)
  }

  async deleteApiConfiguration(id: string): Promise<ApiResponse> {
    return apiService.delete(`/integrations/apis/${id}`)
  }

  async testApiConfiguration(id: string): Promise<ApiResponse<{ success: boolean; response: any }>> {
    return apiService.post<{ success: boolean; response: any }>(`/integrations/apis/${id}/test`)
  }

  async getWebhookConfigurations(projectId: string): Promise<ApiResponse<WebhookConfiguration[]>> {
    return apiService.get<WebhookConfiguration[]>(`/integrations/webhooks/${projectId}`)
  }

  async getWebhookConfiguration(id: string): Promise<ApiResponse<WebhookConfiguration>> {
    return apiService.get<WebhookConfiguration>(`/integrations/webhooks/${id}`)
  }

  async createWebhookConfiguration(projectId: string, config: Partial<WebhookConfiguration>): Promise<ApiResponse<WebhookConfiguration>> {
    return apiService.post<WebhookConfiguration>(`/integrations/webhooks/${projectId}`, config)
  }

  async updateWebhookConfiguration(id: string, config: Partial<WebhookConfiguration>): Promise<ApiResponse<WebhookConfiguration>> {
    return apiService.put<WebhookConfiguration>(`/integrations/webhooks/${id}`, config)
  }

  async deleteWebhookConfiguration(id: string): Promise<ApiResponse> {
    return apiService.delete(`/integrations/webhooks/${id}`)
  }

  async testWebhookConfiguration(id: string): Promise<ApiResponse<{ success: boolean; response: any }>> {
    return apiService.post<{ success: boolean; response: any }>(`/integrations/webhooks/${id}/test`)
  }

  async getExportConfigurations(projectId: string): Promise<ApiResponse<ExportConfiguration[]>> {
    return apiService.get<ExportConfiguration[]>(`/integrations/exports/${projectId}`)
  }

  async getExportConfiguration(id: string): Promise<ApiResponse<ExportConfiguration>> {
    return apiService.get<ExportConfiguration>(`/integrations/exports/${id}`)
  }

  async createExportConfiguration(projectId: string, config: Partial<ExportConfiguration>): Promise<ApiResponse<ExportConfiguration>> {
    return apiService.post<ExportConfiguration>(`/integrations/exports/${projectId}`, config)
  }

  async updateExportConfiguration(id: string, config: Partial<ExportConfiguration>): Promise<ApiResponse<ExportConfiguration>> {
    return apiService.put<ExportConfiguration>(`/integrations/exports/${id}`, config)
  }

  async deleteExportConfiguration(id: string): Promise<ApiResponse> {
    return apiService.delete(`/integrations/exports/${id}`)
  }

  async getIntegrationSettings(projectId: string): Promise<ApiResponse<Record<string, any>>> {
    return apiService.get<Record<string, any>>(`/integrations/settings/${projectId}`)
  }

  async updateIntegrationSettings(projectId: string, settings: Record<string, any>): Promise<ApiResponse<Record<string, any>>> {
    return apiService.put<Record<string, any>>(`/integrations/settings/${projectId}`, settings)
  }
}

export const integrationService = new IntegrationService()

// ============================================================================
// EXPORT ALL SERVICES
// ============================================================================

export * from './constants'
export * from './utils'
