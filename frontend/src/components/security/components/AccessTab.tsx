/**
 * Access Control Tab Component
 */

import { User, Lock } from 'lucide-react';
import type { AccessControl } from '../types';
import { getStatusColor } from '../utils/formatters';
import { formatTimeAgo } from '../../../utils/common/dateFormatting';

interface AccessTabProps {
  accessControls: AccessControl[];
}

export const AccessTab = ({ accessControls }: AccessTabProps) => {
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
          </div>
        ))}
      </div>
    </div>
  );
};

