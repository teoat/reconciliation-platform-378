import React, { useState } from 'react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { FieldMapping, ColumnInfo } from '../../types/ingestion/index';

interface FieldMappingEditorProps {
  sourceColumns: ColumnInfo[];
  targetColumns: ColumnInfo[];
  mappings: FieldMapping[];
  onMappingsChange: (mappings: FieldMapping[]) => void;
  isLoading?: boolean;
}

export const FieldMappingEditor: React.FC<FieldMappingEditorProps> = ({
  sourceColumns,
  targetColumns,
  mappings,
  onMappingsChange,
  isLoading = false,
}) => {
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');

  const handleAddMapping = () => {
    if (!selectedSource || !selectedTarget) return;

    const newMapping: FieldMapping = {
      sourceField: selectedSource,
      targetField: selectedTarget,
      transformation: 'none' as const,
      isRequired: false,
    };

    onMappingsChange([...mappings, newMapping]);
    setSelectedSource('');
    setSelectedTarget('');
  };

  const handleRemoveMapping = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    onMappingsChange(newMappings);
  };

  const handleMappingChange = (index: number, updates: Partial<FieldMapping>) => {
    const newMappings = mappings.map((mapping, i) =>
      i === index ? { ...mapping, ...updates } : mapping
    );
    onMappingsChange(newMappings);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Field Mapping</h3>
        <p className="text-sm text-gray-600 mt-1">
          Map source fields to target fields for data transformation
        </p>
      </div>

      <div className="p-6">
        {/* Add New Mapping */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Mapping</h4>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="source-field-select" className="block text-xs font-medium text-gray-700 mb-1">Source Field</label>
              <select
                id="source-field-select"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select source field</option>
                {sourceColumns.map((column) => (
                  <option key={column.name} value={column.name}>
                    {column.name} ({column.type})
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-5 h-5 text-gray-400 mt-6" />

            <div className="flex-1">
              <label htmlFor="target-field-select" className="block text-xs font-medium text-gray-700 mb-1">Target Field</label>
              <select
                id="target-field-select"
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select target field</option>
                {targetColumns.map((column) => (
                  <option key={column.name} value={column.name}>
                    {column.name} ({column.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <button
                onClick={handleAddMapping}
                disabled={!selectedSource || !selectedTarget}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Existing Mappings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Current Mappings ({mappings.length})
          </h4>

          {mappings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No field mappings defined yet</div>
          ) : (
            mappings.map((mapping, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {mapping.sourceField}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">(source)</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-400" />

                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {mapping.targetField}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">(target)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={(e) =>
                            handleMappingChange(index, {})
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-600">Required</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveMapping(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Transformation */}
                <div className="mt-3">
                  <label htmlFor={`transformation-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                    Transformation (optional)
                  </label>
                  <input
                    id={`transformation-${index}`}
                    type="text"
                    value={mapping.transformation || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const validTransformation = ['trim', 'none', 'uppercase', 'lowercase', 'date_format'].includes(value)
                        ? value as 'trim' | 'none' | 'uppercase' | 'lowercase' | 'date_format'
                        : 'none' as const;
                      handleMappingChange(index, { transformation: validTransformation });
                    }}
                    placeholder="e.g., trim, uppercase, date_format"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
