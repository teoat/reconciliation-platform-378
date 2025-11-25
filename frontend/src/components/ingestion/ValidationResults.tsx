import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { DataValidation } from '../../types/ingestion';

interface ValidationResultsProps {
  validations: DataValidation[];
  isLoading?: boolean;
}

export const ValidationResults: React.FC<ValidationResultsProps> = ({
  validations,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getSeverityFromStatus = (status: 'passed' | 'failed' | 'warning'): 'error' | 'warning' | 'info' => {
    if (status === 'failed') return 'error';
    if (status === 'warning') return 'warning';
    return 'info';
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          Validation Results ({validations.length})
        </h3>
      </div>
      <div className="p-6">
        {validations.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">All validations passed!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {validations.map((validation, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getSeverityColor(getSeverityFromStatus(validation.status))}`}
              >
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(getSeverityFromStatus(validation.status))}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{validation.field}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          validation.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : validation.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {validation.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{validation.message}</p>
                    {validation.rule && (
                      <p className="text-xs text-gray-500 mt-1">Rule: {validation.rule}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
