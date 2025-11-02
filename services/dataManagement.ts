// Centralized Data Management System for Reconciliation App
// This service manages data flow between Ingestion, Reconciliation, and Cashflow Evaluation pages

export const createProjectData = (
  id,
  name,
  description,
  createdAt,
  updatedAt,
  status,
  ingestionData,
  reconciliationData,
  cashflowData,
  analytics
) => ({
  id,
  name,
  description,
  createdAt,
  updatedAt,
  status,
  ingestionData,
  reconciliationData,
  cashflowData,
  analytics,
});

export const createIngestionData = (
  uploadedFiles,
  processedData,
  dataQuality,
  mappings,
  validations,
  lastProcessed
) => ({
  uploadedFiles,
  processedData,
  dataQuality,
  mappings,
  validations,
  lastProcessed,
});

export const createReconciliationData = (
  records,
  matchingRules,
  metrics,
  auditTrail,
  lastReconciled
) => ({
  records,
  matchingRules,
  metrics,
  auditTrail,
  lastReconciled,
});

export const createCashflowData = (categories, metrics, discrepancies, lastAnalyzed) => ({
  categories,
  metrics,
  discrepancies,
  lastAnalyzed,
});

export const createProcessedRecord = (
  id,
  sourceFile,
  fileType,
  data,
  quality,
  processedAt,
  validated,
  errors
) => ({
  id,
  sourceFile,
  fileType,
  data,
  quality,
  processedAt,
  validated,
  errors,
});

export const createReconciliationRecord = (
  id,
  reconciliationId,
  batchId,
  sources,
  status,
  confidence,
  matchingRules,
  auditTrail,
  metadata,
  relationships,
  resolution,
  matchScore,
  difference,
  riskLevel
) => ({
  id,
  reconciliationId,
  batchId,
  sources,
  status,
  confidence,
  matchingRules,
  auditTrail,
  metadata,
  relationships,
  resolution,
  matchScore,
  difference,
  riskLevel,
});

export const createReconciliationSource = (
  id,
  systemId,
  systemName,
  recordId,
  data,
  timestamp,
  quality,
  confidence,
  metadata
) => ({
  id,
  systemId,
  systemName,
  recordId,
  data,
  timestamp,
  quality,
  confidence,
  metadata,
});

export const createMatchingRule = (
  id,
  name,
  type,
  criteria,
  weight,
  applied,
  result,
  confidence
) => ({
  id,
  name,
  type,
  criteria,
  weight,
  applied,
  result,
  confidence,
});

export const createMatchingCriteria = (field, operator, value, tolerance, weight) => ({
  field,
  operator,
  value,
  tolerance,
  weight,
});

export const createMatchingResult = (matched, confidence, reason, details) => ({
  matched,
  confidence,
  reason,
  details,
});

export const createAuditEntry = (
  id,
  userId,
  userName,
  action,
  timestamp,
  details,
  previousValue,
  newValue,
  ipAddress,
  userAgent
) => ({
  id,
  userId,
  userName,
  action,
  timestamp,
  details,
  previousValue,
  newValue,
  ipAddress,
  userAgent,
});

export const createRecordMetadata = (
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  version,
  tags,
  priority
) => ({
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  version,
  tags,
  priority,
});

export const createRecordRelationship = (id, type, targetRecordId, confidence, reason) => ({
  id,
  type,
  targetRecordId,
  confidence,
  reason,
});

export const createResolution = (
  id,
  type,
  status,
  assignedTo,
  assignedBy,
  assignedAt,
  resolvedAt,
  resolution,
  comments,
  attachments
) => ({
  id,
  type,
  status,
  assignedTo,
  assignedBy,
  assignedAt,
  resolvedAt,
  resolution,
  comments,
  attachments,
});

export const createReconciliationMetrics = (
  totalRecords,
  matchedRecords,
  unmatchedRecords,
  discrepancyRecords,
  pendingRecords,
  resolvedRecords,
  escalatedRecords,
  averageConfidence,
  averageProcessingTime,
  matchRate,
  accuracy,
  throughput,
  errorRate,
  slaCompliance
) => ({
  totalRecords,
  matchedRecords,
  unmatchedRecords,
  discrepancyRecords,
  pendingRecords,
  resolvedRecords,
  escalatedRecords,
  averageConfidence,
  averageProcessingTime,
  matchRate,
  accuracy,
  throughput,
  errorRate,
  slaCompliance,
});

export const createExpenseCategory = (
  id,
  name,
  description,
  color,
  icon,
  totalReported,
  totalCashflow,
  discrepancy,
  discrepancyPercentage,
  transactionCount,
  lastUpdated,
  status,
  subcategories
) => ({
  id,
  name,
  description,
  color,
  icon,
  totalReported,
  totalCashflow,
  discrepancy,
  discrepancyPercentage,
  transactionCount,
  lastUpdated,
  status,
  subcategories,
});

export const createExpenseSubcategory = (
  id,
  name,
  reportedAmount,
  cashflowAmount,
  discrepancy,
  transactions
) => ({
  id,
  name,
  reportedAmount,
  cashflowAmount,
  discrepancy,
  transactions,
});

export const createExpenseTransaction = (
  id,
  date,
  description,
  reportedAmount,
  cashflowAmount,
  discrepancy,
  source,
  status,
  reference,
  category,
  subcategory
) => ({
  id,
  date,
  description,
  reportedAmount,
  cashflowAmount,
  discrepancy,
  source,
  status,
  reference,
  category,
  subcategory,
});

export const createCashflowMetrics = (
  totalReportedExpenses,
  totalCashflowExpenses,
  totalDiscrepancy,
  discrepancyPercentage,
  balancedCategories,
  discrepancyCategories,
  missingTransactions,
  excessTransactions,
  averageDiscrepancy,
  largestDiscrepancy,
  lastReconciliationDate,
  dataQualityScore
) => ({
  totalReportedExpenses,
  totalCashflowExpenses,
  totalDiscrepancy,
  discrepancyPercentage,
  balancedCategories,
  discrepancyCategories,
  missingTransactions,
  excessTransactions,
  averageDiscrepancy,
  largestDiscrepancy,
  lastReconciliationDate,
  dataQualityScore,
});

export const createDiscrepancyRecord = (
  id,
  type,
  severity,
  description,
  sourceRecord,
  targetRecord,
  difference,
  confidence,
  status,
  assignedTo,
  createdAt,
  updatedAt,
  resolution
) => ({
  id,
  type,
  severity,
  description,
  sourceRecord,
  targetRecord,
  difference,
  confidence,
  status,
  assignedTo,
  createdAt,
  updatedAt,
  resolution,
});

export const createProjectAnalytics = (
  performance,
  trends,
  patterns,
  quality,
  efficiency,
  predictions
) => ({
  performance,
  trends,
  patterns,
  quality,
  efficiency,
  predictions,
});

export const createPerformanceMetrics = (
  matchRate,
  accuracy,
  processingTime,
  throughput,
  errorRate,
  slaCompliance
) => ({
  matchRate,
  accuracy,
  processingTime,
  throughput,
  errorRate,
  slaCompliance,
});

export const createTrendAnalysis = (period, data) => ({
  period,
  data,
});

export const createPatternAnalysis = (recurringPatterns, anomalies) => ({
  recurringPatterns,
  anomalies,
});

export const createQualityMetrics = (
  completeness,
  accuracy,
  consistency,
  validity,
  duplicates,
  errors
) => ({
  completeness,
  accuracy,
  consistency,
  validity,
  duplicates,
  errors,
});

export const createEfficiencyMetrics = (
  automationRate,
  manualInterventionRate,
  averageResolutionTime,
  costPerTransaction
) => ({
  automationRate,
  manualInterventionRate,
  averageResolutionTime,
  costPerTransaction,
});

export const createPredictiveAnalytics = (forecastAccuracy, riskPredictions, recommendations) => ({
  forecastAccuracy,
  riskPredictions,
  recommendations,
});

// Legacy interfaces for compatibility
export const createUploadedFile = (
  id,
  name,
  size,
  type,
  status,
  progress,
  records,
  data,
  columns,
  fileType,
  qualityMetrics,
  validations,
  mappings,
  cleanedData,
  originalData,
  extractedContent,
  chatMessages,
  contractAnalysis,
  previewUrl,
  thumbnailUrl
) => ({
  id,
  name,
  size,
  type,
  status,
  progress,
  records,
  data,
  columns,
  fileType,
  qualityMetrics,
  validations,
  mappings,
  cleanedData,
  originalData,
  extractedContent,
  chatMessages,
  contractAnalysis,
  previewUrl,
  thumbnailUrl,
});

export const createDataQualityMetrics = (
  completeness,
  accuracy,
  consistency,
  validity,
  duplicates,
  errors
) => ({
  completeness,
  accuracy,
  consistency,
  validity,
  duplicates,
  errors,
});

export const createFieldMapping = (
  sourceField,
  targetField,
  transformation,
  validation,
  isRequired
) => ({
  sourceField,
  targetField,
  transformation,
  validation,
  isRequired,
});

export const createDataValidation = (field, rule, passed, message, severity) => ({
  field,
  rule,
  passed,
  message,
  severity,
});

export const createColumnInfo = (name, type, nullable, unique, sampleValues, statistics) => ({
  name,
  type,
  nullable,
  unique,
  sampleValues,
  statistics,
});

export const createExtractedContent = (
  text,
  metadata,
  entities,
  summary,
  keyTerms,
  sentiment,
  language,
  pages,
  duration,
  resolution,
  format,
  exif,
  videoMetadata,
  fileSize,
  creationDate,
  modificationDate,
  mimeType,
  checksum
) => ({
  text,
  metadata,
  entities,
  summary,
  keyTerms,
  sentiment,
  language,
  pages,
  duration,
  resolution,
  format,
  exif,
  videoMetadata,
  fileSize,
  creationDate,
  modificationDate,
  mimeType,
  checksum,
});

export const createChatMessage = (timestamp, sender, content, type) => ({
  timestamp,
  sender,
  content,
  type,
});

export const createContractAnalysis = (parties, keyTerms, clauses) => ({
  parties,
  keyTerms,
  clauses,
});

// Data Management Service
class DataManagementService {
  static instance;
  projectData = new Map();
  listeners = new Map();

  static getInstance() {
    if (!DataManagementService.instance) {
      DataManagementService.instance = new DataManagementService();
    }
    return DataManagementService.instance;
  }

  // Project Management
  createProject(project) {
    const projectData = {
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

  getProject(projectId) {
    return this.projectData.get(projectId);
  }

  updateProject(projectId, updates) {
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
  addIngestionData(projectId, ingestionData) {
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
  addReconciliationData(projectId, reconciliationData) {
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
  addCashflowData(projectId, cashflowData) {
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
  transformIngestionToReconciliation(projectId) {
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
      metrics: this.calculateReconciliationMetrics(reconciliationRecords),
    });

    return updatedProject;
  }

  transformReconciliationToCashflow(projectId) {
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
        record.sources[0]?.data?.description || record.sources[0]?.data?.Uraian || 'Unknown';
      const category = this.inferCategory(description);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          id: category.toLowerCase().replace(/\s+/g, '-'),
          name: category,
          description: `Expenses related to ${category.toLowerCase()}`,
          color: this.getCategoryColor(category),
          icon: this.getCategoryIcon(category),
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
      categoryData.totalReported += amount;
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

    const cashflowMetrics: CashflowMetrics = {
      totalReportedExpenses: expenseCategories.reduce((sum, cat) => sum + cat.totalReported, 0),
      totalCashflowExpenses: expenseCategories.reduce((sum, cat) => sum + cat.totalCashflow, 0),
      totalDiscrepancy: expenseCategories.reduce((sum, cat) => sum + cat.discrepancy, 0),
      discrepancyPercentage: 0,
      balancedCategories: expenseCategories.filter((cat) => cat.status === 'balanced').length,
      discrepancyCategories: expenseCategories.filter((cat) => cat.status === 'discrepancy').length,
      missingTransactions: discrepancies.filter((d) => d.type === 'missing').length,
      excessTransactions: discrepancies.filter((d) => d.type === 'amount' && d.difference > 0)
        .length,
      averageDiscrepancy: 0,
      largestDiscrepancy: Math.max(...expenseCategories.map((cat) => Math.abs(cat.discrepancy))),
      lastReconciliationDate: new Date().toISOString(),
      dataQualityScore: 95.5,
    };

    cashflowMetrics.discrepancyPercentage =
      cashflowMetrics.totalReportedExpenses > 0
        ? (cashflowMetrics.totalDiscrepancy / cashflowMetrics.totalReportedExpenses) * 100
        : 0;
    cashflowMetrics.averageDiscrepancy =
      expenseCategories.length > 0
        ? cashflowMetrics.totalDiscrepancy / expenseCategories.length
        : 0;

    // Update project with cashflow data
    const updatedProject = this.addCashflowData(projectId, {
      categories: expenseCategories,
      metrics: cashflowMetrics,
      discrepancies: discrepancies,
    });

    return updatedProject;
  }

  // Helper Methods
  calculateReconciliationMetrics(records) {
    const totalRecords = records.length;
    const matchedRecords = records.filter((r) => r.status === 'matched').length;
    const unmatchedRecords = records.filter((r) => r.status === 'unmatched').length;
    const discrepancyRecords = records.filter((r) => r.status === 'discrepancy').length;
    const pendingRecords = records.filter((r) => r.status === 'pending').length;
    const resolvedRecords = records.filter((r) => r.status === 'resolved').length;
    const escalatedRecords = records.filter((r) => r.status === 'escalated').length;

    return {
      totalRecords,
      matchedRecords,
      unmatchedRecords,
      discrepancyRecords,
      pendingRecords,
      resolvedRecords,
      escalatedRecords,
      averageConfidence: records.reduce((sum, r) => sum + r.confidence, 0) / totalRecords,
      averageProcessingTime: 2.5,
      matchRate: totalRecords > 0 ? (matchedRecords / totalRecords) * 100 : 0,
      accuracy: 96.5,
      throughput: 150,
      errorRate: 2.1,
      slaCompliance: 98.5,
    };
  }

  inferCategory(description) {
    const desc = description.toLowerCase();
    if (desc.includes('operasional') || desc.includes('lapangan') || desc.includes('kas'))
      return 'Operational';
    if (desc.includes('lelang') || desc.includes('tender') || desc.includes('proyek'))
      return 'Company';
    if (desc.includes('keluarga') || desc.includes('personal')) return 'Personal';
    if (desc.includes('pulsa') || desc.includes('emoney') || desc.includes('utility'))
      return 'Utilities';
    return 'Other';
  }

  getCategoryColor(category) {
    const colors: Record<string, string> = {
      Operational: 'blue',
      Company: 'green',
      Personal: 'purple',
      Utilities: 'orange',
      Other: 'gray',
    };
    return colors[category] || 'gray';
  }

  getCategoryIcon(category) {
    const icons: Record<string, string> = {
      Operational: 'Activity',
      Company: 'Building',
      Personal: 'User',
      Utilities: 'Wifi',
      Other: 'File',
    };
    return icons[category] || 'File';
  }

  // Event System
  subscribe(projectId, callback) {
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

  notifyListeners(projectId, data) {
    const listeners = this.listeners.get(projectId);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // Data Export/Import
  exportProject(projectId) {
    const project = this.projectData.get(projectId);
    return JSON.stringify(project, null, 2);
  }

  importProject(data) {
    try {
      const project = JSON.parse(data);
      this.projectData.set(project.id, project);
      this.notifyListeners(project.id, project);
      return project;
    } catch (error) {
      console.error('Failed to import project:', error);
      return null;
    }
  }
}

export default DataManagementService;
