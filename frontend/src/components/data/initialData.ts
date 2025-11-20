// Initial Data State
import { CrossPageData } from './types';

export const createInitialCrossPageData = (): CrossPageData => ({
  ingestion: {
    files: [],
    processedData: [],
    qualityMetrics: { completeness: 0, accuracy: 0, consistency: 0, validity: 0, overall: 0 },
    validationResults: { isValid: false, errors: [], warnings: [], suggestions: [] },
    lastUpdated: new Date(),
  },
  reconciliation: {
    records: [],
    matchingResults: [],
    discrepancies: [],
    qualityMetrics: { matchRate: 0, processingTime: 0, discrepancyRate: 0, autoMatchRate: 0 },
    lastUpdated: new Date(),
  },
  adjudication: {
    workflows: [],
    discrepancies: [],
    users: [],
    notifications: [],
    lastUpdated: new Date(),
  },
  analytics: {
    dashboards: [],
    reports: [],
    predictions: [],
    anomalies: [],
    lastUpdated: new Date(),
  },
  security: {
    policies: [],
    auditLogs: [],
    complianceStatus: {
      sox: {
        id: '',
        name: '',
        status: 'partial',
        requirements: [],
        lastAudit: new Date(),
        nextAudit: new Date(),
      },
      gdpr: {
        id: '',
        name: '',
        status: 'partial',
        requirements: [],
        lastAudit: new Date(),
        nextAudit: new Date(),
      },
      lastAudit: new Date(),
      nextAudit: new Date(),
    },
    encryptionConfigs: [],
    lastUpdated: new Date(),
  },
  api: {
    endpoints: [],
    webhooks: [],
    keys: [],
    integrations: [],
    lastUpdated: new Date(),
  },
});
