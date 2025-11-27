// Metric Card Component
// Extracted from AnalyticsDashboard.tsx

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, color }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color || 'text-gray-400'}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
              <dd className={`text-lg font-medium ${color || 'text-gray-900'}`}>{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

