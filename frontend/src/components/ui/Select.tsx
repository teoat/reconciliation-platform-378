import React from 'react';
import { ChevronDown } from 'lucide-react';
import { memo } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  fullWidth?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses =
    'block border rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none bg-white';
  const stateClasses = error
    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500';
  const widthClasses = fullWidth ? 'w-full' : '';

  const selectClasses = `${baseClasses} ${stateClasses} ${widthClasses} ${className}`.trim();

  const errorId = error ? `${selectId}-error` : undefined;
  const helperTextId = helperText ? `${selectId}-helper` : undefined;
  const describedBy = [errorId, helperTextId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={selectClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={props.required ? 'true' : undefined}
          aria-label={props['aria-label'] || (label ? undefined : 'Select')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <div
          className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
          aria-hidden="true"
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
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

export { Select };
export default memo(Select);
