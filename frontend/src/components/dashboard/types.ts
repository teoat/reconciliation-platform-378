// Analytics Dashboard Types
// Extracted from AnalyticsDashboard.tsx

export interface DashboardMetrics {
  total_projects: number;
  total_users: number;
  total_files: number;
  total_reconciliation_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_records_processed: number;
  total_matches_found: number;
  average_confidence_score: number;
  average_processing_time: number;
  system_uptime: number;
  last_updated: string;
}

export interface ProjectStats {
  project_id: string;
  project_name: string;
  total_files: number;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_records: number;
  matched_records: number;
  unmatched_records: number;
  average_confidence: number;
  last_activity: string;
  created_at: string;
}

export interface ReconciliationStats {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  queued_jobs: number;
  total_records_processed: number;
  total_matches_found: number;
  total_unmatched_records: number;
  average_confidence_score: number;
  average_processing_time: number;
  success_rate: number;
  throughput_per_hour: number;
}

export interface TrendData {
  date: string;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  records_processed: number;
  matches_found: number;
  average_confidence: number;
}

export interface AnalyticsDashboardProps {
  projectId?: string;
  refreshInterval?: number;
  showRealTimeUpdates?: boolean;
}

export interface DerivedMetrics {
  success_rate: number;
  match_rate: number;
  throughput_per_hour: number;
  system_health: 'excellent' | 'good' | 'fair' | 'poor';
}

