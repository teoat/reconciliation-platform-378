import type { ReconciliationRecord } from '@/types/reconciliation';
import type { DataQualityRecord, DataQualityField, IngestionFile } from '@/types/ingestion';
import type { DataRow } from '@/types/ingestion/index';

// Reconciliation Mocks
export const createMockReconciliationRecord = (overrides: Partial<ReconciliationRecord> = {}): ReconciliationRecord => ({
  id: 'test-id',
  reconciliationId: 'test-reconciliation-id',
  sourceARecordId: 'a-1',
  sourceBRecordId: 'b-1',
  status: 'unmatched',
  ...overrides,
});

// Ingestion Mocks
export const createMockField = (overrides: Partial<DataQualityField> = {}): DataQualityField => ({
  fieldName: 'testField',
  value: 'testValue',
  quality: 100,
  notes: [],
  ...overrides,
});

export const createMockDataQualityRecord = (overrides: Partial<DataQualityRecord> = {}): DataQualityRecord => ({
  id: 'record1',
  quality: 100,
  fields: [createMockField()],
  ...overrides,
});

export const createMockDataRow = (overrides: Partial<DataQualityRecord> = {}): DataRow => {
  const baseRecord = createMockDataQualityRecord(overrides);
  const dataRow: DataRow = { id: baseRecord.id };
  baseRecord.fields.forEach(field => {
    dataRow[field.fieldName] = field.value;
  });
  return dataRow;
};

export const createMockFile = (overrides: Partial<IngestionFile> = {}): IngestionFile => ({
  id: 'file1',
  name: 'test.csv',
  size: 1024,
  type: 'text/csv',
  status: 'uploaded',
  records: [createMockDataQualityRecord()],
  quality: 100,
  ...overrides,
});

// Workflow Sync Mocks
export const createMockStep = (id: string, status: string) => {
  return {
    id,
    name: `Step ${id}`,
    status,
    tasks: [],
  };
}

export const createMockWorkflowState = (steps: any[]): any => {
  return {
    step: 'initialization',
    progress: 0,
    data: {
      id: 'workflow-1',
      name: 'Test Workflow',
      steps,
      currentStepId: steps.length > 0 ? steps[0].id : null,
    },
  };
}