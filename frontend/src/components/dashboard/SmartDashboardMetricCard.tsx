import React, { memo } from 'react';
import { LucideIcon } from 'lucide-react';

interface SmartDashboardMetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  trend?: React.ReactNode;
  subtitle?: string;
  progressBar?: {
    value: number;
    color: string;
  };
}

/**
 * Metric Card Component for Smart Dashboard
 * Optimized with React.memo to prevent unnecessary re-renders
 */
export const SmartDashboardMetricCard = memo<SmartDashboardMetricCardProps>(({
  label,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  trend,
  subtitle,
  progressBar,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 ${iconBgColor} rounded-full`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      {trend && <div className="mt-4">{trend}</div>}
      {subtitle && (
        <div className="mt-4">
          <span className="text-sm text-gray-600">{subtitle}</span>
        </div>
      )}
      {progressBar && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${progressBar.color} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${progressBar.value}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

SmartDashboardMetricCard.displayName = 'SmartDashboardMetricCard';

