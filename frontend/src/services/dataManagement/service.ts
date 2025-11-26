// Data Management Service
import { logger } from '@/services/logger';
import {
  ProjectData,
  IngestionData,
  ReconciliationData,
  CashflowData,
  ReconciliationRecord,
  ReconciliationSource,
  AuditEntry,
  RecordMetadata,
  ExpenseCategory,
  CashflowMetrics,
  DiscrepancyRecord,
  UploadedFile,
  DataQualityMetrics,
} from './types';
import { DataManagementUtils } from './utils';

export class DataManagementService {
  private static instance: DataManagementService;
  private projectData: Map<string, ProjectData> = new Map();
  private listeners: Map<string, Set<(data: ProjectData) => void>> = new Map();

  static getInstance(): DataManagementService {
    if (!DataManagementService.instance) {
      DataManagementService.instance = new DataManagementService();
    }
    return DataManagementService.instance;
  }

  // Project Management
  createProject(project: Partial<ProjectData>): ProjectData {
    const projectData: ProjectData = {
      id: project.id || `project_${Date.now()}`,
      name: project.name || 'New Project',
      description: project.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      ingestionData: {
        uploadedFiles: [],
        processedData: [],
        dataQuality: {
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          validity: 0,
          duplicates: 0,
          errors: 0,
        },
        mappings: [],
        validations: [],
        lastProcessed: new Date().toISOString(),
      },
      reconciliationData: {
        records: [],
        matchingRules: [],
        metrics: {
          totalRecords: 0,
          matchedRecords: 0,
          unmatchedRecords: 0,
          discrepancyRecords: 0,
          pendingRecords: 0,
          resolvedRecords: 0,
          escalatedRecords: 0,
          averageConfidence: 0,
          averageProcessingTime: 0,
          matchRate: 0,
          accuracy: 0,
          throughput: 0,
          errorRate: 0,
          slaCompliance: 0,
        },
        auditTrail: [],
        lastReconciled: new Date().toISOString(),
      },
      cashflowData: {
        categories: [],
        metrics: {
          totalReportedExpenses: 0,
          totalCashflowExpenses: 0,
          totalDiscrepancy: 0,
          discrepancyPercentage: 0,
          balancedCategories: 0,
          discrepancyCategories: 0,
          missingTransactions: 0,
          excessTransactions: 0,
          averageDiscrepancy: 0,
          largestDiscrepancy: 0,
          lastReconciliationDate: new Date().toISOString(),
          dataQualityScore: 0,
        },
        discrepancies: [],
        lastAnalyzed: new Date().toISOString(),
      },
      analytics: {
        performance: {
          matchRate: 0,
          accuracy: 0,
          processingTime: 0,
          throughput: 0,
          errorRate: 0,
          slaCompliance: 0,
        },
        trends: {
          period: 'daily',
          data: [],
        },
        patterns: {
          recurringPatterns: [],
          anomalies: [],
        },
        quality: {
          completeness: 0,
          accuracy: 0,
          consistency: 0,
          validity: 0,
          duplicates: 0,
          errors: 0,
        },
        efficiency: {
          automationRate: 0,
          manualInterventionRate: 0,
          averageResolutionTime: 0,
          costPerTransaction: 0,
        },
        predictions: {
          forecastAccuracy: 0,
          riskPredictions: [],
          recommendations: [],
        },
      },
      ...project,
    };

    this.projectData.set(projectData.id, projectData);
    this.notifyListeners(projectData.id, projectData);
    return projectData;
  }

  getProject(projectId: string): ProjectData | undefined {
    return this.projectData.get(projectId);
  }

  updateProject(projectId: string, updates: Partial<ProjectData>): ProjectData | null {
    const project = this.projectData.get(projectId);
    if (!project) return null;

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.projectData.set(projectId, updatedProject);
    this.notifyListeners(projectId, updatedProject);
    return updatedProject;
  }

  // Ingestion Data Management
  addIngestionData(projectId: string, ingestionData: Partial<IngestionData>): ProjectData | null {
    const project = this.projectData.get(projectId);
    if (!project) return null;

    const updatedProject = {
      ...project,
      ingestionData: {
        ...project.ingestionData,
        ...ingestionData,
        lastProcessed: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    this.projectData.set(projectId, updatedProject);
    this.notifyListeners(projectId, updatedProject);
    return updatedProject;
  }

  // Reconciliation Data Management
  addReconciliationData(
    projectId: string,
    reconciliationData: Partial<ReconciliationData>
  ): ProjectData | null {
    const project = this.projectData.get(projectId);
    if (!project) return null;

    const updatedProject = {
      ...project,
      reconciliationData: {
        ...project.reconciliationData,
        ...reconciliationData,
        lastReconciled: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    this.projectData.set(projectId, updatedProject);
    this.notifyListeners(projectId, updatedProject);
    return updatedProject;
  }

  // Cashflow Data Management
  addCashflowData(projectId: string, cashflowData: Partial<CashflowData>): ProjectData | null {
    const project = this.projectData.get(projectId);
    if (!project) return null;

    const updatedProject = {
      ...project,
      cashflowData: {
        ...project.cashflowData,
        ...cashflowData,
        lastAnalyzed: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    this.projectData.set(projectId, updatedProject);
    this.notifyListeners(projectId, updatedProject);
    return updatedProject;
  }

  // Data Transformation
  transformIngestionToReconciliation(projectId: string): ProjectData | null {
    const project = this.projectData.get(projectId);
    if (!project) return null;

    const { ingestionData } = project;
    const reconciliationRecords: ReconciliationRecord[] = [];

    // Transform processed data into reconciliation records
    ingestionData.processedData.forEach((record, index) => {
      const reconciliationRecord: ReconciliationRecord = {
        id: `rec_${record.id}`,
        reconciliationId: `REC-${Date.now()}-${index}`,
        batchId: `BATCH-${project.id}`,
        sources: [
          {
            id: `src_${record.id}`,
            systemId: record.sourceFile,
            systemName: record.fileType === 'expenses' ? 'Expense Journal' : 'Bank Statement',
            recordId: record.id,
            data: record.data,
            timestamp: record.processedAt,
            quality: record.quality,
            confidence: record.validated ? 95 : 75,
            metadata: {
              source: record.sourceFile,
              fileType: record.fileType,
              processedAt: record.processedAt,
            },
          },
        ],
        status: 'pending',
        confidence: record.validated ? 95 : 75,
        matchingRules: [],
        auditTrail: [
          {
            id: `audit_${record.id}`,
            userId: 'system',
            userName: 'System',
            action: 'Record Created',
            timestamp: record.processedAt,
            details: { source: record.sourceFile },
          },
        ],
        metadata: {
          createdAt: record.processedAt,
          updatedAt: record.processedAt,
          createdBy: 'system',
          updatedBy: 'system',
          version: 1,
          tags: [record.fileType],
          priority: 'medium',
        },
        relationships: [],
        matchScore: record.validated ? 95 : 75,
        riskLevel: record.errors.length > 0 ? 'high' : 'low',
      };

      reconciliationRecords.push(reconciliationRecord);
    });

    // Update project with reconciliation data
    const updatedProject = this.addReconciliationData(projectId, {
      records: reconciliationRecords,
      metrics: DataManagementUtils.calculateReconciliationMetrics(reconciliationRecords),
    });

    return updatedProject;
  }

  transformReconciliationToCashflow(projectId: string): ProjectData | null {
    const project = this.projectData.get(projectId);
    if (!project) return null;

    const { reconciliationData } = project;
    const expenseCategories: ExpenseCategory[] = [];
    const discrepancies: DiscrepancyRecord[] = [];

    // Group records by category and analyze discrepancies
    const categoryMap = new Map<string, ExpenseCategory>();

    reconciliationData.records.forEach((record) => {
      const amount =
        record.sources[0]?.data?.amount ||
        record.sources[0]?.data?.Kredit ||
        record.sources[0]?.data?.Debit ||
        0;
      const description =
        (record.sources[0]?.data as Record<string, unknown>)?.description as string ||
        (record.sources[0]?.data as Record<string, unknown>)?.Uraian as string ||
        'Unknown';
      const category = DataManagementUtils.inferCategory(description);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
          description: `Expenses related to ${category.toLowerCase()}`,
          color: DataManagementUtils.getCategoryColor(category),
          icon: DataManagementUtils.getCategoryIcon(category),
          totalReported: 0,
          totalCashflow: 0,
          discrepancy: 0,
          discrepancyPercentage: 0,
          transactionCount: 0,
          lastUpdated: new Date().toISOString(),
          status: 'balanced',
          subcategories: [],
        });
      }

      const categoryData = categoryMap.get(category)!;
      categoryData.totalReported += (amount as number) || 0;
      categoryData.transactionCount++;

      // Check for discrepancies
      if (record.status === 'discrepancy' && record.difference) {
        categoryData.discrepancy += record.difference;
        categoryData.status = 'discrepancy';

        discrepancies.push({
          id: `disc_${record.id}`,
          type: 'amount',
          severity: Math.abs(record.difference) > 1000000 ? 'high' : 'medium',
          description: `Amount discrepancy in ${description}`,
          sourceRecord: record.id,
          targetRecord: record.sources[0]?.recordId || '',
          difference: record.difference,
          confidence: record.confidence,
          status: 'open',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // Calculate metrics
    expenseCategories.push(...Array.from(categoryMap.values()));
    expenseCategories.forEach((category) => {
      category.totalCashflow = category.totalReported - category.discrepancy;
      category.discrepancyPercentage =
        category.totalReported > 0 ? (category.discrepancy / category.totalReported) * 100 : 0;
    });

    const cashflowMetrics = DataManagementUtils.calculateCashflowMetrics(
      expenseCategories,
      discrepancies
    );

    // Update project with cashflow data
    const updatedProject = this.addCashflowData(projectId, {
      categories: expenseCategories,
      metrics: cashflowMetrics,
      discrepancies: discrepancies,
    });

    return updatedProject;
  }

  // Event System
  subscribe(projectId: string, callback: (data: ProjectData) => void): () => void {
    if (!this.listeners.has(projectId)) {
      this.listeners.set(projectId, new Set());
    }
    this.listeners.get(projectId)!.add(callback);

    return () => {
      const listeners = this.listeners.get(projectId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(projectId);
        }
      }
    };
  }

  private notifyListeners(projectId: string, data: ProjectData): void {
    const listeners = this.listeners.get(projectId);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // Data Export/Import
  exportProject(projectId: string): string {
    const project = this.projectData.get(projectId);
    return JSON.stringify(project, null, 2);
  }

  importProject(data: string): ProjectData | null {
    try {
      const project = JSON.parse(data) as ProjectData;
      this.projectData.set(project.id, project);
      this.notifyListeners(project.id, project);
      return project;
    } catch (error) {
      logger.error('Failed to import project:', error);
      return null;
    }
  }
}

export default DataManagementService;
