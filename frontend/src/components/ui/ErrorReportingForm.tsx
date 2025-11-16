/**
import { logger } from '../../services/logger'; * Error Reporting Form Component
 * Accessible form for reporting errors to support
 * Essential for Agent 5 Enhancement 2: Enhanced Error Display
 */

import React, { useState } from 'react';
import { Send, X, AlertCircle, User, Mail, MessageSquare } from 'lucide-react';
import { Button } from './Button';
import { ErrorCodeDisplay } from './ErrorCodeDisplay';

export interface ErrorReportingFormProps {
  error: Error | string;
  errorCode?: string;
  correlationId?: string;
  onSubmit?: (report: ErrorReport) => void | Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<ErrorReport>;
  className?: string;
}

export interface ErrorReport {
  name: string;
  email: string;
  description: string;
  stepsToReproduce: string;
  errorCode?: string;
  correlationId?: string;
  severity: 'error' | 'warning' | 'info';
  additionalContext?: string;
}

/**
 * ErrorReportingForm - Accessible form for error reporting
 */
export const ErrorReportingForm: React.FC<ErrorReportingFormProps> = ({
  error,
  errorCode,
  correlationId,
  onSubmit,
  onCancel,
  initialValues,
  className = '',
}) => {
  const [formData, setFormData] = useState<ErrorReport>({
    name: initialValues?.name || '',
    email: initialValues?.email || '',
    description: initialValues?.description || '',
    stepsToReproduce: initialValues?.stepsToReproduce || '',
    errorCode: errorCode || initialValues?.errorCode || '',
    correlationId: correlationId || initialValues?.correlationId || '',
    severity: initialValues?.severity || 'error',
    additionalContext: initialValues?.additionalContext || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const errorMessage = typeof error === 'string' ? error : error.message;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.stepsToReproduce.trim()) {
      newErrors.stepsToReproduce = 'Steps to reproduce are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (error) {
      logger.error('Failed to submit error report:', { error: { error } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ErrorReport) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`error-reporting-form space-y-4 ${className}`}
      aria-label="Error reporting form"
      noValidate
    >
      {/* Error Summary */}
      <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-red-900">Error Summary</h3>
            <p className="text-sm text-red-800 mt-1">{errorMessage}</p>
          </div>
        </div>
      </div>

      {/* Error Code and Correlation ID */}
      {(errorCode || correlationId) && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <ErrorCodeDisplay
            errorCode={errorCode}
            correlationId={correlationId}
            timestamp={new Date()}
            showLabel={true}
          />
        </div>
      )}

      {/* Name Field */}
      <div>
        <label htmlFor="report-name" className="block text-sm font-medium text-gray-700 mb-1">
          <User className="h-4 w-4 inline mr-1" aria-hidden="true" />
          Your Name <span className="text-red-600" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="report-name"
          value={formData.name}
          onChange={handleChange('name')}
          required
          aria-required="true"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="report-email" className="block text-sm font-medium text-gray-700 mb-1">
          <Mail className="h-4 w-4 inline mr-1" aria-hidden="true" />
          Your Email <span className="text-red-600" aria-label="required">*</span>
        </label>
        <input
          type="email"
          id="report-email"
          value={formData.email}
          onChange={handleChange('email')}
          required
          aria-required="true"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 mb-1">
          <MessageSquare className="h-4 w-4 inline mr-1" aria-hidden="true" />
          Error Description <span className="text-red-600" aria-label="required">*</span>
        </label>
        <textarea
          id="report-description"
          value={formData.description}
          onChange={handleChange('description')}
          required
          aria-required="true"
          aria-invalid={errors.description ? 'true' : 'false'}
          aria-describedby={errors.description ? 'description-error' : undefined}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      {/* Steps to Reproduce Field */}
      <div>
        <label htmlFor="report-steps" className="block text-sm font-medium text-gray-700 mb-1">
          Steps to Reproduce <span className="text-red-600" aria-label="required">*</span>
        </label>
        <textarea
          id="report-steps"
          value={formData.stepsToReproduce}
          onChange={handleChange('stepsToReproduce')}
          required
          aria-required="true"
          aria-invalid={errors.stepsToReproduce ? 'true' : 'false'}
          aria-describedby={errors.stepsToReproduce ? 'steps-error' : undefined}
          rows={4}
          placeholder="1. Go to..."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.stepsToReproduce ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.stepsToReproduce && (
          <p id="steps-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.stepsToReproduce}
          </p>
        )}
      </div>

      {/* Additional Context Field */}
      <div>
        <label htmlFor="report-context" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Context (Optional)
        </label>
        <textarea
          id="report-context"
          value={formData.additionalContext || ''}
          onChange={handleChange('additionalContext')}
          rows={3}
          placeholder="Any additional information that might be helpful..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            aria-label="Cancel error report"
          >
            <X className="h-4 w-4 mr-2" aria-hidden="true" />
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          aria-label="Submit error report"
        >
          <Send className={`h-4 w-4 mr-2 ${isSubmitting ? 'animate-pulse' : ''}`} aria-hidden="true" />
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </Button>
      </div>
    </form>
  );
};

export default ErrorReportingForm;


