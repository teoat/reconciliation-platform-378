// Validation Results Component
import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import type { DataValidation } from '../../types/ingestion';

interface ValidationResultsProps {
  validations: DataValidation[];
  className?: string;
}

export const ValidationResults: React.FC<ValidationResultsProps> = ({
  validations,
  className = '',
}) => {
  const errors = validations.filter((v) => v.severity === 'error');
  const warnings = validations.filter((v) => v.severity === 'warning');
  const infos = validations.filter((v) => v.severity === 'info');
  const passed = validations.filter((v) => v.passed);

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Validation Results</h3>

      {validations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Info className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No validations performed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {errors.length > 0 && (
            <ValidationSection
              title="Errors"
              validations={errors}
              icon={AlertCircle}
              color="text-red-600"
              bgColor="bg-red-50"
            />
          )}
          {warnings.length > 0 && (
            <ValidationSection
              title="Warnings"
              validations={warnings}
              icon={AlertTriangle}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
            />
          )}
          {infos.length > 0 && (
            <ValidationSection
              title="Information"
              validations={infos}
              icon={Info}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
          )}
          {passed.length > 0 && (
            <ValidationSection
              title="Passed"
              validations={passed}
              icon={CheckCircle}
              color="text-green-600"
              bgColor="bg-green-50"
            />
          )}
        </div>
      )}
    </div>
  );
};

interface ValidationSectionProps {
  title: string;
  validations: DataValidation[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const ValidationSection: React.FC<ValidationSectionProps> = ({
  title,
  validations,
  icon: Icon,
  color,
  bgColor,
}) => {
  return (
    <div className={bgColor}>
      <div className="flex items-center gap-2 p-3 border-b">
        <Icon className={`w-5 h-5 ${color}`} />
        <h4 className={`font-semibold ${color}`}>
          {title} ({validations.length})
        </h4>
      </div>
      <div className="p-3 space-y-2">
        {validations.map((validation, index) => (
          <ValidationItem key={index} validation={validation} />
        ))}
      </div>
    </div>
  );
};

interface ValidationItemProps {
  validation: DataValidation;
}

const ValidationItem: React.FC<ValidationItemProps> = ({ validation }) => {
  return (
    <div className="flex items-start gap-3 p-2 bg-white rounded">
      <div className="flex-1">
        <div className="font-medium text-sm">{validation.field}</div>
        <div className="text-xs text-gray-600">{validation.rule}</div>
        <div className="text-sm text-gray-700 mt-1">{validation.message}</div>
      </div>
      <div className={`text-xs px-2 py-1 rounded ${
        validation.passed
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}>
        {validation.passed ? 'Pass' : 'Fail'}
      </div>
    </div>
  );
};

