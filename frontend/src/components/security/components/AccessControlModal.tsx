/**
 * Access Control Management Modal
 */

import { useState } from 'react';
import { X, Save, Trash2, Lock } from 'lucide-react';
import type { AccessControl } from '../types';
import { securityApiService } from '@/services/securityApiService';
import { logger } from '@/services/logger';
import Input from '../../ui/Input';
import Select from '../../ui/Select';

interface AccessControlModalProps {
  access: AccessControl | null;
  onClose: () => void;
  onUpdate?: (access: AccessControl) => void;
  onRevoke?: (accessId: string) => void;
}

export function AccessControlModal({
  access,
  onClose,
  onUpdate,
  onRevoke,
}: AccessControlModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AccessControl | null>(access);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newPermission, setNewPermission] = useState('');
  const [newResource, setNewResource] = useState('');

  if (!formData) return null;

  const handleSave = async () => {
    if (!formData) return;

    setIsLoading(true);
    try {
      const response = await securityApiService.updateAccessControl({
        id: formData.id,
        permissions: formData.permissions,
        resources: formData.resources,
        expiresAt: formData.expiresAt,
        status: formData.status,
      });

      if (response.success && response.data) {
        onUpdate?.(response.data);
        setIsEditing(false);
        logger.info('Access control updated successfully', { accessId: formData.id });
      } else {
        setErrors({ submit: 'Failed to update access control' });
      }
    } catch (error) {
      logger.error('Error updating access control', { error });
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update access control' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!formData || !confirm('Are you sure you want to revoke this access?')) return;

    try {
      await securityApiService.revokeAccess(formData.id);
      onRevoke?.(formData.id);
      onClose();
    } catch (error) {
      logger.error('Error revoking access', { error });
    }
  };

  const addPermission = () => {
    if (newPermission.trim() && !formData.permissions.includes(newPermission.trim())) {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, newPermission.trim()],
      });
      setNewPermission('');
    }
  };

  const removePermission = (perm: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.filter((p) => p !== perm),
    });
  };

  const addResource = () => {
    if (newResource.trim() && !formData.resources.includes(newResource.trim())) {
      setFormData({
        ...formData,
        resources: [...formData.resources, newResource.trim()],
      });
      setNewResource('');
    }
  };

  const removeResource = (resource: string) => {
    setFormData({
      ...formData,
      resources: formData.resources.filter((r) => r !== resource),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-secondary-900">
              {isEditing ? 'Manage Access Control' : 'Access Control Details'}
            </h3>
            <p className="text-sm text-secondary-600 mt-1">{formData.userName}</p>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleRevoke}
                  className="btn-secondary text-red-600 hover:text-red-800 flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Revoke</span>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                  <div className="flex items-center space-x-2 mb-2">
                    <Input
                      value={newPermission}
                      onChange={(e) => setNewPermission(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPermission();
                        }
                      }}
                      placeholder="Add permission"
                      fullWidth
                    />
                    <button type="button" onClick={addPermission} className="btn-secondary">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded flex items-center space-x-1"
                      >
                        <span>{perm}</span>
                        <button
                          type="button"
                          onClick={() => removePermission(perm)}
                          className="hover:text-primary-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resources</label>
                  <div className="flex items-center space-x-2 mb-2">
                    <Input
                      value={newResource}
                      onChange={(e) => setNewResource(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addResource();
                        }
                      }}
                      placeholder="Add resource"
                      fullWidth
                    />
                    <button type="button" onClick={addResource} className="btn-secondary">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.resources.map((resource) => (
                      <span
                        key={resource}
                        className="px-2 py-1 text-xs bg-secondary-100 text-secondary-800 rounded flex items-center space-x-1"
                      >
                        <span>{resource}</span>
                        <button
                          type="button"
                          onClick={() => removeResource(resource)}
                          className="hover:text-secondary-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Input
                label="Expires At"
                type="datetime-local"
                value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().slice(0, 16) : ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                fullWidth
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as AccessControl['status'] })
                }
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'revoked', label: 'Revoked' },
                ]}
                fullWidth
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-2">User Information</h4>
                  <p className="text-secondary-600">Name: {formData.userName}</p>
                  <p className="text-secondary-600">ID: {formData.userId}</p>
                  <p className="text-secondary-600">Role: {formData.role}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-2">Access Information</h4>
                  <p className="text-secondary-600">Status: {formData.status}</p>
                  <p className="text-secondary-600">IP: {formData.ipAddress}</p>
                  <p className="text-secondary-600">Last Access: {new Date(formData.lastAccess).toLocaleString()}</p>
                  {formData.expiresAt && (
                    <p className="text-secondary-600">Expires: {new Date(formData.expiresAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-secondary-900 mb-2">Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-secondary-900 mb-2">Resources</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.resources.map((resource) => (
                    <span
                      key={resource}
                      className="px-2 py-1 text-xs bg-secondary-100 text-secondary-800 rounded"
                    >
                      {resource}
                    </span>
                  ))}
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

