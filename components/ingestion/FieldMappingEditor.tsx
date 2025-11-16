// Field Mapping Editor Component
import React, { useState } from 'react';
import { Settings, Plus, Trash2 } from 'lucide-react';
import type { FieldMapping } from '../../types/ingestion';

interface FieldMappingEditorProps {
  mappings: FieldMapping[];
  onMappingsChange: (mappings: FieldMapping[]) => void;
  availableFields: string[];
  className?: string;
}

export const FieldMappingEditor: React.FC<FieldMappingEditorProps> = ({
  mappings,
  onMappingsChange,
  availableFields,
  className = '',
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addMapping = () => {
    const newMapping: FieldMapping = {
      sourceField: '',
      targetField: '',
      isRequired: false,
    };
    onMappingsChange([...mappings, newMapping]);
    setEditingIndex(mappings.length);
  };

  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    const updated = mappings.map((m, i) => (i === index ? { ...m, ...updates } : m));
    onMappingsChange(updated);
  };

  const removeMapping = (index: number) => {
    onMappingsChange(mappings.filter((_, i) => i !== index));
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Field Mappings
        </h3>
        <button
          onClick={addMapping}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Mapping
        </button>
      </div>

      <div className="space-y-3">
        {mappings.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No mappings defined</p>
        ) : (
          mappings.map((mapping, index) => (
            <MappingRow
              key={index}
              mapping={mapping}
              availableFields={availableFields}
              onUpdate={(updates) => updateMapping(index, updates)}
              onRemove={() => removeMapping(index)}
              isEditing={editingIndex === index}
              onEdit={() => setEditingIndex(index)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface MappingRowProps {
  mapping: FieldMapping;
  availableFields: string[];
  onUpdate: (updates: Partial<FieldMapping>) => void;
  onRemove: () => void;
  isEditing: boolean;
  onEdit: () => void;
}

const MappingRow: React.FC<MappingRowProps> = ({
  mapping,
  availableFields,
  onUpdate,
  onRemove,
  isEditing,
  onEdit,
}) => {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <select
        value={mapping.sourceField}
        onChange={(e) => onUpdate({ sourceField: e.target.value })}
        className="flex-1 border rounded px-3 py-2"
        onFocus={onEdit}
      >
        <option value="">Select source field</option>
        {availableFields.map((field) => (
          <option key={field} value={field}>
            {field}
          </option>
        ))}
      </select>
      <span className="text-gray-500">→</span>
      <input
        type="text"
        value={mapping.targetField}
        onChange={(e) => onUpdate({ targetField: e.target.value })}
        placeholder="Target field"
        className="flex-1 border rounded px-3 py-2"
        onFocus={onEdit}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={mapping.isRequired}
          onChange={(e) => onUpdate({ isRequired: e.target.checked })}
        />
        <span className="text-sm">Required</span>
      </label>
      <button onClick={onRemove} className="p-2 text-red-600 hover:bg-red-50 rounded">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

