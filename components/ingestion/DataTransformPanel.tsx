// Data Transform Panel Component
import React, { useState } from 'react';
import { Wand2, Plus, Trash2, Play } from 'lucide-react';
import type { DataRow, FieldMapping } from '../../types/ingestion';

interface DataTransformPanelProps {
  data: DataRow[];
  mappings: FieldMapping[];
  onMappingsChange: (mappings: FieldMapping[]) => void;
  onTransform: (transformedData: DataRow[]) => void;
  className?: string;
}

export const DataTransformPanel: React.FC<DataTransformPanelProps> = ({
  data,
  mappings,
  onMappingsChange,
  onTransform,
  className = '',
}) => {
  const [previewData, setPreviewData] = useState<DataRow[]>([]);

  const applyTransformations = () => {
    const transformed = data.map((row) => {
      const newRow: DataRow = { ...row };
      mappings.forEach((mapping) => {
        if (mapping.sourceField && mapping.targetField) {
          const sourceValue = row[mapping.sourceField];
          if (mapping.transformation) {
            // Apply transformation
            newRow[mapping.targetField] = applyTransformation(
              sourceValue,
              mapping.transformation
            );
          } else {
            newRow[mapping.targetField] = sourceValue;
          }
        }
      });
      return newRow;
    });
    setPreviewData(transformed);
    onTransform(transformed);
  };

  const applyTransformation = (value: any, transformation: string): any => {
    switch (transformation) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'trim':
        return String(value).trim();
      case 'parseNumber':
        return parseFloat(String(value)) || 0;
      case 'parseDate':
        return new Date(value).toISOString().split('T')[0];
      default:
        return value;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Data Transformations
        </h3>
        <button
          onClick={applyTransformations}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Play className="w-4 h-4" />
          Apply Transformations
        </button>
      </div>

      <div className="space-y-3 mb-4">
        {mappings.map((mapping, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">{mapping.sourceField}</span>
            <span className="text-gray-500">→</span>
            <span className="text-sm font-medium">{mapping.targetField}</span>
            {mapping.transformation && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {mapping.transformation}
              </span>
            )}
          </div>
        ))}
      </div>

      {previewData.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            ✓ Transformed {previewData.length} records
          </p>
        </div>
      )}
    </div>
  );
};

