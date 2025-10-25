import React, { forwardRef } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

export interface FormFieldProps {
  label: string
  error?: string
  success?: string
  required?: boolean
  helpText?: string
  children: React.ReactNode
  className?: string
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, success, required, helpText, children, className = '' }, ref) => {
    const fieldId = React.useId()
    const errorId = `${fieldId}-error`
    const helpId = `${fieldId}-help`

    return (
      <div ref={ref} className={`space-y-2 ${className}`}>
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
        
        <div className="relative">
          {React.cloneElement(children as React.ReactElement, {
            id: fieldId,
            'aria-describedby': [
              error ? errorId : '',
              helpText ? helpId : '',
            ].filter(Boolean).join(' ') || undefined,
            'aria-invalid': error ? 'true' : 'false',
            className: `${
              error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : success 
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            } ${(children as React.ReactElement).props.className || ''}`
          })}
          
          {/* Status Icons */}
          {error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
          )}
          {success && !error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Help Text */}
        {helpText && (
          <p id={helpId} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && !error && (
          <p className="text-sm text-green-600">
            {success}
          </p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
