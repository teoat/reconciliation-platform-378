import React, { useState } from 'react';
import { Play, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { DataRow, ColumnInfo, FieldMapping } from '../../types/ingestion';

interface DataTransformPanelProps {
  data: DataRow[];
  columns: ColumnInfo[];
  mappings: FieldMapping[];
  onTransformComplete: (transformedData: DataRow[]) => void;
  isLoading?: boolean;
}

export const DataTransformPanel: React.FC<DataTransformPanelProps> = ({
  data,
  columns,
  mappings,
  onTransformComplete,
  isLoading = false,
}) => {
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformProgress, setTransformProgress] = useState(0);
  const [transformResults, setTransformResults] = useState<{
    success: boolean;
    message: string;
    transformedRows: number;
    errors: number;
  } | null>(null);

  const handleTransform = async () => {
    setIsTransforming(true);
    setTransformProgress(0);
    setTransformResults(null);

    try {
      // Simulate transformation progress
      const progressInterval = setInterval(() => {
        setTransformProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Perform transformation
      const transformedData = await performTransformation(data, mappings);

      clearInterval(progressInterval);
      setTransformProgress(100);

      setTransformResults({
        success: true,
        message: 'Data transformation completed successfully',
        transformedRows: transformedData.length,
        errors: 0,
      });

      onTransformComplete(transformedData);
    } catch (error) {
      setTransformResults({
        success: false,
        message: error instanceof Error ? error.message : 'Transformation failed',
        transformedRows: 0,
        errors: 1,
      });
    } finally {
      setIsTransforming(false);
    }
  };

  const performTransformation = async (
    inputData: DataRow[],
    fieldMappings: FieldMapping[]
  ): Promise<DataRow[]> => {
    // Simulate async transformation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return inputData.map((row, index) => {
      const transformedRow: DataRow = { ...row, id: `transformed_${index}` };

      fieldMappings.forEach((mapping) => {
        if (row[mapping.sourceField] !== undefined) {
          let value = row[mapping.sourceField];

          // Apply transformation
          if (mapping.transformation) {
            value = applyTransformation(value, mapping.transformation);
          }

          transformedRow[mapping.targetField] = value as string | number | boolean | Date | null;
        }
      });

      return transformedRow;
    });
  };

  const applyTransformation = (
    value: unknown,
    transformation: string
  ): string | number | boolean | Date | null => {
    if (!value) return value as string | number | boolean | Date | null;

    const transformType = transformation.toLowerCase().trim();

    switch (transformType) {
      case 'trim':
        return String(value).trim();
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'capitalize':
        return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
      case 'number': {
        const num = Number(value);
        return isNaN(num) ? (value as string | number | boolean | Date | null) : num;
      }
      case 'date_format':
        // Simple date formatting - in real app would use a proper date library
        try {
          const date = new Date(value as string | number);
          return date.toISOString().split('T')[0];
        } catch {
          return value as string | number | boolean | Date | null;
        }
      default:
        return value as string | number | boolean | Date | null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Data Transformation</h3>
        <p className="text-sm text-gray-600 mt-1">
          Apply field mappings and transformations to your data
        </p>
      </div>

      <div className="p-6">
        {/* Transform Controls */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Ready to Transform</h4>
              <p className="text-sm text-gray-600">
                {data.length} rows • {mappings.length} mappings
              </p>
            </div>
            <button
              onClick={handleTransform}
              disabled={isTransforming || data.length === 0 || mappings.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{isTransforming ? 'Transforming...' : 'Start Transform'}</span>
            </button>
          </div>

          {/* Progress Bar */}
          {(isTransforming || transformProgress > 0) && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{transformProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${transformProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Transform Results */}
        {transformResults && (
          <div
            className={`p-4 rounded-lg border ${
              transformResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {transformResults.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    transformResults.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {transformResults.message}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {transformResults.transformedRows} rows processed
                  {transformResults.errors > 0 && ` • ${transformResults.errors} errors`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mapping Preview */}
        {mappings.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Field Mappings</h4>
            <div className="space-y-2">
              {mappings.map((mapping, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900">{mapping.sourceField}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm font-medium text-gray-900">{mapping.targetField}</span>
                  </div>
                  {mapping.transformation && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {mapping.transformation}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
