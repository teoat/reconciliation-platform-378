// Metric Tabs Component
// Extracted from AnalyticsDashboard.tsx

import React from 'react';
import { BarChart3, Folder, Users, GitCompare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type MetricTab = 'overview' | 'projects' | 'users' | 'reconciliation';

interface MetricTabsProps {
  selectedMetric: MetricTab;
  onMetricChange: (metric: MetricTab) => void;
}

const tabs: Array<{ id: MetricTab; name: string; icon: LucideIcon }> = [
  { id: 'overview', name: 'Overview', icon: BarChart3 },
  { id: 'projects', name: 'Projects', icon: Folder },
  { id: 'users', name: 'Users', icon: Users },
  { id: 'reconciliation', name: 'Reconciliation', icon: GitCompare },
];

export const MetricTabs: React.FC<MetricTabsProps> = ({ selectedMetric, onMetricChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onMetricChange(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                selectedMetric === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

