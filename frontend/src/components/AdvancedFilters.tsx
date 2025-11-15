'use client'

import { useState } from 'react'
import { X, Filter, Calendar, DollarSign, Hash, Type, CheckSquare, Square, Plus, Minus, ArrowUpDown, ChevronDown, ChevronUp, AlertCircle, Info, Settings } from 'lucide-react'
import { Save } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import { Copy } from 'lucide-react'
import { Edit } from 'lucide-react'
import { Eye } from 'lucide-react'
import { EyeOff } from 'lucide-react'
import { Lock } from 'lucide-react'
import { Unlock } from 'lucide-react'
import { Key } from 'lucide-react'
import { Globe } from 'lucide-react'
import { Database } from 'lucide-react'
import { Cloud } from 'lucide-react'
import { Server } from 'lucide-react'
import { Wifi } from 'lucide-react'
import { WifiOff } from 'lucide-react'
import { Bell } from 'lucide-react'
import { BellOff } from 'lucide-react'
import { Star } from 'lucide-react'
import { Bookmark } from 'lucide-react'
import { Share2 } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
import { Download } from 'lucide-react'
import { Upload } from 'lucide-react'
import { File } from 'lucide-react'
import { FileText } from 'lucide-react'
import { FileCheck } from 'lucide-react'
import { FileX } from 'lucide-react'
import { FilePlus } from 'lucide-react'
import { FileMinus } from 'lucide-react'
import { FileEdit } from 'lucide-react'
import { FileSearch } from 'lucide-react'
import { FileImage } from 'lucide-react'
import { FileVideo } from 'lucide-react'
import { FileAudio } from 'lucide-react'
import { FileSpreadsheet } from 'lucide-react'
import { FileCode } from 'lucide-react'
import { FileJson } from 'lucide-react'
import { FileArchive } from 'lucide-react'

interface FilterConfig {
  id: string
  field: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'range'
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn'
  value: string | number | boolean | string[] | null | undefined
  value2?: string | number | boolean | string[] | null | undefined
  options?: Array<{ label: string; value: string | number | boolean }>
  active: boolean
  required: boolean
}

interface AdvancedFiltersProps {
  isVisible: boolean
  onClose: () => void
  filters: FilterConfig[]
  onFiltersChange: (filters: FilterConfig[]) => void
  availableFields: Array<{
    id: string
    label: string
    type: 'text' | 'number' | 'date' | 'select' | 'boolean'
    options?: Array<{ label: string; value: string | number | boolean }>
  }>
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isVisible,
  onClose,
  filters,
  onFiltersChange,
  availableFields
}) => {
  const [localFilters, setLocalFilters] = useState<FilterConfig[]>(filters)

  const handleAddFilter = () => {
    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      field: '',
      label: '',
      type: 'text',
      operator: 'equals',
      value: '',
      active: true,
      required: false
    }
    setLocalFilters(prev => [...prev, newFilter])
  }

  const handleRemoveFilter = (filterId: string) => {
    setLocalFilters(prev => prev.filter(f => f.id !== filterId))
  }

  const handleFilterChange = (filterId: string, updates: Partial<FilterConfig>) => {
    setLocalFilters(prev => prev.map(f => 
      f.id === filterId ? { ...f, ...updates } : f
    ))
  }

  const handleSave = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleReset = () => {
    setLocalFilters([])
  }

  const getOperatorOptions = (type: string) => {
    switch (type) {
      case 'text':
        return [
          { label: 'Equals', value: 'equals' },
          { label: 'Contains', value: 'contains' },
          { label: 'Starts with', value: 'startsWith' },
          { label: 'Ends with', value: 'endsWith' }
        ]
      case 'number':
        return [
          { label: 'Equals', value: 'equals' },
          { label: 'Greater than', value: 'greaterThan' },
          { label: 'Less than', value: 'lessThan' },
          { label: 'Between', value: 'between' }
        ]
      case 'date':
        return [
          { label: 'Equals', value: 'equals' },
          { label: 'After', value: 'greaterThan' },
          { label: 'Before', value: 'lessThan' },
          { label: 'Between', value: 'between' }
        ]
      case 'select':
      case 'multiselect':
        return [
          { label: 'Equals', value: 'equals' },
          { label: 'In', value: 'in' },
          { label: 'Not in', value: 'notIn' }
        ]
      case 'boolean':
        return [
          { label: 'Equals', value: 'equals' }
        ]
      default:
        return [{ label: 'Equals', value: 'equals' }]
    }
  }

  const getInputValue = (value: any): string => {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    return '';
  };

  const renderFilterInput = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            value={getInputValue(filter.value)}
            onChange={(e) => handleFilterChange(filter.id, { value: e.target.value })}
            className="input-field"
            placeholder="Enter value..."
          />
        )
      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={getInputValue(filter.value)}
              onChange={(e) => handleFilterChange(filter.id, { value: e.target.value })}
              className="input-field w-32"
              placeholder="Value"
            />
            {filter.operator === 'between' && (
              <>
                <span className="text-secondary-500">and</span>
                <input
                  type="number"
                  value={getInputValue(filter.value2)}
                  onChange={(e) => handleFilterChange(filter.id, { value2: e.target.value })}
                  className="input-field w-32"
                  placeholder="Value 2"
                />
              </>
            )}
          </div>
        )
      case 'date':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={getInputValue(filter.value)}
              onChange={(e) => handleFilterChange(filter.id, { value: e.target.value })}
              className="input-field w-40"
            />
            {filter.operator === 'between' && (
              <>
                <span className="text-secondary-500">and</span>
                <input
                  type="date"
                  value={getInputValue(filter.value2)}
                  onChange={(e) => handleFilterChange(filter.id, { value2: e.target.value })}
                  className="input-field w-40"
                />
              </>
            )}
          </div>
        )
      case 'select':
        return (
          <select
            value={getInputValue(filter.value)}
            onChange={(e) => handleFilterChange(filter.id, { value: e.target.value })}
            className="input-field"
          >
            <option value="">Select value...</option>
            {filter.options?.map(option => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map(option => (
              <label key={String(option.value)} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(filter.value) && filter.value.includes(String(option.value))}
                  onChange={(e) => {
                    const currentValues = Array.isArray(filter.value) ? filter.value : []
                    const newValues = e.target.checked
                      ? [...currentValues, String(option.value)]
                      : currentValues.filter(v => v !== String(option.value))
                    handleFilterChange(filter.id, { value: newValues })
                  }}
                  className="rounded border-secondary-300"
                />
                <span className="text-sm text-secondary-700">{option.label}</span>
              </label>
            ))}
          </div>
        )
      case 'boolean':
        return (
          <select
            value={getInputValue(filter.value)}
            onChange={(e) => handleFilterChange(filter.id, { value: e.target.value === 'true' })}
            className="input-field"
          >
            <option value="">Select...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        )
      default:
        return null
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <Filter className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-secondary-900">
              Advanced Filters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Filter List */}
          <div className="space-y-4">
            {localFilters.map((filter, index) => (
              <div key={filter.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-secondary-900">
                    Filter {index + 1}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filter.active}
                        onChange={(e) => handleFilterChange(filter.id, { active: e.target.checked })}
                        className="rounded border-secondary-300"
                      />
                      <span className="text-sm text-secondary-700">Active</span>
                    </label>
                    <button
                      onClick={() => handleRemoveFilter(filter.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Field Selection */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Field
                    </label>
                    <select
                      value={filter.field}
                      onChange={(e) => {
                        const selectedField = availableFields.find(f => f.id === e.target.value)
                        handleFilterChange(filter.id, {
                          field: e.target.value,
                          label: selectedField?.label || '',
                          type: selectedField?.type || 'text',
                          options: selectedField?.options || []
                        })
                      }}
                      className="input-field"
                    >
                      <option value="">Select field...</option>
                      {availableFields.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator Selection */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Operator
                    </label>
                    <select
                      value={filter.operator}
                      onChange={(e) => handleFilterChange(filter.id, { operator: e.target.value as FilterConfig['operator'] })}
                      className="input-field"
                    >
                      {getOperatorOptions(filter.type).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Value Input */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Value
                    </label>
                    {renderFilterInput(filter)}
                  </div>
                </div>
              </div>
            ))}

            {localFilters.length === 0 && (
              <div className="text-center py-8">
                <Filter className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                <p className="text-secondary-600 mb-4">No filters applied</p>
                <button
                  onClick={handleAddFilter}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Filter</span>
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-secondary-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddFilter}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Filter</span>
              </button>
              <button
                onClick={handleReset}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset All</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedFilters
