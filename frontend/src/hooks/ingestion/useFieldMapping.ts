// Field mapping hook
import { useState, useCallback } from 'react';
import type { FieldMapping, ColumnInfo } from '@/types/ingestion/index';

export const useFieldMapping = (columns: ColumnInfo[] = []) => {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);

  const addMapping = useCallback((mapping: FieldMapping) => {
    setMappings((prev) => [...prev, mapping]);
  }, []);

  const updateMapping = useCallback((index: number, updates: Partial<FieldMapping>) => {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, ...updates } : m)));
  }, []);

  const removeMapping = useCallback((index: number) => {
    setMappings((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearMappings = useCallback(() => {
    setMappings([]);
  }, []);

  const autoMap = useCallback(() => {
    // Simple auto-mapping based on column names
    const autoMappings: FieldMapping[] = columns.map((col) => ({
      sourceField: col.name,
      targetField: col.name.toLowerCase().replace(/\s+/g, '_'),
      isRequired: !col.nullable,
    }));
    setMappings(autoMappings);
  }, [columns]);

  const availableSourceFields = columns.map((col) => col.name);
  const mappedFields = new Set(mappings.map((m) => m.sourceField));
  const unmappedFields = availableSourceFields.filter((f) => !mappedFields.has(f));

  return {
    mappings,
    addMapping,
    updateMapping,
    removeMapping,
    clearMappings,
    autoMap,
    availableSourceFields,
    unmappedFields,
  };
};

