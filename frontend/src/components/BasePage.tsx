import React from 'react';
import { ProgressBar } from './ui/ProgressBar';
import type { PageConfig, StatsCard, ActionConfig } from '../pages/index';

// Re-export types for backward compatibility
export type { PageConfig, StatsCard, ActionConfig };

interface BasePageProps {
  config: PageConfig;
  stats?: StatsCard[];
  actions?: ActionConfig[];
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

export const BasePage: React.FC<BasePageProps> = ({
  config,
  stats = [],
  actions = [],
  children,
  loading = false,
  error = null,
}) => {
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <div className="w-5 h-5 text-red-500 mr-2">⚠️</div>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <config.icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-gray-600 mt-1">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-600">Live Data</span>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              {stat.progress !== undefined && (
                <div className="mt-4">
                  <ProgressBar
                    value={stat.progress}
                    label={stat.title}
                    showLabel={false}
                    size="sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center justify-end space-x-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.loading}
              aria-label={action.label}
              aria-busy={action.loading}
              className={`${
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : action.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                    : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
              } px-4 py-2 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <action.icon className="w-4 h-4 mr-2" aria-hidden={true} />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Page Content */}
      {children}
    </div>
  );
};

// Simple skeleton text component
const SkeletonText: React.FC<{ lines: number; className?: string }> = ({
  lines,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {[...Array(lines)].map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
    ))}
  </div>
);
