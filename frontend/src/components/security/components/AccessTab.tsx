/**
 * Access Control Tab Component
 */

import { useState } from 'react';
import { User, Lock, Eye, Settings } from 'lucide-react';
import type { AccessControl } from '../types';
import { getStatusColor } from '../utils/formatters';
import { formatTimeAgo } from '../../../utils/common/dateFormatting';
import { AccessControlModal } from './AccessControlModal';

interface AccessTabProps {
  accessControls: AccessControl[];
  onAccessUpdate?: (access: AccessControl) => void;
  onAccessRevoke?: (accessId: string) => void;
}

export const AccessTab = ({
  accessControls,
  onAccessUpdate,
  onAccessRevoke,
}: AccessTabProps) => {
  const [selectedAccess, setSelectedAccess] = useState<AccessControl | null>(null);
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="p-6">
      <div className="space-y-4">
        {accessControls.map((access) => (
          <div
            key={access.id}
            className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  {access.status === 'active' ? (
                    <User className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">{access.userName}</h3>
                  <p className="text-sm text-secondary-600">
                    {access.role} • {access.userId}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(access.status)}`}
              >
                {access.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <span className="text-secondary-600">Permissions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {access.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 text-xs bg-primary-100 text-primary-800 rounded"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-secondary-600">Resources:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {access.resources.map((resource) => (
                    <span
                      key={resource}
                      className="px-2 py-0.5 text-xs bg-secondary-100 text-secondary-800 rounded"
                    >
                      {resource}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-secondary-600">Last Access:</span>
                <span className="ml-2 text-secondary-900">
                  {formatTimeAgo(access.lastAccess)}
                </span>
              </div>
            </div>

            {access.expiresAt && (
              <div className="text-xs text-secondary-500">
                Expires: {new Date(access.expiresAt).toLocaleString()}
              </div>
            )}

            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => {
                  setSelectedAccess(access);
                  setShowModal(true);
                }}
                className="btn-secondary text-sm flex-1 flex items-center justify-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => {
                  setSelectedAccess(access);
                  setShowModal(true);
                }}
                className="btn-primary text-sm flex-1 flex items-center justify-center space-x-1"
              >
                <Settings className="w-4 h-4" />
                <span>Manage Access</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedAccess && (
        <AccessControlModal
          access={selectedAccess}
          onClose={() => {
            setShowModal(false);
            setSelectedAccess(null);
          }}
          onUpdate={(updatedAccess) => {
            onAccessUpdate?.(updatedAccess);
            setSelectedAccess(updatedAccess);
          }}
          onRevoke={(accessId) => {
            onAccessRevoke?.(accessId);
            setShowModal(false);
            setSelectedAccess(null);
          }}
        />
      )}
    </div>
  );
};

