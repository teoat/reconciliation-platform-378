/**
 * Create Report Modal Component - Full implementation with form
 */

import { useState } from 'react';
import { X, Save, Plus, Trash2, Filter, BarChart3 } from 'lucide-react';
import type { CustomReport, ReportFilter, ReportMetric, ReportVisualization } from '../types';
import { reportsApiService } from '@/services/reportsApiService';
import { logger } from '@/services/logger';
import { validateReport } from '../utils/validation';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

interface CreateReportModalProps {
  onClose: () => void;
  onSuccess?: (report: CustomReport) => void;
}

export function CreateReportModal({ onClose, onSuccess }: CreateReportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<CustomReport>>({
    name: '',
    description: '',
    dataSource: 'reconciliation',
    filters: [],
    metrics: [],
    visualizations: [],
    isPublic: false,
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [showFilterForm, setShowFilterForm] = useState(false);
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [showVisualizationForm, setShowVisualizationForm] = useState(false);

  const validate = (): boolean => {
    const validationErrors = validateReport(formData);
    const newErrors: Record<string, string> = {};
    validationErrors.forEach((err) => {
      newErrors[err.field] = err.message;
    });
    setErrors(newErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await reportsApiService.createReport({
        name: formData.name!,
        description: formData.description!,
        dataSource: formData.dataSource!,
        filters: formData.filters || [],
        metrics: formData.metrics || [],
        visualizations: formData.visualizations || [],
        schedule: formData.schedule,
        isPublic: formData.isPublic || false,
        tags: formData.tags || [],
      });

      if (response.success && response.data) {
        logger.info('Report created successfully', { reportId: response.data.id });
        onSuccess?.(response.data);
        onClose();
      } else {
        setErrors({ submit: 'Failed to create report. Please try again.' });
      }
    } catch (error) {
      logger.error('Error creating report', { error });
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create report' });
    } finally {
      setIsLoading(false);
    }
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      field: '',
      operator: 'equals',
      value: null,
      label: '',
    };
    setFormData({
      ...formData,
      filters: [...(formData.filters || []), newFilter],
    });
    setShowFilterForm(true);
  };

  const removeFilter = (index: number) => {
    const filters = [...(formData.filters || [])];
    filters.splice(index, 1);
    setFormData({ ...formData, filters });
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    const filters = [...(formData.filters || [])];
    filters[index] = { ...filters[index], ...updates };
    setFormData({ ...formData, filters });
  };

  const addMetric = () => {
    const newMetric: ReportMetric = {
      id: `metric-${Date.now()}`,
      name: '',
      type: 'count',
      format: 'number',
    };
    setFormData({
      ...formData,
      metrics: [...(formData.metrics || []), newMetric],
    });
    setShowMetricForm(true);
  };

  const removeMetric = (index: number) => {
    const metrics = [...(formData.metrics || [])];
    metrics.splice(index, 1);
    setFormData({ ...formData, metrics });
  };

  const updateMetric = (index: number, updates: Partial<ReportMetric>) => {
    const metrics = [...(formData.metrics || [])];
    metrics[index] = { ...metrics[index], ...updates };
    setFormData({ ...formData, metrics });
  };

  const addVisualization = () => {
    const newViz: ReportVisualization = {
      type: 'bar',
      metrics: [],
    };
    setFormData({
      ...formData,
      visualizations: [...(formData.visualizations || []), newViz],
    });
    setShowVisualizationForm(true);
  };

  const removeVisualization = (index: number) => {
    const visualizations = [...(formData.visualizations || [])];
    visualizations.splice(index, 1);
    setFormData({ ...formData, visualizations });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-secondary-900">Create Custom Report</h3>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
            aria-label="Close create report modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-secondary-900">Basic Information</h4>
            <Input
              label="Report Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
              fullWidth
            />
            <div>
              <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="report-description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
            <Select
              label="Data Source"
              value={formData.dataSource || 'reconciliation'}
              onChange={(e) =>
                setFormData({ ...formData, dataSource: e.target.value as CustomReport['dataSource'] })
              }
              options={[
                { value: 'reconciliation', label: 'Reconciliation' },
                { value: 'cashflow', label: 'Cashflow' },
                { value: 'projects', label: 'Projects' },
                { value: 'users', label: 'Users' },
              ]}
              error={errors.dataSource}
              required
              fullWidth
            />
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-secondary-900">Filters</h4>
              <button
                type="button"
                onClick={addFilter}
                className="btn-secondary flex items-center space-x-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Filter</span>
              </button>
            </div>
            {formData.filters?.map((filter, index) => (
              <div key={index} className="border border-secondary-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-secondary-500" />
                    <span className="font-medium">Filter {index + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFilter(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Field"
                    value={filter.field}
                    onChange={(e) => updateFilter(index, { field: e.target.value })}
                    placeholder="e.g., amount, status"
                    fullWidth
                  />
                  <Select
                    label="Operator"
                    value={filter.operator}
                    onChange={(e) =>
                      updateFilter(index, { operator: e.target.value as ReportFilter['operator'] })
                    }
                    options={[
                      { value: 'equals', label: 'Equals' },
                      { value: 'contains', label: 'Contains' },
                      { value: 'greater_than', label: 'Greater Than' },
                      { value: 'less_than', label: 'Less Than' },
                      { value: 'between', label: 'Between' },
                      { value: 'in', label: 'In' },
                    ]}
                    fullWidth
                  />
                </div>
                <Input
                  label="Value"
                  value={String(filter.value || '')}
                  onChange={(e) => updateFilter(index, { value: e.target.value })}
                  placeholder="Filter value"
                  fullWidth
                />
                <Input
                  label="Label"
                  value={filter.label}
                  onChange={(e) => updateFilter(index, { label: e.target.value })}
                  placeholder="Display label"
                  fullWidth
                />
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-secondary-900">Metrics</h4>
              <button
                type="button"
                onClick={addMetric}
                className="btn-secondary flex items-center space-x-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Metric</span>
              </button>
            </div>
            {formData.metrics?.map((metric, index) => (
              <div key={metric.id} className="border border-secondary-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Metric {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeMetric(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Name"
                    value={metric.name}
                    onChange={(e) => updateMetric(index, { name: e.target.value })}
                    fullWidth
                  />
                  <Select
                    label="Type"
                    value={metric.type}
                    onChange={(e) =>
                      updateMetric(index, { type: e.target.value as ReportMetric['type'] })
                    }
                    options={[
                      { value: 'count', label: 'Count' },
                      { value: 'sum', label: 'Sum' },
                      { value: 'average', label: 'Average' },
                      { value: 'percentage', label: 'Percentage' },
                      { value: 'trend', label: 'Trend' },
                    ]}
                    fullWidth
                  />
                </div>
                {metric.type !== 'count' && (
                  <Input
                    label="Field"
                    value={metric.field || ''}
                    onChange={(e) => updateMetric(index, { field: e.target.value })}
                    placeholder="Field name"
                    fullWidth
                  />
                )}
                {metric.type === 'percentage' && (
                  <Input
                    label="Calculation"
                    value={metric.calculation || ''}
                    onChange={(e) => updateMetric(index, { calculation: e.target.value })}
                    placeholder="e.g., matched/total"
                    fullWidth
                  />
                )}
                <Select
                  label="Format"
                  value={metric.format}
                  onChange={(e) =>
                    updateMetric(index, { format: e.target.value as ReportMetric['format'] })
                  }
                  options={[
                    { value: 'number', label: 'Number' },
                    { value: 'currency', label: 'Currency' },
                    { value: 'percentage', label: 'Percentage' },
                    { value: 'date', label: 'Date' },
                  ]}
                  fullWidth
                />
              </div>
            ))}
          </div>

          {/* Visualizations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-secondary-900">Visualizations</h4>
              <button
                type="button"
                onClick={addVisualization}
                className="btn-secondary flex items-center space-x-2 text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Add Visualization</span>
              </button>
            </div>
            {formData.visualizations?.map((viz, index) => (
              <div key={index} className="border border-secondary-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Visualization {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeVisualization(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Select
                  label="Type"
                  value={viz.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visualizations: formData.visualizations?.map((v, i) =>
                        i === index ? { ...v, type: e.target.value as ReportVisualization['type'] } : v
                      ),
                    })
                  }
                  options={[
                    { value: 'table', label: 'Table' },
                    { value: 'bar', label: 'Bar Chart' },
                    { value: 'line', label: 'Line Chart' },
                    { value: 'pie', label: 'Pie Chart' },
                    { value: 'area', label: 'Area Chart' },
                    { value: 'scatter', label: 'Scatter Plot' },
                  ]}
                  fullWidth
                />
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label htmlFor="report-tags" className="block text-sm font-medium text-gray-700">Tags</label>
            <div className="flex items-center space-x-2">
              <Input
                id="report-tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag and press Enter"
                fullWidth
              />
              <button type="button" onClick={addTag} className="btn-secondary">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-primary-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Public/Private */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic || false}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              Make this report public
            </label>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-6 border-t border-secondary-200">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex items-center space-x-2" disabled={isLoading}>
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Creating...' : 'Create Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
