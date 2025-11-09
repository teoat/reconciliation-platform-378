// UNIFIED FORM SYSTEM - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { useState, useRef, useCallback, forwardRef, useEffect } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react'

// ============================================================================
// FORM TYPES AND INTERFACES
// ============================================================================

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  custom?: (value: any) => string | null
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface FormData {
  [key: string]: any
}

export interface FormErrors {
  [key: string]: string
}

export interface UseFormOptions {
  initialValues?: FormData
  validationRules?: ValidationRules
  onSubmit?: (values: FormData) => void | Promise<void>
}

export interface UseFormReturn {
  values: FormData
  errors: FormErrors
  touched: { [key: string]: boolean }
  isSubmitting: boolean
  isValid: boolean
  setValue: (name: string, value: any) => void
  setError: (name: string, error: string) => void
  clearError: (name: string) => void
  handleChange: (name: string, value: any) => void
  handleBlur: (name: string) => void
  handleSubmit: (e: React.FormEvent) => void
  reset: () => void
}

export interface FormFieldProps {
  label?: string
  error?: string
  success?: boolean
  required?: boolean
  helpText?: string
  children: React.ReactNode
  className?: string
}

export interface InputFieldProps {
  name: string
  type?: string
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  value?: any
  onChange?: (value: any) => void
  onBlur?: () => void
}

export interface FileUploadProps {
  name: string
  label?: string
  accept?: string
  multiple?: boolean
  maxSize?: number
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  onChange?: (files: FileList | null) => void
  value?: FileList | null
}

export interface SearchFilterProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export interface QuickFilterProps {
  filters: { [key: string]: string }
  onFilterChange: (key: string, value: string) => void
  quickFilters: Array<{
    key: string
    label: string
    options: Array<{ value: string; label: string }>
  }>
  className?: string
}

// ============================================================================
// FORM HOOK
// ============================================================================

export function useForm(options: UseFormOptions = {}): UseFormReturn {
  const { initialValues = {}, validationRules = {}, onSubmit } = options

  const [values, setValues] = useState<FormData>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = validationRules[name]
    if (!rule) return null

    if (rule.required && (!value || value === '')) {
      return `${name} is required`
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      return `${name} must be at least ${rule.minLength} characters`
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      return `${name} must be no more than ${rule.maxLength} characters`
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      return `${name} format is invalid`
    }

    if (value && rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `${name} must be a valid email`
    }

    if (rule.custom) {
      return rule.custom(value)
    }

    return null
  }, [validationRules])

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validationRules, validateField])

  const setValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))

    // Clear error if field becomes valid
    const error = validateField(name, value)
    if (!error) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [validateField])

  const setError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const clearError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }, [])

  const handleChange = useCallback((name: string, value: any) => {
    setValue(name, value)
  }, [setValue])

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))

    // Validate field on blur
    const error = validateField(name, values[name])
    if (error) {
      setError(name, error)
    }
  }, [values, validateField, setError])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched: { [key: string]: boolean } = {}
    Object.keys(values).forEach(key => {
      allTouched[key] = true
    })
    setTouched(allTouched)

    // Validate all fields
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(values)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validateForm, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setError,
    clearError,
    handleChange,
    handleBlur,
    handleSubmit,
    reset
  }
}

// ============================================================================
// FORM COMPONENTS
// ============================================================================

export interface FormProps {
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
  className?: string
}

export const Form: React.FC<FormProps> = ({ onSubmit, children, className = '' }) => {
  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      {children}
    </form>
  )
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, success, required, helpText, children, className = '' }, ref) => {
    const fieldId = React.useId()

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
            React.cloneElement(children, {
              id: fieldId,
              ...children.props
            })
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

        {helpText && !error && (
          <p className="text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

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
  onBlur
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
  )
}

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
  value
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      onChange?.(files)
    }
  }, [onChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    onChange?.(files)
  }, [onChange])

  const removeFile = useCallback((index: number) => {
    if (value && value.length > 0) {
      const dt = new DataTransfer()
      for (let i = 0; i < value.length; i++) {
        if (i !== index) {
          dt.items.add(value[i])
        }
      }
      onChange?.(dt.files)
    }
  }, [value, onChange])

  return (
    <FormField label={label} error={error} required={required} className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${error ? 'border-red-300' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drop files here or click to browse
        </p>
        {accept && (
          <p className="text-xs text-gray-500 mt-1">
            Accepted: {accept}
          </p>
        )}
        {maxSize && (
          <p className="text-xs text-gray-500">
            Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
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
  )
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  className = ''
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
  )
}

export const QuickFilter: React.FC<QuickFilterProps> = ({
  filters,
  onFilterChange,
  quickFilters,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {quickFilters.map(filter => (
        <div key={filter.key} className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">{filter.label}:</span>
          <select
            value={filters[filter.key] || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            {filter.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

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
  useForm
}