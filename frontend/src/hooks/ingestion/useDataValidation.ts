// Data validation hook
import { useState, useCallback } from 'react';
import { validateData, validateField } from '../../utils/ingestion/validation';
import type { DataRow, DataValidation, UploadedFile } from '../../types/ingestion';

export const useDataValidation = () => {
  const [validations, setValidations] = useState<DataValidation[]>([]);

  const validate = useCallback(
    (data: DataRow[], fileType: UploadedFile['fileType']) => {
      const results = validateData(data, fileType);
      setValidations(results);
      return results;
    },
    []
  );

  const validateSingleField = useCallback(
    (field: string, value: any, rules: string[]) => {
      const result = validateField(field, value, rules);
      if (result) {
        setValidations((prev) => [...prev, result]);
      }
      return result;
    },
    []
  );

  const clearValidations = useCallback(() => {
    setValidations([]);
  }, []);

  const hasErrors = validations.some((v) => !v.passed && v.severity === 'error');
  const hasWarnings = validations.some((v) => !v.passed && v.severity === 'warning');

  return {
    validations,
    validate,
    validateSingleField,
    clearValidations,
    hasErrors,
    hasWarnings,
  };
};

