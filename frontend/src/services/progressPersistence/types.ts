// Progress Persistence Types
import { CheckpointData, ResumeData } from '../../types/progress';

export interface ProgressSnapshot {
  id: string;
  operationId: string;
  operationType: 'reconciliation' | 'data_processing' | 'file_upload' | 'export' | 'import';
  stage: string;
  progress: number; // 0-100
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  lastUpdateTime: Date;
  estimatedTimeRemaining: number; // seconds
  data: {
    processed: number;
    total: number;
    errors: number;
    warnings: number;
  };
  context: {
    userId: string;
    projectId: string;
    sessionId: string;
    userAgent: string;
  };
  checkpoint: CheckpointData;
  resumeData: ResumeData;
}

export interface ResumeConfig {
  enableAutoResume: boolean;
  maxResumeAge: number; // milliseconds
  checkpointInterval: number; // milliseconds
  enableProgressTracking: boolean;
  enableStatePersistence: boolean;
  enableDependencyTracking: boolean;
}

export interface OperationContext {
  operationId: string;
  operationType: ProgressSnapshot['operationType'];
  userId: string;
  projectId: string;
  metadata?: Record<string, unknown>;
}
