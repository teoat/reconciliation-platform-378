'use client';

import React from 'react';

// Stub components for ingestion workflow
// These are placeholders until the full components are migrated

export const DataQualityPanel: React.FC<{ data?: unknown[]; className?: string }> = ({
  data = [],
  className = '',
}) => (
  <div className={`data-quality-panel p-4 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-2">Data Quality</h3>
    <div className="text-sm text-gray-600">
      Records: {Array.isArray(data) ? data.length : 0}
    </div>
  </div>
);

export const ValidationResults: React.FC<{
  results?: { isValid: boolean; errors?: string[]; warnings?: string[] };
  className?: string;
}> = ({ results = { isValid: true, errors: [], warnings: [] }, className = '' }) => (
  <div className={`validation-results p-4 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-2">Validation Results</h3>
    <div className={`text-sm ${results.isValid ? 'text-green-600' : 'text-red-600'}`}>
      {results.isValid ? '✓ Valid' : '✗ Invalid'}
    </div>
    {results.errors && results.errors.length > 0 && (
      <ul className="text-sm text-red-500 mt-2">
        {results.errors.map((err, i) => (
          <li key={i}>{err}</li>
        ))}
      </ul>
    )}
  </div>
);

export const FileUploadZone: React.FC<{
  onUpload?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}> = ({ onUpload, accept = '*/*', multiple = true, className = '' }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && onUpload) {
      onUpload(Array.from(files));
    }
  };

  return (
    <div className={`file-upload-zone p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors ${className}`}>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer text-gray-600 hover:text-blue-600"
      >
        <div className="text-4xl mb-2">📁</div>
        <div>Drop files here or click to upload</div>
      </label>
    </div>
  );
};

export const DataPreviewTable: React.FC<{
  data?: Record<string, unknown>[];
  columns?: string[];
  className?: string;
}> = ({ data = [], columns = [], className = '' }) => {
  const displayColumns = columns.length > 0 ? columns : data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className={`data-preview-table overflow-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {displayColumns.map((col) => (
              <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.slice(0, 10).map((row, i) => (
            <tr key={i}>
              {displayColumns.map((col) => (
                <td key={col} className="px-4 py-2 text-sm text-gray-900">
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 10 && (
        <div className="text-sm text-gray-500 p-2">
          Showing 10 of {data.length} rows
        </div>
      )}
    </div>
  );
};

export const FieldMappingEditor: React.FC<{
  sourceFields?: string[];
  targetFields?: string[];
  mappings?: Record<string, string>;
  onMappingChange?: (mappings: Record<string, string>) => void;
  className?: string;
}> = ({ sourceFields = [], targetFields = [], mappings = {}, onMappingChange, className = '' }) => (
  <div className={`field-mapping-editor p-4 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-4">Field Mapping</h3>
    {sourceFields.map((field) => (
      <div key={field} className="flex items-center gap-4 mb-2">
        <span className="w-1/3 text-sm">{field}</span>
        <span>→</span>
        <select
          className="w-1/3 p-2 border rounded"
          value={mappings[field] || ''}
          onChange={(e) => onMappingChange?.({ ...mappings, [field]: e.target.value })}
        >
          <option value="">Select target field</option>
          {targetFields.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    ))}
  </div>
);

export const DataTransformPanel: React.FC<{
  transforms?: { id: string; name: string; enabled: boolean }[];
  onTransformToggle?: (id: string, enabled: boolean) => void;
  className?: string;
}> = ({ transforms = [], onTransformToggle, className = '' }) => (
  <div className={`data-transform-panel p-4 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-4">Data Transformations</h3>
    {transforms.map((t) => (
      <div key={t.id} className="flex items-center justify-between mb-2">
        <span className="text-sm">{t.name}</span>
        <input
          type="checkbox"
          checked={t.enabled}
          onChange={(e) => onTransformToggle?.(t.id, e.target.checked)}
          className="h-4 w-4"
        />
      </div>
    ))}
    {transforms.length === 0 && (
      <div className="text-sm text-gray-500">No transformations available</div>
    )}
  </div>
);
