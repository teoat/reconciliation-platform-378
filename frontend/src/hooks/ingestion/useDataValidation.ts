import { useState, useCallback, useEffect } from 'react';
import { DataValidation } from '../../types/ingestion';

interface DataRow {
  [key: string]: string | number | boolean | Date | null;
}
import { ColumnInfo } from '../../types/ingestion';
import { validateDataset, getValidationSummary } from '../../utils/ingestion/validation';

export interface DataValidationState {
  validations: DataValidation[];
  isValidating: boolean;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
  hasErrors: boolean;
}

export interface DataValidationActions {
  validateData: (data: DataRow[], columns: ColumnInfo[]) => Promise<void>;
  clearValidations: () => void;
  getValidationsByField: (field: string) => DataValidation[];
  getValidationsBySeverity: (severity: 'error' | 'warning' | 'info') => DataValidation[];
}

export const useDataValidation = () => {
  const [state, setState] = useState<DataValidationState>({
    validations: [],
    isValidating: false,
    summary: {
      total: 0,
      errors: 0,
      warnings: 0,
      info: 0,
    },
    hasErrors: false,
  });

  const validateData = useCallback(async (data: DataRow[], columns: ColumnInfo[]) => {
    setState((prev) => ({ ...prev, isValidating: true }));

    try {
      // Perform validation
      const validations = validateDataset(data, columns);
      const summary = getValidationSummary(validations);

      setState((prev) => ({
        ...prev,
        validations,
        summary,
        hasErrors: summary.errors > 0,
        isValidating: false,
      }) as DataValidationState);
    } catch (error) {
      setState(
        (prev) =>
          ({
            ...prev,
            isValidating: false,
            validations: [
              {
                field: 'system',
                rule: 'validation_error',
                status: 'failed',
                message: error instanceof Error ? error.message : 'Validation failed',
                severity: 'high' as const,
              },
            ],
            summary: { total: 1, errors: 1, warnings: 0, info: 0 },
            hasErrors: true,
          }) as any
      );
    }
  }, []);

  const clearValidations = useCallback(() => {
    setState({
      validations: [],
      isValidating: false,
      summary: {
        total: 0,
        errors: 0,
        warnings: 0,
        info: 0,
      },
      hasErrors: false,
    });
  }, []);

  const getValidationsByField = useCallback(
    (field: string) => {
      return state.validations.filter((v) => v.field === field);
    },
    [state.validations]
  );

  const getValidationsBySeverity = useCallback(
    (severity: 'error' | 'warning' | 'info') => {
      const severityMap = {
        error: 'high' as const,
        warning: 'medium' as const,
        info: 'low' as const,
      };
      return state.validations.filter((v) => v.severity === severityMap[severity]);
    },
    [state.validations]
  );

  const actions: DataValidationActions = {
    validateData,
    clearValidations,
    getValidationsByField,
    getValidationsBySeverity,
  };

  return {
    state,
    actions,
  };
};
