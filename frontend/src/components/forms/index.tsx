// UNIFIED FORM SYSTEM - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { useState, useRef, useCallback, forwardRef } from 'react';
import { Upload } from 'lucide-react';
import { X } from 'lucide-react';
import { File } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Search } from 'lucide-react';

// ============================================================================
// FORM TYPES AND INTERFACES
// ============================================================================

// Form field value types
export type FormFieldValue = string | number | boolean | Date | File | null | undefined;

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: FormFieldValue) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface FormData {
  [key: string]: FormFieldValue;
}

export interface FormErrors {
  [key: string]: string;
}

export interface UseFormOptions<T extends FormData = FormData> {
  initialValues?: T;
  validationRules?: ValidationRules;
  onSubmit?: (values: T) => void | Promise<void>;
}

export interface UseFormReturn<T extends FormData = FormData> {
  values: T;
  errors: FormErrors;
  touched: { [key: string]: boolean };
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (name: string, value: FormFieldValue) => void;
  setError: (name: string, error: string) => void;
  clearError: (name: string) => void;
  handleChange: (name: string, value: FormFieldValue) => void;
  handleBlur: (name: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  reset: () => void;
}

export interface FormFieldProps {
  label?: string;
  error?: string;
  success?: boolean;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export interface InputFieldProps {
  name: string;
  type?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  onBlur?: () => void;
}

export interface FileUploadProps {
  name: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (files: FileList | null) => void;
  value?: FileList | null;
}

export interface SearchFilterProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export interface QuickFilterProps {
  filters: { [key: string]: string };
  onFilterChange: (key: string, value: string) => void;
  quickFilters: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
  className?: string;
}

// ============================================================================
// FORM HOOK - DEPRECATED: Use ../hooks/useForm.ts instead
// ============================================================================

/**
 * @deprecated This hook is duplicated. Please use useForm from '../hooks/useForm.ts' instead.
 * This export will be removed in the next version.
 *
 * Migration guide:
 * - Old: import { useForm } from '@/components/forms'
 * - New: import { useForm } from '@/hooks/useForm'
 *
 * The API remains the same for backward compatibility.
 */
export { useForm } from '../hooks/useForm';

// ============================================================================
// FORM COMPONENTS
// ============================================================================

export interface FormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export const Form: React.FC<FormProps> = ({ onSubmit, children, className = '' }) => {
  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      {children}
    </form>
  );
};

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, success, required, helpText, children, className = '' }, ref) => {
    const fieldId = React.useId();

    return (
      <div ref={ref} className={`space-y-1 ${className}`}>
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {React.isValidElement(children) &&
            React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
              id: fieldId,
              ...(children.props as React.HTMLAttributes<HTMLElement>)
            } as React.HTMLAttributes<HTMLElement>)
          }
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </p>
        )}

        {success && !error && (
          <p className="text-sm text-green-600 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            Success
          </p>
        )}

        {helpText && !error && <p className="text-sm text-gray-500">{helpText}</p>}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export const InputField: React.FC<InputFieldProps> = ({
  name,
  type = 'text',
  label,
  placeholder,
  error,
  required,
  disabled,
  className = '',
  value,
  onChange,
  onBlur,
}) => {
  return (
    <FormField label={label} error={error} required={required}>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${className}`}
      />
    </FormField>
  );
};

export const FileUpload: React.FC<FileUploadProps> = ({
  name,
  label,
  accept,
  multiple,
  maxSize,
  error,
  required,
  disabled,
  className = '',
  onChange,
  value,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onChange?.(files);
      }
    },
    [onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      onChange?.(files);
    },
    [onChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      if (value && value.length > 0) {
        const dt = new DataTransfer();
        for (let i = 0; i < value.length; i++) {
          if (i !== index) {
            dt.items.add(value[i]);
          }
        }
        onChange?.(dt.files);
      }
    },
    [value, onChange]
  );

  const fieldId = React.useId();
  const dropzoneId = `${fieldId}-dropzone`;

  return (
    <FormField label={label} error={error} required={required} className={className}>
      <div
        id={dropzoneId}
        role="button"
        tabIndex={0}
        aria-label={label || 'File upload area'}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${error ? 'border-red-300' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">Drop files here or click to browse</p>
        {accept && <p className="text-xs text-gray-500 mt-1">Accepted: {accept}</p>}
        {maxSize && (
          <p className="text-xs text-gray-500">Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        id={fieldId}
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        aria-label={label || 'File input'}
      />

      {value && value.length > 0 && (
        <div className="mt-4 space-y-2">
          {Array.from(value).map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <File className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({(file.size / 1024).toFixed(1)}KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </FormField>
  );
};

export const SearchFilter: React.FC<SearchFilterProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
};

export const QuickFilter: React.FC<QuickFilterProps> = ({
  filters,
  onFilterChange,
  quickFilters,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {quickFilters.map((filter) => (
        <div key={filter.key} className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{filter.label}:</span>
          <select
            value={filters[filter.key] || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  Form,
  FormField,
  InputField,
  FileUpload,
  SearchFilter,
  QuickFilter,
  useForm,
};
