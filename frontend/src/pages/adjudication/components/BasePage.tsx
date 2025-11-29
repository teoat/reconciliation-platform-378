import React, { useState } from 'react';
import { SkeletonText } from '@/components/LoadingComponents';

export interface PageConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  path: string;
  showStats?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
}

export interface StatsCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  color: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  progress?: number;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'range';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface ActionConfig {
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

interface BasePageProps {
  config: PageConfig;
  stats?: StatsCard[];
  filters?: FilterConfig[];
  actions?: ActionConfig[];
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

/**
 * Base page component with common layout and functionality
 */
export const BasePage: React.FC<BasePageProps> = ({
  config,
  stats = [],
  filters = [],
  actions = [],
  children,
  loading = false,
  error = null,
}) => {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilterValues({});
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <SkeletonText lines={1} className="w-1/4" />
          {stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          )}
          <SkeletonText lines={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className="w-6 h-6" aria-hidden={true} />
          <div>
            <h1 className="text-2xl font-bold">{config.title}</h1>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </div>
        {actions.length > 0 && (
          <div className="flex space-x-2">
            {actions.map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={i}
                  onClick={action.onClick}
                  disabled={action.loading}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                    action.variant === 'primary'
                      ? 'bg-blue-500 text-white'
                      : action.variant === 'danger'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <ActionIcon className="w-4 h-4" aria-hidden={true} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      {config.showStats && stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const StatIcon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <StatIcon className={`w-8 h-8 ${stat.color}`} aria-hidden={true} />
                </div>
                {stat.trend && (
                  <div className="mt-2">
                    <span
                      className={`text-sm ${
                        stat.trend.direction === 'up'
                          ? 'text-green-600'
                          : stat.trend.direction === 'down'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {stat.trend.value}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      {config.showFilters && filters.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            {filters.map((filter) => (
              <div key={filter.key} className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                {filter.type === 'select' ? (
                  <select
                    value={filterValues[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">{filter.placeholder || 'Select...'}</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={filter.type === 'date' ? 'date' : 'text'}
                    value={filterValues[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                )}
              </div>
            ))}
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div>{children}</div>
    </div>
  );
};

