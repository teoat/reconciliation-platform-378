import React, { memo, useMemo, useCallback } from 'react';
import { Check, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = memo(
  ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    id,
    ...props
  }) => {
    // Memoize input ID generation
    const inputId = useMemo(() => id || `input-${Math.random().toString(36).substr(2, 9)}`, [id]);

    // Memoize class calculations
    const inputClasses = useMemo(() => {
      const baseClasses =
        'block border rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';
      const stateClasses = error
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500';
      const iconClasses = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';
      const widthClasses = fullWidth ? 'w-full' : '';

      return `${baseClasses} ${stateClasses} ${iconClasses} ${widthClasses} ${className}`.trim();
    }, [error, leftIcon, rightIcon, fullWidth, className]);

    // Memoize container classes
    const containerClasses = useMemo(() => (fullWidth ? 'w-full' : ''), [fullWidth]);

    // Memoize right icon logic
    const rightIconElement = useMemo(() => {
      if (error) {
        return <X className="w-4 h-4 text-red-500" />;
      }
      if (!error && props.value) {
        return <Check className="w-4 h-4 text-green-500" />;
      }
      return rightIcon;
    }, [error, props.value, rightIcon]);

    // Generate IDs for ARIA attributes
    const errorId = useMemo(() => (error ? `${inputId}-error` : undefined), [inputId, error]);
    const helperTextId = useMemo(
      () => (helperText ? `${inputId}-helper` : undefined),
      [inputId, helperText]
    );
    const describedBy = useMemo(() => {
      const ids = [errorId, helperTextId].filter(Boolean);
      return ids.length > 0 ? ids.join(' ') : undefined;
    }, [errorId, helperTextId]);

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              aria-hidden="true"
            >
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}

          <input
            id={inputId}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={props.required ? 'true' : undefined}
            aria-label={props['aria-label'] || (label ? undefined : 'Input')}
            {...props}
          />

          {rightIconElement && (
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
              aria-hidden="true"
            >
              <span className="text-gray-400">{rightIconElement}</span>
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
  }
);

export { Input };
export default Input;
