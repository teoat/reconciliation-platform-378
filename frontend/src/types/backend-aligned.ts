// ============================================================================
// BACKEND-ALIGNED TYPE DEFINITIONS - SINGLE SOURCE OF TRUTH
// ============================================================================

// ============================================================================
// BASE TYPES
// ============================================================================

export type ID = string
export type Timestamp = string
export type Status = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

// ============================================================================
// USER & AUTHENTICATION TYPES (Aligned with Backend)
// ============================================================================

export interface User {
  id: ID
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'user' | 'viewer' | 'manager'
  is_active: boolean
  last_login?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

export interface UserResponse {
  id: ID
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  last_login?: Timestamp
  created_at: Timestamp
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

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface AuthResponse {
  token: string
  user: UserResponse
  expires_at: number
}

// ============================================================================
// PROJECT TYPES (Aligned with Backend)
// ============================================================================

export interface Project {
  id: ID
  name: string
  description?: string
  owner_id: ID
  settings?: any
  status: 'active' | 'inactive' | 'archived' | 'draft'
  is_active: boolean
  created_at: Timestamp
  updated_at: Timestamp
}

export interface ProjectResponse {
  id: ID
  name: string
  description?: string
  owner_id: ID
  settings?: any
  is_active: boolean
  created_at: Timestamp
}

export interface CreateProjectRequest {
  name: string
  description?: string
  owner_id: ID
  status?: string
  settings?: any
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  status?: string
  settings?: any
}

export interface ProjectInfo {
  id: ID
  name: string
  description?: string
  owner_id: ID
  owner_email: string
  status: string
  settings?: any
  created_at: Timestamp
  updated_at: Timestamp
  job_count: number
  data_source_count: number
  last_activity?: Timestamp
}

export interface ProjectListResponse {
  projects: ProjectInfo[]
  total: number
  page: number
  per_page: number
}

// ============================================================================
// RECONCILIATION TYPES (Aligned with Backend)
// ============================================================================

export interface ReconciliationJob {
  id: ID
  project_id: ID
  name: string
  description?: string
  source_a_id: ID
  source_b_id: ID
  confidence_threshold: number
  matching_rules: MatchingRule[]
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  total_records?: number
  processed_records: number
  matched_records: number
  unmatched_records: number
  created_by: ID
  started_at?: Timestamp
  completed_at?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

export interface MatchingRule {
  field_a: string
  field_b: string
  rule_type: 'Exact' | 'Fuzzy' | 'Contains' | 'StartsWith' | 'EndsWith' | 'NumericRange' | 'DateRange'
  weight: number
  exact_match: boolean
}

export interface CreateReconciliationJobRequest {
  project_id: ID
  name: string
  description?: string
  source_a_id: ID
  source_b_id: ID
  confidence_threshold: number
  matching_rules: MatchingRule[]
  created_by: ID
}

export interface ReconciliationJobStatus {
  id: ID
  name: string
  status: string
  progress: number
  total_records?: number
  processed_records: number
  matched_records: number
  unmatched_records: number
  started_at?: Timestamp
  completed_at?: Timestamp
}

export interface ReconciliationResult {
  id: ID
  job_id: ID
  source_a_id: ID
  source_b_id: ID
  record_a_id: string
  record_b_id: string
  match_type: 'exact' | 'fuzzy' | 'manual' | 'auto'
  confidence_score: number
  match_details?: any
  created_at: Timestamp
}

export interface ReconciliationResultDetail {
  id: ID
  job_id: ID
  source_a_id: ID
  source_b_id: ID
  record_a_id: string
  record_b_id: string
  match_type: string
  confidence_score: number
  match_details?: any
  created_at: Timestamp
}

// ============================================================================
// FILE UPLOAD TYPES (Aligned with Backend)
// ============================================================================

export interface UploadedFile {
  id: ID
  project_id: ID
  filename: string
  original_filename: string
  file_size: number
  content_type: string
  file_path: string
  status: 'uploaded' | 'processing' | 'processed' | 'failed'
  uploaded_by: ID
  created_at: Timestamp
  updated_at: Timestamp
}

export interface FileInfo {
  id: ID
  project_id: ID
  filename: string
  original_filename: string
  file_size: number
  content_type: string
  file_path: string
  status: string
  uploaded_by: ID
  created_at: Timestamp
  updated_at: Timestamp
}

export interface FileUploadRequest {
  project_id: ID
  name: string
  source_type: string
}

export interface ProcessingResult {
  file_id: ID
  status: string
  record_count?: number
  processing_time: number
  errors: string[]
}

// ============================================================================
// ANALYTICS TYPES (Aligned with Backend)
// ============================================================================

export interface DashboardData {
  total_users: number
  total_projects: number
  total_reconciliation_jobs: number
  total_data_sources: number
  active_jobs: number
  completed_jobs: number
  failed_jobs: number
  total_matches: number
  total_unmatched: number
  recent_activity: ActivityItem[]
  performance_metrics: PerformanceMetrics
}

export interface ActivityItem {
  id: ID
  action: string
  resource_type: string
  user_email?: string
  timestamp: Timestamp
  details?: any
}

export interface PerformanceMetrics {
  average_processing_time_ms: number
  total_processing_time_ms: number
  average_confidence_score: number
  match_rate: number
  throughput_per_hour: number
}

export interface ProjectStats {
  project_id: ID
  project_name: string
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  total_data_sources: number
  total_matches: number
  total_unmatched: number
  average_confidence_score: number
  last_activity?: Timestamp
}

export interface UserActivityStats {
  user_id: ID
  user_email: string
  total_actions: number
  projects_created: number
  jobs_created: number
  files_uploaded: number
  last_activity?: Timestamp
  activity_by_day: DailyActivity[]
}

export interface DailyActivity {
  date: string
  actions: number
}

export interface ReconciliationStats {
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  total_matches: number
  total_unmatched: number
  average_confidence_score: number
  average_processing_time_ms: number
  match_rate: number
}

// ============================================================================
// API RESPONSE TYPES (Aligned with Backend)
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

export interface UserQueryParams {
  page?: number
  per_page?: number
}

export interface SearchQueryParams {
  q: string
  page?: number
  per_page?: number
}

export interface ProjectQueryParams {
  owner_id?: ID
  status?: string
  page?: number
  per_page?: number
}

export interface ReconciliationResultsQuery {
  page?: number
  per_page?: number
  match_type?: string
}

// ============================================================================
// ERROR TYPES (Aligned with Backend)
// ============================================================================

export interface ErrorResponse {
  error: string
  message: string
  code: string
}

export interface AppError {
  message: string
  code?: string
  details?: any
}

export interface ValidationError {
  field: string
  message: string
}

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
  response?: ErrorResponse
}

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Timestamp
}

export interface RealtimeUpdate {
  type: 'job_progress' | 'job_completed' | 'job_failed' | 'file_processed' | 'user_activity'
  data: any
  timestamp: Timestamp
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'file'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: (value: any) => string | null
  }
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface Notification {
  id: ID
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Timestamp
  read: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  pagination?: {
    page: number
    per_page: number
    total: number
    onPageChange: (page: number) => void
  }
  sorting?: {
    field: keyof T
    direction: 'asc' | 'desc'
    onSort: (field: keyof T) => void
  }
}
