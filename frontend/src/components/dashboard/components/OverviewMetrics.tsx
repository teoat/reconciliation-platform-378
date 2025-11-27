// Overview Metrics Component
// Extracted from AnalyticsDashboard.tsx

import React from 'react';
import { Folder, Users, GitCompare } from 'lucide-react';
import { MetricCard } from './MetricCard';
import type { DashboardMetrics } from '../types';

interface OverviewMetricsProps {
  metrics: DashboardMetrics;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard icon={Folder} label="Total Projects" value={metrics.total_projects} />
      <MetricCard icon={Users} label="Total Users" value={metrics.total_users} />
      <MetricCard icon={Folder} label="Total Files" value={metrics.total_files} />
      <MetricCard
        icon={GitCompare}
        label="Total Jobs"
        value={metrics.total_reconciliation_jobs}
      />
    </div>
  );
};

