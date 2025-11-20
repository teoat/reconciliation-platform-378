// Type definitions for Reconciliation Interface
export interface ReconciliationJob {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  source_data_source_id: string;
  target_data_source_id: string;
  confidence_threshold: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_records?: number;
  processed_records: number;
  matched_records: number;
  unmatched_records: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  created_by: string;
  settings?: Record<string, unknown>;
}

export interface ReconciliationProgress {
  job_id: string;
  status: string;
  progress: number;
  total_records?: number;
  processed_records: number;
  matched_records: number;
  unmatched_records: number;
  current_phase: string;
  estimated_completion?: string;
}

export interface ReconciliationResult {
  id: string;
  job_id: string;
  source_record_id: string;
  target_record_id: string;
  match_type: 'exact' | 'fuzzy' | 'manual' | 'unmatched';
  confidence_score: number;
  status: 'matched' | 'unmatched' | 'discrepancy' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface CreateReconciliationJobRequest {
  name: string;
  description?: string;
  source_data_source_id: string;
  target_data_source_id: string;
  confidence_threshold: number;
  settings?: Record<string, unknown>;
}

export interface ReconciliationInterfaceProps {
  projectId: string;
  onJobSelect?: (job: ReconciliationJob) => void;
  onJobCreate?: (job: ReconciliationJob) => void;
  onJobUpdate?: (job: ReconciliationJob) => void;
  onJobDelete?: (jobId: string) => void;
}
