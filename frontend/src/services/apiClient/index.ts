// ============================================================================
// MODULAR API CLIENT - MAIN ENTRY POINT
// ============================================================================

import { secureStorage } from '../secureStorage';
import { RequestBuilder } from './request';
import { RequestExecutor } from './request';
import { ResponseHandler, ResponseCache, ResponseValidator } from './response';
import {
  InterceptorManager,
  AuthInterceptor,
  LoggingInterceptor,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from './interceptors';
import { ConfigBuilder, PerformanceMonitor, CacheKeyGenerator } from './utils';
import { WebSocketClient } from '../websocket';
import {
  ApiClientConfig,
  RequestConfig,
  ApiResponse,
  ApiErrorLike,
  CacheEntry,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateUserRequest,
  UpdateUserRequest,
  FileUploadRequest,
  FileUploadResponse,
  PaginatedResponse,
  ReconciliationResultsQuery,
  ProjectQueryParams,
  UserQueryParams,
} from './types';
import { DashboardData, ReconciliationStats } from '../../types/index';
import {
  BackendUser,
  BackendProject,
  BackendDataSource,
  BackendReconciliationRecord,
  BackendReconciliationMatch,
  BackendReconciliationJob,
} from './types';

// ============================================================================
// MAIN API CLIENT CLASS
// ============================================================================

export class ApiClient {
  private config: ApiClientConfig;
  private requestBuilder: RequestBuilder;
  private requestExecutor: RequestExecutor;
  private responseHandler: ResponseHandler;
  private responseCache: ResponseCache;
  private responseValidator: ResponseValidator;
  private interceptorManager: InterceptorManager;
  private performanceMonitor: PerformanceMonitor;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = ConfigBuilder.mergeConfigs(ConfigBuilder.createDefaultConfig(), config || {});

    this.requestBuilder = new RequestBuilder(this.config);
    this.requestExecutor = new RequestExecutor(this.config);
    this.responseHandler = new ResponseHandler();
    this.responseCache = new ResponseCache();
    this.responseValidator = new ResponseValidator();
    this.interceptorManager = new InterceptorManager();
    this.performanceMonitor = new PerformanceMonitor();

    this.setupDefaultInterceptors();
  }

  // ============================================================================
  // CONFIGURATION METHODS
  // ============================================================================

  setAuthToken(token: string): void {
    // Use secureStorage for sensitive token data
    secureStorage.setItem('authToken', token, false);
  }

  clearAuthToken(): void {
    secureStorage.removeItem('authToken', false);
  }

  getAuthToken(): string | null {
    return secureStorage.getItem<string>('authToken', false);
  }

  updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = ConfigBuilder.mergeConfigs(this.config, config);
  }

  // ============================================================================
  // INTERCEPTOR MANAGEMENT
  // ============================================================================

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.interceptorManager.addRequestInterceptor(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.interceptorManager.addResponseInterceptor(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.interceptorManager.addErrorInterceptor(interceptor);
  }

  // ============================================================================
  // HTTP METHODS
  // ============================================================================

  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<T>(endpoint, config, params);
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const config = this.requestBuilder.method('POST').body(data).build();
    return this.makeRequest<T>(endpoint, config);
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const config = this.requestBuilder.method('PUT').body(data).build();
    return this.makeRequest<T>(endpoint, config);
  }

  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const config = this.requestBuilder.method('PATCH').body(data).build();
    return this.makeRequest<T>(endpoint, config);
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    const config = this.requestBuilder.method('DELETE').build();
    return this.makeRequest<T>(endpoint, config);
  }

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    const config = this.requestBuilder.method('GET').skipAuth().noCache().timeout(5000).build();
    return this.makeRequest<{ status: string; timestamp: string }>('/api/health', config);
  }

  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<DashboardData>('/analytics/dashboard', config);
  }

  async getReconciliationStats(): Promise<ApiResponse<ReconciliationStats>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<ReconciliationStats>('/analytics/reconciliation-stats', config);
  }

  async uploadFile(
    projectId: string,
    file: File,
    metadata: FileUploadRequest
  ): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', metadata.project_id);
    formData.append('name', metadata.name);
    formData.append('source_type', metadata.source_type);

    const config = this.requestBuilder.method('POST').body(formData).build();

    return this.makeRequest<FileUploadResponse>(`/projects/${projectId}/files/upload`, config);
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    const config = this.requestBuilder.method('POST').body(data).build();
    return this.makeRequest<{ message: string }>('/user/change-password', config);
  }

  async getFilePreview(
    projectId: string,
    fileId: string
  ): Promise<
    ApiResponse<{
      file_id: string;
      filename: string;
      content_type: string;
      size: number;
      preview: string;
      truncated: boolean;
    }>
  > {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest(`/projects/${projectId}/files/${fileId}/preview`, config);
  }

  async deleteDataSource(projectId: string, dataSourceId: string): Promise<ApiResponse<boolean>> {
    const config = this.requestBuilder.method('DELETE').build();
    return this.makeRequest<boolean>(`/projects/${projectId}/files/${dataSourceId}`, config);
  }

  async updateReconciliationMatch(
    projectId: string,
    matchId: string,
    matchData: {
      status?: string;
      confidence_score?: number;
      reviewed_by?: string;
    }
  ): Promise<ApiResponse<Record<string, unknown>>> {
    const config = this.requestBuilder.method('PUT').body(matchData).build();
    return this.makeRequest<Record<string, unknown>>(
      `/projects/${projectId}/matches/${matchId}`,
      config
    );
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const config = this.requestBuilder.method('POST').body(credentials).skipAuth().build();
    return this.makeRequest<LoginResponse>('/auth/login', config);
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const config = this.requestBuilder.method('POST').body(userData).skipAuth().build();
    return this.makeRequest<LoginResponse>('/auth/register', config);
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const config = this.requestBuilder.method('POST').build();
    return this.makeRequest<{ message: string }>('/auth/logout', config);
  }

  async getCurrentUser(): Promise<ApiResponse<BackendUser>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<BackendUser>('/auth/me', config);
  }

  async googleOAuth(idToken: string): Promise<ApiResponse<LoginResponse>> {
    const config = this.requestBuilder
      .method('POST')
      .body({ id_token: idToken })
      .skipAuth()
      .build();
    return this.makeRequest<LoginResponse>('/auth/google', config);
  }

  // ============================================================================
  // USER MANAGEMENT METHODS
  // ============================================================================

  async getUsers(page = 1, perPage = 20): Promise<ApiResponse<PaginatedResponse<BackendUser>>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<PaginatedResponse<BackendUser>>(
      `/users?page=${page}&per_page=${perPage}`,
      config
    );
  }

  async searchUsers(
    query: string,
    page = 1,
    perPage = 20
  ): Promise<ApiResponse<PaginatedResponse<BackendUser>>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<PaginatedResponse<BackendUser>>(
      `/users/search?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      config
    );
  }

  async getUserById(userId: string): Promise<ApiResponse<BackendUser>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<BackendUser>(`/users/${userId}`, config);
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<BackendUser>> {
    const config = this.requestBuilder.method('POST').body(userData).build();
    return this.makeRequest<BackendUser>('/users', config);
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<ApiResponse<BackendUser>> {
    const config = this.requestBuilder.method('PUT').body(userData).build();
    return this.makeRequest<BackendUser>(`/users/${userId}`, config);
  }

  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    const config = this.requestBuilder.method('DELETE').build();
    return this.makeRequest<{ message: string }>(`/users/${userId}`, config);
  }

  // ============================================================================
  // PROJECT MANAGEMENT METHODS
  // ============================================================================

  async getProjects(
    page = 1,
    perPage = 20
  ): Promise<ApiResponse<PaginatedResponse<BackendProject>>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<PaginatedResponse<BackendProject>>(
      `/projects?page=${page}&per_page=${perPage}`,
      config
    );
  }

  async getProjectById(projectId: string): Promise<ApiResponse<BackendProject>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<BackendProject>(`/projects/${projectId}`, config);
  }

  async createProject(projectData: CreateProjectRequest): Promise<ApiResponse<BackendProject>> {
    const config = this.requestBuilder.method('POST').body(projectData).build();
    return this.makeRequest<BackendProject>('/projects', config);
  }

  async updateProject(
    projectId: string,
    projectData: UpdateProjectRequest
  ): Promise<ApiResponse<BackendProject>> {
    const config = this.requestBuilder.method('PUT').body(projectData).build();
    return this.makeRequest<BackendProject>(`/projects/${projectId}`, config);
  }

  async deleteProject(projectId: string): Promise<ApiResponse<{ message: string }>> {
    const config = this.requestBuilder.method('DELETE').build();
    return this.makeRequest<{ message: string }>(`/projects/${projectId}`, config);
  }

  async getProjectStats(projectId: string): Promise<ApiResponse<ReconciliationStats>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<ReconciliationStats>(`/projects/${projectId}/stats`, config);
  }

  // ============================================================================
  // DATA SOURCE METHODS
  // ============================================================================

  async getDataSources(projectId: string): Promise<ApiResponse<BackendDataSource[]>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<BackendDataSource[]>(`/projects/${projectId}/files`, config);
  }

  async processFile(
    projectId: string,
    dataSourceId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const config = this.requestBuilder.method('POST').build();
    return this.makeRequest<{ message: string }>(
      `/projects/${projectId}/files/${dataSourceId}/process`,
      config
    );
  }

  // ============================================================================
  // RECONCILIATION METHODS
  // ============================================================================

  async getReconciliationRecords(
    projectId: string,
    page = 1,
    perPage = 20
  ): Promise<ApiResponse<PaginatedResponse<BackendReconciliationRecord>>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<PaginatedResponse<BackendReconciliationRecord>>(
      `/projects/${projectId}/records?page=${page}&per_page=${perPage}`,
      config
    );
  }

  async getReconciliationMatches(
    projectId: string,
    page = 1,
    perPage = 20
  ): Promise<ApiResponse<PaginatedResponse<BackendReconciliationMatch>>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<PaginatedResponse<BackendReconciliationMatch>>(
      `/projects/${projectId}/matches?page=${page}&per_page=${perPage}`,
      config
    );
  }

  async createReconciliationMatch(
    projectId: string,
    matchData: {
      record_a_id: string;
      record_b_id: string;
      confidence_score: number;
      status?: string;
    }
  ): Promise<ApiResponse<BackendReconciliationMatch>> {
    const config = this.requestBuilder.method('POST').body(matchData).build();
    return this.makeRequest<BackendReconciliationMatch>(`/projects/${projectId}/matches`, config);
  }

  // ============================================================================
  // RECONCILIATION JOB METHODS
  // ============================================================================

  async getReconciliationJobs(projectId: string): Promise<ApiResponse<BackendReconciliationJob[]>> {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<BackendReconciliationJob[]>(`/projects/${projectId}/jobs`, config);
  }

  async createReconciliationJob(
    projectId: string,
    jobData: {
      name: string;
      description?: string;
      source_a_id: string;
      source_b_id: string;
      confidence_threshold: number;
      matching_rules?: Array<{
        field: string;
        algorithm: string;
        weight?: number;
      }>;
      settings?: Record<string, unknown>;
    }
  ): Promise<ApiResponse<BackendReconciliationJob>> {
    const config = this.requestBuilder.method('POST').body(jobData).build();
    return this.makeRequest<BackendReconciliationJob>(`/projects/${projectId}/jobs`, config);
  }

  async startReconciliationJob(
    projectId: string,
    jobId: string
  ): Promise<ApiResponse<BackendReconciliationJob>> {
    const config = this.requestBuilder.method('POST').build();
    return this.makeRequest<BackendReconciliationJob>(
      `/projects/${projectId}/jobs/${jobId}/start`,
      config
    );
  }

  async stopReconciliationJob(
    projectId: string,
    jobId: string
  ): Promise<ApiResponse<BackendReconciliationJob>> {
    const config = this.requestBuilder.method('POST').build();
    return this.makeRequest<BackendReconciliationJob>(
      `/projects/${projectId}/jobs/${jobId}/stop`,
      config
    );
  }

  async deleteReconciliationJob(
    projectId: string,
    jobId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const config = this.requestBuilder.method('DELETE').build();
    return this.makeRequest<{ message: string }>(`/projects/${projectId}/jobs/${jobId}`, config);
  }

  async getReconciliationJobProgress(jobId: string): Promise<
    ApiResponse<{
      job_id: string;
      status: string;
      progress: number;
      total_records?: number;
      processed_records: number;
      matched_records: number;
      unmatched_records: number;
      current_phase: string;
      estimated_completion?: string;
    }>
  > {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<{
      job_id: string;
      status: string;
      progress: number;
      total_records?: number;
      processed_records: number;
      matched_records: number;
      unmatched_records: number;
      current_phase: string;
      estimated_completion?: string;
    }>(`/jobs/${jobId}/progress`, config);
  }

  async getReconciliationJobResults(
    jobId: string,
    page = 1,
    perPage = 20
  ): Promise<
    ApiResponse<{
      data?: Array<{
        id: string;
        job_id: string;
        source_record_id: string;
        target_record_id: string;
        match_type: 'exact' | 'fuzzy' | 'manual' | 'unmatched';
        confidence_score: number;
        status: 'matched' | 'unmatched' | 'discrepancy' | 'resolved';
        created_at: string;
        updated_at: string;
      }>;
      page?: number;
      per_page?: number;
      total?: number;
    }>
  > {
    const config = this.requestBuilder.method('GET').build();
    return this.makeRequest<{
      data?: Array<{
        id: string;
        job_id: string;
        source_record_id: string;
        target_record_id: string;
        match_type: 'exact' | 'fuzzy' | 'manual' | 'unmatched';
        confidence_score: number;
        status: 'matched' | 'unmatched' | 'discrepancy' | 'resolved';
        created_at: string;
        updated_at: string;
      }>;
      page?: number;
      per_page?: number;
      total?: number;
    }>(`/jobs/${jobId}/results?page=${page}&per_page=${perPage}`, config);
  }

  // ============================================================================
  // CORE REQUEST HANDLING
  // ============================================================================

  public async makeRequest<T>(
    endpoint: string,
    config: RequestConfig,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const cacheKey = CacheKeyGenerator.generate(endpoint, params);

    try {
      // Apply request interceptors
      const processedConfig = await this.interceptorManager.applyRequestInterceptors(config);

      // Check cache for GET requests
      if (
        processedConfig.method === 'GET' &&
        processedConfig.cache &&
        this.responseCache.has(cacheKey)
      ) {
        const cachedData = this.responseCache.get(cacheKey);
        return this.responseHandler.handleResponse(cachedData);
      }

      // Execute request
      const responseData = await this.requestExecutor.execute<T>(endpoint, processedConfig);

      // Wrap raw response data into ApiResponse format before interceptors
      const response: ApiResponse<T> = {
        success: true,
        data: responseData,
      };

      // Apply response interceptors
      const processedResponse = await this.interceptorManager.applyResponseInterceptors(
        response,
        processedConfig
      );

      // Handle response (interceptors may have modified it)
      const apiResponse = this.responseHandler.handleResponse<T>(processedResponse);

      // Validate response
      const validatedResponse = this.responseValidator.validateResponse(apiResponse);

      // Cache successful GET responses
      if (processedConfig.method === 'GET' && processedConfig.cache && validatedResponse.success) {
        this.responseCache.set(cacheKey, validatedResponse.data, this.config.cacheTTL);
      }

      // Record performance metrics
      const duration = Date.now() - startTime;
      this.performanceMonitor.recordRequest(endpoint, duration);

      return validatedResponse;
    } catch (error) {
      // Apply error interceptors
      const processedError = await this.interceptorManager.applyErrorInterceptors(
        error as ApiErrorLike,
        config
      );

      // Record performance metrics for failed requests
      const duration = Date.now() - startTime;
      this.performanceMonitor.recordRequest(endpoint, duration);

      return this.responseHandler.handleError(
        processedError,
        endpoint,
        config.method || 'GET'
      ) as ApiResponse<T>;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getPerformanceMetrics(): Record<
    string,
    { average: number; count: number; min: number; max: number }
  > {
    return this.performanceMonitor.getMetrics();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return this.responseCache.getStats();
  }

  clearCache(): void {
    this.responseCache.clear();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupDefaultInterceptors(): void {
    // Add default interceptors
    const authInterceptor = new AuthInterceptor();
    const loggingInterceptor = new LoggingInterceptor();

    this.interceptorManager.addRequestInterceptor((config) => authInterceptor.request(config));
    this.interceptorManager.addResponseInterceptor((response, config) =>
      authInterceptor.response(response, config)
    );
    this.interceptorManager.addErrorInterceptor((error, config) =>
      authInterceptor.error(error, config)
    );

    if (import.meta.env.DEV) {
      this.interceptorManager.addRequestInterceptor((config) => loggingInterceptor.request(config));
      this.interceptorManager.addResponseInterceptor((response, config) =>
        loggingInterceptor.response(response, config)
      );
      this.interceptorManager.addErrorInterceptor((error, config) =>
        loggingInterceptor.error(error, config)
      );
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const apiClient = new ApiClient();

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

export const makeRequest = apiClient.makeRequest.bind(apiClient);
export const get = apiClient.get.bind(apiClient);
export const post = apiClient.post.bind(apiClient);
export const put = apiClient.put.bind(apiClient);
export const patch = apiClient.patch.bind(apiClient);
export const delete_ = apiClient.delete.bind(apiClient);

// ============================================================================
// WEBSOCKET CLIENT
// ============================================================================

export { WebSocketClient };

// Create a default WebSocket client instance
// Use unified config from AppConfig (SSOT)
import { APP_CONFIG } from '../../config/AppConfig';
const defaultWebSocketConfig = {
  url: APP_CONFIG.WS_URL || 'ws://localhost:2000',
  options: {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  },
};

export const wsClient = new WebSocketClient(defaultWebSocketConfig);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  ApiClientConfig,
  RequestConfig,
  ApiResponse,
  CacheEntry,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateUserRequest,
  UpdateUserRequest,
  FileUploadRequest,
  FileUploadResponse,
  PaginatedResponse,
  ReconciliationResultsQuery,
  ProjectQueryParams,
  UserQueryParams,
  // Backend types
  BackendUser,
  BackendProject,
  BackendDataSource,
  BackendReconciliationRecord,
  BackendReconciliationMatch,
  BackendReconciliationJob,
};
