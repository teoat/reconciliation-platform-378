// Reconciliation API Service
import { apiClient } from '../apiClient';

export interface ReconciliationRecord {
  id: string;
  sourceId: string;
  targetId: string;
  status: 'matched' | 'unmatched' | 'pending';
  confidence: number;
  differences?: Record<string, unknown>;
}

export interface ReconciliationJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
}

export const reconciliationApi = {
  async getRecords(): Promise<ReconciliationRecord[]> {
    const response = await apiClient.get<ReconciliationRecord[]>('/reconciliation/records');
    return response.data;
  },

  async getRecord(id: string): Promise<ReconciliationRecord> {
    const response = await apiClient.get<ReconciliationRecord>(`/reconciliation/records/${id}`);
    return response.data;
  },

  async createJob(data: { sourceId: string; targetId: string }): Promise<ReconciliationJob> {
    const response = await apiClient.post<ReconciliationJob>('/reconciliation/jobs', data);
    return response.data;
  },

  async getJob(id: string): Promise<ReconciliationJob> {
    const response = await apiClient.get<ReconciliationJob>(`/reconciliation/jobs/${id}`);
    return response.data;
  },

  async listJobs(): Promise<ReconciliationJob[]> {
    const response = await apiClient.get<ReconciliationJob[]>('/reconciliation/jobs');
    return response.data;
  },
};
