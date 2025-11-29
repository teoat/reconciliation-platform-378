// Consolidated Data Service
import { logger } from '@/services/logger';
// Combines functionality from: dataManagement.ts, fileService.ts, offlineDataService.ts, dataFreshnessService.ts

import { apiClient } from '../apiClient';

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'archived';
  ingestionData: IngestionData;
  reconciliationData: ReconciliationData;
  cashflowData: CashflowData;
  analytics: ProjectAnalytics;
}

export interface IngestionData {
  uploadedFiles: UploadedFile[];
  processedData: ProcessedRecord[];
  dataQuality: DataQualityMetrics;
  mappings: FieldMapping[];
  validations: DataValidation[];
  lastProcessed: string;
}

export interface ReconciliationData {
  records: ReconciliationRecord[];
  matchingRules: MatchingRule[];
  metrics: ReconciliationMetrics;
  auditTrail: AuditEntry[];
  lastReconciled: string;
}

export interface CashflowData {
  categories: ExpenseCategory[];
  metrics: CashflowMetrics;
  discrepancies: DiscrepancyRecord[];
  lastAnalyzed: string;
}

export interface ProcessedRecord {
  id: string;
  sourceFile: string;
  fileType: 'expenses' | 'bank_statement' | 'other';
  data: Record<string, unknown>;
  quality: DataQualityMetrics;
  processedAt: string;
  validated: boolean;
  errors: string[];
}

export interface ReconciliationRecord {
  id: string;
  reconciliationId: string;
  batchId: string;
  sources: ReconciliationSource[];
  status: 'matched' | 'unmatched' | 'discrepancy' | 'pending' | 'resolved' | 'escalated';
  confidence: number;
  matchingRules: MatchingRule[];
  auditTrail: AuditEntry[];
  metadata: RecordMetadata;
  relationships: RecordRelationship[];
  resolution?: Resolution;
  matchScore: number;
  difference?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReconciliationSource {
  id: string;
  systemId: string;
  systemName: string;
  recordId: string;
  data: Record<string, unknown>;
  timestamp: string;
  quality: DataQualityMetrics;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface MatchingRule {
  id: string;
  name: string;
  type: 'exact' | 'fuzzy' | 'algorithmic' | 'manual';
  criteria: MatchingCriteria[];
  weight: number;
  applied: boolean;
  result: MatchingResult;
  confidence: number;
}

export interface MatchingCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'fuzzy';
  value: unknown;
  tolerance?: number;
  weight: number;
}

export interface MatchingResult {
  matched: boolean;
  confidence: number;
  reason: string;
  details: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export interface RecordMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecordRelationship {
  id: string;
  type: 'parent' | 'child' | 'sibling' | 'related';
  targetRecordId: string;
  confidence: number;
  reason: string;
}

export interface Resolution {
  id: string;
  type: 'automatic' | 'manual' | 'approved';
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolution: string;
  comments: string[];
  attachments: string[];
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  uploadedBy: string;
  uploadedAt: Date;
  version: number;
  status: 'uploading' | 'completed' | 'failed' | 'processing';
  metadata: {
    description?: string;
    tags?: string[];
    projectId?: string;
    isActive: boolean;
    isDeleted: boolean;
  };
  data: {
    url?: string;
    blob?: Blob;
    content?: string;
  };
}

export interface UploadSession {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  validity: number;
  uniqueness: number;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  confidence: number;
}

export interface DataValidation {
  field: string;
  rule: string;
  passed: boolean;
  error?: string;
}

export interface ReconciliationMetrics {
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  discrepancyRecords: number;
  matchRate: number;
  averageConfidence: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  budget: number;
  spent: number;
}

export interface CashflowMetrics {
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  budgetVariance: number;
}

export interface DiscrepancyRecord {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ProjectAnalytics {
  processingTime: number;
  dataQuality: DataQualityMetrics;
  reconciliationEfficiency: number;
  userActivity: UserActivityMetrics;
}

export interface UserActivityMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  mostActiveUsers: string[];
  featureUsage: Record<string, number>;
}

export interface OfflineData {
  id: string;
  type: 'form' | 'upload' | 'reconciliation' | 'workflow' | 'settings';
  data: unknown;
  timestamp: Date;
  version: number;
  projectId?: string;
  userId?: string;
  component?: string;
  isDirty: boolean;
  lastSaved?: Date;
}

export interface OfflineConfig {
  enableAutoSave: boolean;
  autoSaveInterval: number;
  maxStorageSize: number;
  enableRecovery: boolean;
  recoveryPromptDelay: number;
  enableSync: boolean;
  syncOnReconnect: boolean;
}

export interface RecoveryPrompt {
  id: string;
  type: 'data_recovery' | 'sync_conflict' | 'offline_changes';
  title: string;
  message: string;
  data: OfflineData[];
  actions: {
    accept: () => void;
    reject: () => void;
    review: () => void;
  };
  timestamp: Date;
}

export class DataService {
  private static instance: DataService;
  private offlineConfig: OfflineConfig;
  private offlineStorage: Map<string, OfflineData> = new Map();
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private uploadSessions: Map<string, UploadSession> = new Map();
  private onlineStatus: boolean = navigator.onLine;

  private constructor() {
    this.offlineConfig = {
      enableAutoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      maxStorageSize: 50 * 1024 * 1024, // 50MB
      enableRecovery: true,
      recoveryPromptDelay: 5000, // 5 seconds
      enableSync: true,
      syncOnReconnect: true,
    };

    this.initializeOfflineSupport();
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Project Data Management
  async getProjectData(projectId: string): Promise<ProjectData> {
    const response = await apiClient.get<ProjectData>(`/api/projects/${projectId}`);
    if (!response.success || !response.data) {
      throw new Error(typeof response.error === 'string' ? response.error : 'Failed to fetch project data');
    }
    return response.data as ProjectData;
  }

  async updateProjectData(projectId: string, data: Partial<ProjectData>): Promise<ProjectData> {
    const response = await apiClient.put<ProjectData>(`/api/projects/${projectId}`, data);
    if (!response.success || !response.data) {
      throw new Error(typeof response.error === 'string' ? response.error : 'Failed to update project data');
    }
    return response.data as ProjectData;
  }

  async createProject(
    projectData: Omit<ProjectData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProjectData> {
    const response = await apiClient.post<ProjectData>('/api/projects', projectData);
    if (!response.success || !response.data) {
      throw new Error(typeof response.error === 'string' ? response.error : 'Failed to create project');
    }
    return response.data as ProjectData;
  }

  // File Management
  startUpload(file: File): UploadSession {
    const session: UploadSession = {
      id: Math.random().toString(36).substr(2, 9),
      fileId: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: 'pending',
    };

    this.uploadSessions.set(session.id, session);
    return session;
  }

  async uploadFile(sessionId: string, file: File, projectId?: string): Promise<UploadedFile> {
    const session = this.uploadSessions.get(sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    if (!projectId) {
      throw new Error('Project ID is required for file upload');
    }

    session.status = 'uploading';

    try {
      // ✅ P2-UX-001: Use REST-compliant endpoint /api/v1/projects/{project_id}/files/upload
      const response = await apiClient.uploadFile(projectId, file, {
        name: session.fileName,
        source_type: 'manual_upload',
        project_id: projectId,
      });

      session.status = 'completed';
      return response.data as unknown as UploadedFile;
    } catch (error) {
      session.status = 'failed';
      throw error;
    }
  }

  async getFile(fileId: string): Promise<UploadedFile> {
    const response = await apiClient.get(`/api/files/${fileId}`);
    return response.data as UploadedFile;
  }

  async deleteFile(fileId: string): Promise<void> {
    await apiClient.delete(`/api/files/${fileId}`);
  }

  // Offline Data Management
  saveOfflineData(data: OfflineData): void {
    this.offlineStorage.set(data.id, data);
    this.persistOfflineData();

    if (this.offlineConfig.enableAutoSave) {
      this.scheduleAutoSave(data.id);
    }
  }

  getOfflineData(id: string): OfflineData | undefined {
    return this.offlineStorage.get(id);
  }

  getAllOfflineData(type?: string): OfflineData[] {
    const data = Array.from(this.offlineStorage.values());
    return type ? data.filter((item) => item.type === type) : data;
  }

  deleteOfflineData(id: string): void {
    this.offlineStorage.delete(id);
    this.persistOfflineData();
  }

  clearOfflineData(type?: string): void {
    if (type) {
      for (const [id, data] of this.offlineStorage) {
        if (data.type === type) {
          this.offlineStorage.delete(id);
        }
      }
    } else {
      this.offlineStorage.clear();
    }
    this.persistOfflineData();
  }

  // Data Freshness
  isDataFresh(dataId: string, maxAge: number = 300000): boolean {
    // 5 minutes default
    const data = this.offlineStorage.get(dataId);
    if (!data) return false;

    const age = Date.now() - data.timestamp.getTime();
    return age < maxAge;
  }

  getDataAge(dataId: string): number {
    const data = this.offlineStorage.get(dataId);
    return data ? Date.now() - data.timestamp.getTime() : Infinity;
  }

  // Reconciliation Data
  async getReconciliationRecords(projectId: string): Promise<ReconciliationRecord[]> {
    const response = await apiClient.get<{ records: ReconciliationRecord[] }>(
      `/api/projects/${projectId}/reconciliation`
    );
    return response.data?.records ?? [];
  }

  async updateReconciliationRecord(
    recordId: string,
    updates: Partial<ReconciliationRecord>
  ): Promise<ReconciliationRecord> {
    const response = await apiClient.put(`/api/reconciliation/${recordId}`, updates);
    return response.data as ReconciliationRecord;
  }

  // Private methods
  private initializeOfflineSupport(): void {
    window.addEventListener('online', () => {
      this.onlineStatus = true;
      if (this.offlineConfig.syncOnReconnect) {
        this.syncOfflineData();
      }
    });

    window.addEventListener('offline', () => {
      this.onlineStatus = false;
    });

    this.loadPersistedOfflineData();
  }

  private persistOfflineData(): void {
    try {
      const data = Array.from(this.offlineStorage.entries());
      localStorage.setItem('offlineData', JSON.stringify(data));
    } catch (error) {
      logger.warning('Failed to persist offline data:', { error: String(error) });
    }
  }

  private loadPersistedOfflineData(): void {
    try {
      const data = localStorage.getItem('offlineData');
      if (data) {
        const parsed = JSON.parse(data);
        this.offlineStorage = new Map(parsed);
      }
    } catch (error) {
      logger.warning('Failed to load persisted offline data:', { error: String(error) });
    }
  }

  private scheduleAutoSave(dataId: string): void {
    const existingTimer = this.autoSaveTimers.get(dataId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      const data = this.offlineStorage.get(dataId);
      if (data && data.isDirty) {
        this.persistOfflineData();
        data.lastSaved = new Date();
      }
    }, this.offlineConfig.autoSaveInterval);

    this.autoSaveTimers.set(dataId, timer);
  }

  private async syncOfflineData(): Promise<void> {
    const dirtyData = Array.from(this.offlineStorage.values()).filter((data) => data.isDirty);

    for (const data of dirtyData) {
      try {
        await this.syncDataToServer(data);
        data.isDirty = false;
        data.lastSaved = new Date();
      } catch (error) {
        logger.warning(`Failed to sync offline data ${data.id}:`, { error: String(error) });
      }
    }

    this.persistOfflineData();
  }

  private async syncDataToServer(data: OfflineData): Promise<void> {
    // Implementation depends on the data type
    switch (data.type) {
      case 'form':
        await apiClient.post('/api/forms/sync', data);
        break;
      case 'upload':
        // Handle file uploads with FormData
        if (data.data && typeof data.data === 'object' && 'file' in data.data) {
          const formData = new FormData();
          const uploadData = data.data as { file: File; metadata?: Record<string, any> };
          formData.append('file', uploadData.file);
          if (uploadData.metadata) {
            formData.append('metadata', JSON.stringify(uploadData.metadata));
          }
          if (data.projectId) {
            formData.append('projectId', data.projectId);
          }
          await apiClient.post('/api/uploads/sync', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          // Fallback for non-file upload data
          await apiClient.post('/api/uploads/sync', data);
        }
        break;
      case 'reconciliation':
        await apiClient.post('/api/reconciliation/sync', data);
        break;
      case 'workflow':
        await apiClient.post('/api/workflows/sync', data);
        break;
      case 'settings':
        await apiClient.post('/api/settings/sync', data);
        break;
    }
  }
}

export const dataService = DataService.getInstance();
