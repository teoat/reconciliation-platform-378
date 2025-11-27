/**
 * Rules Tab Component
 */

import { Settings } from 'lucide-react';
import type { BusinessRuleData } from '../types';
import { getStatusColor } from '../utils/formatters';

interface RulesTabProps {
  rules: BusinessRuleData[];
}

export const RulesTab = ({ rules }: RulesTabProps) => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="border border-secondary-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">{rule.name}</h3>
                  <p className="text-sm text-secondary-600">{rule.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(rule.status)}`}
                >
                  {rule.status}
                </span>
                <span className="text-xs text-secondary-500">Priority: {rule.priority}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-secondary-600">Category:</span>
                <span className="ml-2 text-secondary-900">{rule.category}</span>
              </div>
              <div>
                <span className="text-secondary-600">Executions:</span>
                <span className="ml-2 text-secondary-900">{rule.executionCount}</span>
              </div>
              <div>
                <span className="text-secondary-600">Success Rate:</span>
                <span className="ml-2 text-secondary-900">
                  {rule.successRate.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-secondary-600">Last Executed:</span>
                <span className="ml-2 text-secondary-900">
                  {rule.lastExecuted
                    ? new Date(rule.lastExecuted).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

