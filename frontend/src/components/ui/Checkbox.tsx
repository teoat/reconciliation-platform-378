import React from 'react';
import { memo } from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  const errorId = error ? `${checkboxId}-error` : undefined;
  const helperTextId = helperText ? `${checkboxId}-helper` : undefined;
  const describedBy = [errorId, helperTextId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={checkboxId}
            type="checkbox"
            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
              error ? 'border-red-300' : ''
            } ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-label={props['aria-label'] || (label ? undefined : 'Checkbox')}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3 text-sm">
            <label htmlFor={checkboxId} className="font-medium text-gray-700">
              {label}
              {props.required && (
                <span className="text-red-500 ml-1" aria-label="required">
                  *
                </span>
              )}
            </label>
          </div>
        )}
      </div>

      {error && errorId && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      {helperText && !error && helperTextId && (
        <p id={helperTextId} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export { Checkbox };
export default memo(Checkbox);
