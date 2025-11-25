// Validation utilities for ingestion
import { UploadedFile, DataRow, ColumnInfo } from '../../types/ingestion';
import type { DataValidation } from '../../types/ingestion/index';

/**
 * Validates file type against allowed types
 */
export const validateFileType = (
  file: File,
  allowedTypes: string[] = ['.csv', '.xlsx', '.xls', '.json']
): boolean => {
  const fileName = file.name.toLowerCase();
  return allowedTypes.some((type) => fileName.endsWith(type));
};

/**
 * Validates file size against maximum size
 */
export const validateFileSize = (file: File, maxSizeMB: number = 50): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validates uploaded file data
 */
export const validateUploadedFile = (file: UploadedFile): DataValidation[] => {
  const validations: DataValidation[] = [];

  // Check if file has data
  if (!file.data || file.data.length === 0) {
    validations.push({
      field: 'data',
      rule: 'hasData',
      passed: false,
      message: 'File contains no data',
      severity: 'error',
    });
  }

  // Check if file has columns
  if (!file.columns || file.columns.length === 0) {
    validations.push({
      field: 'columns',
      rule: 'hasColumns',
      passed: false,
      message: 'File contains no column definitions',
      severity: 'error',
    });
  }

  // Check for minimum records
  if (file.data && file.data.length < 1) {
    validations.push({
      field: 'records',
      rule: 'minimumRecords',
      passed: false,
      message: 'File must contain at least 1 record',
      severity: 'warning',
    });
  }

  return validations;
};

/**
 * Validates data row against column definitions
 */
export const validateDataRow = (row: DataRow, columns: ColumnInfo[]): DataValidation[] => {
  const validations: DataValidation[] = [];

  columns.forEach((column) => {
    const value = row[column.name];

    // Check required fields
    if (column.nullable === false && (value === null || value === undefined || value === '')) {
      validations.push({
        field: column.name,
        rule: 'required',
        passed: false,
        message: `${column.name} is required`,
        severity: 'error',
      });
    }

    // Check data type
    if (value !== null && value !== undefined && value !== '') {
      const actualType = typeof value;
      let expectedType = 'string';

      switch (column.type) {
        case 'number':
        case 'currency':
          expectedType = 'number';
          break;
        case 'date':
          expectedType = 'string'; // Dates are typically strings in CSV
          break;
        case 'boolean':
          expectedType = 'boolean';
          break;
      }

      if (actualType !== expectedType) {
        validations.push({
          field: column.name,
          rule: 'dataType',
          passed: false,
          message: `${column.name} should be ${expectedType} but is ${actualType}`,
          severity: 'warning',
        });
      }
    }

    // Check uniqueness if required
    if (column.unique && value !== null && value !== undefined) {
      // This would need to be checked against all rows, so we'll skip for now
      // In a real implementation, this would check against the entire dataset
    }
  });

  return validations;
};

/**
 * Validates entire dataset
 */
export const validateDataset = (data: DataRow[], columns: ColumnInfo[]): DataValidation[] => {
  const validations: DataValidation[] = [];

  data.forEach((row, index) => {
    const rowValidations = validateDataRow(row, columns);
    rowValidations.forEach((validation) => {
      validations.push({
        ...validation,
        message: `Row ${index + 1}: ${validation.message}`,
      });
    });
  });

  return validations;
};

/**
 * Checks if all validations pass
 */
export const hasValidationErrors = (validations: DataValidation[]): boolean => {
  return validations.some((v) => v.severity === 'error' || v.status === 'failed');
};

/**
 * Gets validation summary
 */
export const getValidationSummary = (validations: DataValidation[]) => {
  return {
    total: validations.length,
    errors: validations.filter((v) => v.severity === 'error' || v.status === 'failed').length,
    warnings: validations.filter((v) => v.severity === 'warning').length,
    info: validations.filter((v) => v.severity === 'info').length,
  };
};
