/**
 * Policies Tab Component
 */

import type { SecurityPolicy } from '../types';
import { getStatusColor, getSeverityColor } from '../utils/formatters';
import { getCategoryIcon } from '../utils/icons';

interface PoliciesTabProps {
  policies: SecurityPolicy[];
}

export const PoliciesTab = ({ policies }: PoliciesTabProps) => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  {getCategoryIcon(policy.category)}
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">{policy.name}</h3>
                  <p className="text-sm text-secondary-600">{policy.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(policy.status)}`}
                >
                  {policy.status}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(policy.priority)}`}
                >
                  {policy.priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
              <div>
                <span className="text-secondary-600">Category:</span>
                <span className="ml-2 text-secondary-900">{policy.category}</span>
              </div>
              <div>
                <span className="text-secondary-600">Rules:</span>
                <span className="ml-2 text-secondary-900">{policy.rules.length}</span>
              </div>
              <div>
                <span className="text-secondary-600">Last Reviewed:</span>
                <span className="ml-2 text-secondary-900">
                  {new Date(policy.lastReviewed).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-secondary-600">Compliance:</span>
                <div className="flex space-x-1 mt-1">
                  {policy.compliance.gdpr && (
                    <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                      GDPR
                    </span>
                  )}
                  {policy.compliance.sox && (
                    <span className="px-1 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                      SOX
                    </span>
                  )}
                  {policy.compliance.pci && (
                    <span className="px-1 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                      PCI
                    </span>
                  )}
                  {policy.compliance.hipaa && (
                    <span className="px-1 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">
                      HIPAA
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

