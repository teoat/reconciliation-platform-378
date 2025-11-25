import { useState, useCallback } from 'react';
import { FieldMapping, ColumnInfo } from '../../types/ingestion';

export interface FieldMappingState {
  mappings: FieldMapping[];
  sourceColumns: ColumnInfo[];
  targetColumns: ColumnInfo[];
  isMapping: boolean;
  autoMapped: boolean;
}

export interface FieldMappingActions {
  setSourceColumns: (columns: ColumnInfo[]) => void;
  setTargetColumns: (columns: ColumnInfo[]) => void;
  addMapping: (sourceField: string, targetField: string) => void;
  removeMapping: (index: number) => void;
  updateMapping: (index: number, updates: Partial<FieldMapping>) => void;
  autoMapFields: () => void;
  clearMappings: () => void;
  validateMappings: () => { isValid: boolean; errors: string[] };
}

export const useFieldMapping = () => {
  const [state, setState] = useState<FieldMappingState>({
    mappings: [],
    sourceColumns: [],
    targetColumns: [],
    isMapping: false,
    autoMapped: false,
  });

  const setSourceColumns = useCallback((columns: ColumnInfo[]) => {
    setState((prev) => ({ ...prev, sourceColumns: columns }));
  }, []);

  const setTargetColumns = useCallback((columns: ColumnInfo[]) => {
    setState((prev) => ({ ...prev, targetColumns: columns }));
  }, []);

  const addMapping = useCallback(
    (sourceField: string, targetField: string) => {
      // Check if mapping already exists
      const existingIndex = state.mappings.findIndex(
        (m) => m.sourceField === sourceField || m.targetField === targetField
      );

      if (existingIndex >= 0) {
        // Update existing mapping
        const updatedMappings = [...state.mappings];
        updatedMappings[existingIndex] = {
          ...updatedMappings[existingIndex],
          sourceField,
          targetField,
        };
        setState((prev) => ({ ...prev, mappings: updatedMappings }));
      } else {
        // Add new mapping
        const newMapping: FieldMapping = {
          sourceField,
          targetField,
          transformation: 'none' as const,
        };
        setState((prev) => ({ ...prev, mappings: [...prev.mappings, newMapping] }));
      }
    },
    [state.mappings]
  );

  const removeMapping = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      mappings: prev.mappings.filter((_, i) => i !== index),
    }));
  }, []);

  const updateMapping = useCallback((index: number, updates: Partial<FieldMapping>) => {
    setState((prev) => ({
      ...prev,
      mappings: prev.mappings.map((mapping, i) =>
        i === index ? { ...mapping, ...updates } : mapping
      ),
    }));
  }, []);

  const autoMapFields = useCallback(() => {
    const newMappings: FieldMapping[] = [];

    // Simple auto-mapping based on field names
    state.sourceColumns.forEach((sourceCol) => {
      const targetCol = state.targetColumns.find(
        (targetCol) =>
          targetCol.name.toLowerCase() === sourceCol.name.toLowerCase() ||
          targetCol.name.toLowerCase().includes(sourceCol.name.toLowerCase()) ||
          sourceCol.name.toLowerCase().includes(targetCol.name.toLowerCase())
      );

      if (targetCol) {
        newMappings.push({
          sourceField: sourceCol.name,
          targetField: targetCol.name,
          transformation: getSuggestedTransformation(sourceCol, targetCol),
        });
      }
    });

    setState((prev) => ({
      ...prev,
      mappings: newMappings,
      autoMapped: true,
    }));
  }, [state.sourceColumns, state.targetColumns]);

  const clearMappings = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mappings: [],
      autoMapped: false,
    }));
  }, []);

  const validateMappings = useCallback(() => {
    const errors: string[] = [];
    const usedSourceFields = new Set<string>();
    const usedTargetFields = new Set<string>();

    state.mappings.forEach((mapping, index) => {
      // Check for duplicate source fields
      if (usedSourceFields.has(mapping.sourceField)) {
        errors.push(
          `Mapping ${index + 1}: Source field "${mapping.sourceField}" is used multiple times`
        );
      }
      usedSourceFields.add(mapping.sourceField);

      // Check for duplicate target fields
      if (usedTargetFields.has(mapping.targetField)) {
        errors.push(
          `Mapping ${index + 1}: Target field "${mapping.targetField}" is used multiple times`
        );
      }
      usedTargetFields.add(mapping.targetField);

      // Check if source field exists
      const sourceExists = state.sourceColumns.some((col) => col.name === mapping.sourceField);
      if (!sourceExists) {
        errors.push(`Mapping ${index + 1}: Source field "${mapping.sourceField}" does not exist`);
      }

      // Check if target field exists
      const targetExists = state.targetColumns.some((col) => col.name === mapping.targetField);
      if (!targetExists) {
        errors.push(`Mapping ${index + 1}: Target field "${mapping.targetField}" does not exist`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [state.mappings, state.sourceColumns, state.targetColumns]);

  const actions: FieldMappingActions = {
    setSourceColumns,
    setTargetColumns,
    addMapping,
    removeMapping,
    updateMapping,
    autoMapFields,
    clearMappings,
    validateMappings,
  };

  return {
    state,
    actions,
  };
};

// Helper function to suggest transformations based on column types
function getSuggestedTransformation(sourceCol: ColumnInfo, targetCol: ColumnInfo): 'none' | 'trim' | 'uppercase' | 'lowercase' | 'date_format' {
  // If types match, no transformation needed
  if (sourceCol.type === targetCol.type) {
    return 'none';
  }

  // Suggest transformations based on type differences
  if (sourceCol.type === 'string' && targetCol.type === 'date') {
    return 'date_format';
  }

  if (sourceCol.type === 'string') {
    return 'trim';
  }

  return 'none';
}
