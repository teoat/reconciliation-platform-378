import React, { memo, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { TrendingDown } from 'lucide-react';
import { Activity } from 'lucide-react';
import { Users } from 'lucide-react';
import { DollarSign } from 'lucide-react';
import { Clock } from 'lucide-react';

export interface MetricWidgetProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
  loading?: boolean;
}

export const MetricWidget: React.FC<MetricWidgetProps> = memo(
  ({
    title,
    value,
    change,
    changeLabel,
    icon,
    color = 'blue',
    className = '',
    loading = false,
  }) => {
    // Memoize color classes
    const colorClasses = useMemo(
      () => ({
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-green-50 text-green-600 border-green-200',
        red: 'bg-red-50 text-red-600 border-red-200',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        gray: 'bg-gray-50 text-gray-600 border-gray-200',
      }),
      []
    );

    const changeColorClasses = useMemo(
      () => ({
        positive: 'text-green-600',
        negative: 'text-red-600',
        neutral: 'text-gray-600',
      }),
      []
    );

    // Memoize change color calculation
    const changeColor = useMemo(() => {
      if (change === undefined) return changeColorClasses.neutral;
      return change > 0 ? changeColorClasses.positive : changeColorClasses.negative;
    }, [change, changeColorClasses]);

    // Memoize card classes
    const cardClasses = useMemo(
      () => `bg-white rounded-lg shadow-sm border p-6 ${className}`,
      [className]
    );

    // Memoize icon container classes
    const iconClasses = useMemo(
      () => `p-2 rounded-lg border ${colorClasses[color]}`,
      [colorClasses, color]
    );

    // Memoize change section classes
    const changeClasses = useMemo(() => `mt-2 flex items-center space-x-1`, []);

    if (loading) {
      return (
        <div className={cardClasses}>
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="mt-4">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="mt-2 h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={cardClasses}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {icon && <div className={iconClasses}>{icon}</div>}
        </div>

        <div className="mt-4">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className={changeClasses}>
              {change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : change < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Activity className="h-4 w-4 text-gray-600" />
              )}
              <span className={`text-sm font-medium ${changeColor}`}>{Math.abs(change)}%</span>
              {changeLabel && <span className="text-sm text-gray-500">{changeLabel}</span>}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = memo(({ children, className = '' }) => {
  // Memoize grid classes
  const gridClasses = useMemo(
    () => `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`,
    [className]
  );

  return <div className={gridClasses}>{children}</div>;
});

export interface ChartWidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const ChartWidget: React.FC<ChartWidgetProps> = memo(
  ({ title, children, className = '', actions }) => {
    // Memoize widget classes
    const widgetClasses = useMemo(
      () => `bg-white rounded-lg shadow-sm border ${className}`,
      [className]
    );

    return (
      <div className={widgetClasses}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {actions && <div className="flex items-center space-x-2">{actions}</div>}
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    );
  }
);

export interface ActivityFeedProps {
  activities: Array<{
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
    user?: string;
  }>;
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = memo(({ activities, className = '' }) => {
  // Memoize activity icon
  const getActivityIcon = useMemo(
    () => (type: string) => {
      switch (type) {
        case 'success':
          return <div className="w-2 h-2 bg-green-500 rounded-full" />;
        case 'warning':
          return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
        case 'error':
          return <div className="w-2 h-2 bg-red-500 rounded-full" />;
        default:
          return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      }
    },
    []
  );

  // Memoize activity color
  const getActivityColor = useMemo(
    () => (type: string) => {
      switch (type) {
        case 'success':
          return 'text-green-700';
        case 'warning':
          return 'text-yellow-700';
        case 'error':
          return 'text-red-700';
        default:
          return 'text-blue-700';
      }
    },
    []
  );

  // Memoize widget classes
  const widgetClasses = useMemo(
    () => `bg-white rounded-lg shadow-sm border ${className}`,
    [className]
  );

  return (
    <div className={widgetClasses}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="mt-1">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                  {activity.message}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {activity.timestamp.toLocaleString()}
                  </span>
                  {activity.user && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{activity.user}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Pre-built metric widgets for common use cases
export const RevenueWidget: React.FC<Omit<MetricWidgetProps, 'icon' | 'color'>> = memo((props) => (
  <MetricWidget {...props} icon={<DollarSign className="h-5 w-5" />} color="green" />
));

export const UsersWidget: React.FC<Omit<MetricWidgetProps, 'icon' | 'color'>> = memo((props) => (
  <MetricWidget {...props} icon={<Users className="h-5 w-5" />} color="blue" />
));

export const ActivityWidget: React.FC<Omit<MetricWidgetProps, 'icon' | 'color'>> = memo((props) => (
  <MetricWidget {...props} icon={<Activity className="h-5 w-5" />} color="purple" />
));
