/**
 * Policy Detail/Edit Modal Component
 */

import { useState, useEffect } from 'react';
import { X, Save, Eye, Edit, Trash2 } from 'lucide-react';
import type { SecurityPolicy } from '../types';
import { securityApiService } from '@/services/securityApiService';
import { logger } from '@/services/logger';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

interface PolicyDetailModalProps {
  policy: SecurityPolicy | null;
  onClose: () => void;
  onUpdate?: (policy: SecurityPolicy) => void;
  onDelete?: (policyId: string) => void;
}

export function PolicyDetailModal({
  policy,
  onClose,
  onUpdate,
  onDelete,
}: PolicyDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SecurityPolicy | null>(policy);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(policy);
    setIsEditing(false);
  }, [policy]);

  if (!formData) return null;

  const handleSave = async () => {
    if (!formData) return;

    setIsLoading(true);
    try {
      const response = await securityApiService.updatePolicy({
        id: formData.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        rules: formData.rules,
        priority: formData.priority,
        status: formData.status,
        compliance: formData.compliance,
      });

      if (response.success && response.data) {
        onUpdate?.(response.data);
        setIsEditing(false);
        logger.info('Policy updated successfully', { policyId: formData.id });
      } else {
        setErrors({ submit: 'Failed to update policy' });
      }
    } catch (error) {
      logger.error('Error updating policy', { error });
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update policy' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!formData || !confirm('Are you sure you want to delete this policy?')) return;

    try {
      await securityApiService.deletePolicy(formData.id);
      onDelete?.(formData.id);
      onClose();
    } catch (error) {
      logger.error('Error deleting policy', { error });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-secondary-900">
              {isEditing ? 'Edit Policy' : 'Policy Details'}
            </h3>
            <p className="text-sm text-secondary-600 mt-1">{formData.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-secondary text-red-600 hover:text-red-800 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {isEditing ? (
            <>
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as SecurityPolicy['category'] })
                }
                options={[
                  { value: 'access_control', label: 'Access Control' },
                  { value: 'data_protection', label: 'Data Protection' },
                  { value: 'audit', label: 'Audit' },
                  { value: 'compliance', label: 'Compliance' },
                  { value: 'encryption', label: 'Encryption' },
                ]}
                fullWidth
              />
              <Select
                label="Priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as SecurityPolicy['priority'] })
                }
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
                fullWidth
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as SecurityPolicy['status'] })
                }
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'draft', label: 'Draft' },
                ]}
                fullWidth
              />
            </>
          ) : (
            <>
              <div>
                <h4 className="font-semibold text-secondary-900 mb-2">Description</h4>
                <p className="text-secondary-600">{formData.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-2">Category</h4>
                  <p className="text-secondary-600 capitalize">{formData.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-2">Priority</h4>
                  <p className="text-secondary-600 capitalize">{formData.priority}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-2">Status</h4>
                  <p className="text-secondary-600 capitalize">{formData.status}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-2">Rules</h4>
                  <p className="text-secondary-600">{formData.rules.length} rules</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-secondary-900 mb-2">Compliance Frameworks</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.compliance.gdpr && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">GDPR</span>
                  )}
                  {formData.compliance.sox && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">SOX</span>
                  )}
                  {formData.compliance.pci && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">PCI</span>
                  )}
                  {formData.compliance.hipaa && (
                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">HIPAA</span>
                  )}
                </div>
              </div>
            </>
          )}

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-6 border-t border-secondary-200">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="btn-secondary" disabled={isLoading}>
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary flex items-center space-x-2" disabled={isLoading}>
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            ) : (
              <button onClick={onClose} className="btn-primary">
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

