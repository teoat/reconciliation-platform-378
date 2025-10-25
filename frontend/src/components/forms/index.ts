// ============================================================================
// UNIFIED FORM SYSTEM - SINGLE SOURCE OF TRUTH
// ============================================================================

import React, { useState, useRef, useCallback, forwardRef, useEffect } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

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
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
  validateField: (name: string) => string | null
  validateForm: () => FormErrors
}

// ============================================================================
// FORM FIELD INTERFACES
// ============================================================================

export interface FormFieldProps {
  label: string
  error?: string
  success?: string
  required?: boolean
  helpText?: string
  children: React.ReactNode
  className?: string
}

export interface InputFieldProps {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
  placeholder?: string
  required?: boolean
  helpText?: string
  value?: string
  error?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  className?: string
  disabled?: boolean
  rows?: number
}

// ============================================================================
// FILE UPLOAD INTERFACES
// ============================================================================

export interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  onUpload?: (files: File[]) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
  label?: string
  helpText?: string
}

export interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

// ============================================================================
// SEARCH FILTER INTERFACES
// ============================================================================

export interface FilterOption {
  value: string
  label: string
}

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number'
  options?: FilterOption[]
  placeholder?: string
}

export interface SearchFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: { [key: string]: string }
  onFilterChange: (key: string, value: string) => void
  filterFields: FilterField[]
  onClearFilters?: () => void
  className?: string
  placeholder?: string
  showAdvanced?: boolean
}

export interface QuickFilterProps {
  filters: { [key: string]: string }
  onFilterChange: (key: string, value: string) => void
  className?: string
}

// ============================================================================
// FORM VALIDATION UTILITIES
// ============================================================================

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateField = (value: any, rules: ValidationRule): string | null => {
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required'
  }

  if (value && typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum length is ${rules.minLength} characters`
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength} characters`
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format'
    }

    if (rules.email && !validateEmail(value)) {
      return 'Invalid email address'
    }
  }

  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

// ============================================================================
// FORM HOOK
// ============================================================================

export const useForm = ({
  initialValues = {},
  validationRules = {},
  onSubmit
}: UseFormOptions = {}): UseFormReturn => {
  const [values, setValues] = useState<FormData>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateFieldValue = useCallback((name: string): string | null => {
    const value = values[name]
    const rules = validationRules[name]
    
    if (!rules) return null
    
    return validateField(value, rules)
  }, [values, validationRules])

  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {}
    
    Object.keys(validationRules).forEach(name => {
      const error = validateFieldValue(name)
      if (error) {
        newErrors[name] = error
      }
    })
    
    return newErrors
  }, [validationRules, validateFieldValue])

  const isValid = Object.keys(errors).length === 0 && Object.keys(validateForm()).length === 0

  const setValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

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
    
    const error = validateFieldValue(name)
    if (error) {
      setError(name, error)
    } else {
      clearError(name)
    }
  }, [validateFieldValue, setError, clearError])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    setIsSubmitting(true)
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as { [key: string]: boolean })
    setTouched(allTouched)

    // Validate all fields
    const formErrors = validateForm()
    setErrors(formErrors)

    if (Object.keys(formErrors).length === 0 && onSubmit) {
      try {
        await onSubmit(values)
      } catch (error) {
        console.error('Form submission error:', error)
      }
    }

    setIsSubmitting(false)
  }, [validationRules, validateForm, onSubmit, values])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

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
    reset,
    validateField: validateFieldValue,
    validateForm
  }
}

// ============================================================================
// FORM COMPONENTS
// ============================================================================

export const Form: React.FC<{
  children: React.ReactNode
  initialValues?: { [key: string]: any }
  validationRules?: ValidationRules
  onSubmit?: (values: FormData) => void | Promise<void>
  className?: string
}> = ({
  children,
  initialValues = {},
  validationRules = {},
  onSubmit,
  className = ''
}) => {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useForm({
    initialValues,
    validationRules,
    onSubmit
  })

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Clone form field components and inject form state
          if (child.type === FormField) {
            return React.cloneElement(child, {
              ...child.props,
              value: values[child.props.name] || '',
              error: touched[child.props.name] ? errors[child.props.name] : undefined,
              onChange: (value: any) => handleChange(child.props.name, value),
              onBlur: () => handleBlur(child.props.name)
            })
          }
          
          // Clone other form elements
          if (child.props.name && (child.props.value !== undefined || child.props.onChange)) {
            return React.cloneElement(child, {
              ...child.props,
              value: values[child.props.name] || '',
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                handleChange(child.props.name, e.target.value)
                child.props.onChange?.(e)
              },
              onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
                handleBlur(child.props.name)
                child.props.onBlur?.(e)
              }
            })
          }
        }
        return child
      })}
    </form>
  )
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

export const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  helpText,
  value = '',
  error,
  onChange,
  onBlur,
  className = '',
  disabled = false,
  rows = 3
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
  }

  const handleBlur = () => {
    onBlur?.()
  }

  const inputProps = {
    id: name,
    name,
    value,
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder,
    disabled,
    className: `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      error ? 'border-red-300' : 'border-gray-300'
    } ${className}`,
    'aria-describedby': helpText ? `${name}-help` : undefined,
    'aria-invalid': error ? 'true' : 'false'
  }

  return (
    <FormField
      label={label}
      error={error}
      required={required}
      helpText={helpText}
    >
      {type === 'textarea' ? (
        <textarea
          {...inputProps}
          rows={rows}
          className={`${inputProps.className} resize-vertical`}
        />
      ) : (
        <input
          {...inputProps}
          type={type}
        />
      )}
    </FormField>
  )
}

// ============================================================================
// FILE UPLOAD COMPONENT
// ============================================================================

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = '*/*',
  multiple = false,
  maxSize = 10, // 10MB default
  maxFiles = 5,
  onUpload,
  onError,
  className = '',
  disabled = false,
  label = 'Upload Files',
  helpText
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }
    return null
  }, [maxSize])

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const fileArray = Array.from(selectedFiles)
    const newFiles: UploadedFile[] = []

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`)
      return
    }

    fileArray.forEach(file => {
      const error = validateFile(file)
      const uploadedFile: UploadedFile = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: error ? 'error' : 'pending',
        progress: 0,
        error
      }
      newFiles.push(uploadedFile)
    })

    setFiles(prev => [...prev, ...newFiles])
    onUpload?.(fileArray.filter(file => !validateFile(file)))
  }, [files.length, maxFiles, validateFile, onUpload, onError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [disabled, handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }, [handleFileSelect])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️'
      default:
        return '📁'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        aria-label="File upload area"
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Click to upload
            </span>{' '}
            or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {accept !== '*/*' && `Accepted formats: ${accept}`}
            {maxSize && ` • Max size: ${maxSize}MB`}
            {maxFiles > 1 && ` • Max files: ${maxFiles}`}
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Files</h4>
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getFileIcon(file.file)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file.size)}
                    </p>
                    {file.status === 'uploading' && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label={`Remove ${file.file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {helpText && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  )
}

// ============================================================================
// SEARCH FILTER COMPONENTS
// ============================================================================

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchValue,
  onSearchChange,
  filters,
  onFilterChange,
  filterFields,
  onClearFilters,
  className = '',
  placeholder = 'Search...',
  showAdvanced = true
}) => {
  const [showFilters, setShowFilters] = useState(false)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  useEffect(() => {
    const hasFilters = Object.values(filters).some(value => value !== '')
    setHasActiveFilters(hasFilters)
  }, [filters])

  const handleClearFilters = () => {
    filterFields.forEach(field => {
      onFilterChange(field.key, '')
    })
    onClearFilters?.()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Search"
          />
        </div>
        
        {showAdvanced && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 ${
              hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : ''
            }`}
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Advanced Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterFields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <Select
                    value={filters[field.key] || ''}
                    onChange={(e) => onFilterChange(field.key, e.target.value)}
                    options={[
                      { value: '', label: `All ${field.label}` },
                      ...(field.options || [])
                    ]}
                    className="w-full"
                  />
                ) : (
                  <Input
                    type={field.type}
                    placeholder={field.placeholder || field.label}
                    value={filters[field.key] || ''}
                    onChange={(e) => onFilterChange(field.key, e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const QuickFilter: React.FC<QuickFilterProps> = ({
  filters,
  onFilterChange,
  className = ''
}) => {
  const quickFilters = [
    { key: 'status', label: 'Status', options: [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending', label: 'Pending' }
    ]},
    { key: 'priority', label: 'Priority', options: [
      { value: '', label: 'All Priority' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' }
    ]},
    { key: 'dateRange', label: 'Date Range', options: [
      { value: '', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' }
    ]}
  ]

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {quickFilters.map(filter => (
        <Select
          key={filter.key}
          value={filters[filter.key] || ''}
          onChange={(e) => onFilterChange(filter.key, e.target.value)}
          options={filter.options}
          className="min-w-32"
        />
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