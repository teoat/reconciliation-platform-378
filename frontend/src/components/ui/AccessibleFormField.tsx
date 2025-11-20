/**
 * Accessible Form Field Component
 * Form field with full accessibility support
 */

import React from 'react';
import { getAccessibleLabel } from '../../utils/accessibility';

export interface AccessibleFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactElement;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  id,
  label,
  required = false,
  error,
  hint,
  children,
}) => {
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  const accessibleLabel = getAccessibleLabel(id, label, required);

  return (
    <div className="mb-4">
      <label id={labelId} htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-gray-500 mb-1">
          {hint}
        </p>
      )}
      {React.cloneElement(children, {
        id,
        'aria-labelledby': labelId,
        'aria-describedby': describedBy || undefined,
        'aria-required': required,
        'aria-invalid': !!error,
      })}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
