// Data validation utilities for ingestion
import type { DataRow, DataValidation, UploadedFile } from '../../types/ingestion';

/**
 * Validates data based on file type and rules
 */
export const validateData = (
  data: DataRow[],
  fileType: UploadedFile['fileType']
): DataValidation[] => {
  const validations: DataValidation[] = [];

  if (data.length === 0) {
    validations.push({
      field: 'data',
      rule: 'Empty Data',
      passed: false,
      message: 'File contains no data',
      severity: 'error',
    });
    return validations;
  }

  // File type specific validations
  if (fileType === 'expenses' || fileType === 'bank_statement') {
    // Check for required fields
    const requiredFields = fileType === 'expenses' 
      ? ['date', 'amount', 'description']
      : ['date', 'amount'];

    requiredFields.forEach((field) => {
      const missingCount = data.filter((row) => !row[field] || row[field] === '').length;
      if (missingCount > 0) {
        validations.push({
          field,
          rule: 'Required Field',
          passed: missingCount === 0,
          message: `${missingCount} records missing ${field}`,
          severity: missingCount > data.length * 0.1 ? 'error' : 'warning',
        });
      }
    });

    // Validate amounts
    const invalidAmounts = data.filter((row) => {
      if (!row.amount) return true;
      const amount = typeof row.amount === 'number' ? row.amount : parseFloat(String(row.amount));
      return isNaN(amount) || amount <= 0;
    }).length;

    if (invalidAmounts > 0) {
      validations.push({
        field: 'amount',
        rule: 'Valid Amount',
        passed: invalidAmounts === 0,
        message: `${invalidAmounts} records have invalid amounts`,
        severity: 'error',
      });
    }

    // Validate dates
    const invalidDates = data.filter((row) => {
      if (!row.date) return true;
      const date = new Date(String(row.date));
      return isNaN(date.getTime());
    }).length;

    if (invalidDates > 0) {
      validations.push({
        field: 'date',
        rule: 'Valid Date',
        passed: invalidDates === 0,
        message: `${invalidDates} records have invalid dates`,
        severity: 'warning',
      });
    }
  }

  return validations;
};

/**
 * Validates a single field value
 */
export const validateField = (
  field: string,
  value: any,
  rules: string[]
): DataValidation | null => {
  for (const rule of rules) {
    switch (rule) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return {
            field,
            rule: 'required',
            passed: false,
            message: `${field} is required`,
            severity: 'error',
          };
        }
        break;
      case 'number':
        if (isNaN(Number(value))) {
          return {
            field,
            rule: 'number',
            passed: false,
            message: `${field} must be a number`,
            severity: 'error',
          };
        }
        break;
      case 'positive':
        if (Number(value) <= 0) {
          return {
            field,
            rule: 'positive',
            passed: false,
            message: `${field} must be positive`,
            severity: 'error',
          };
        }
        break;
    }
  }
  return null;
};
