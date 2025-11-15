'use client';

import React from 'react';
import { X, FolderOpen, Activity, CheckCircle, TrendingUp } from 'lucide-react';
import { ProjectAnalytics, EnhancedProject } from '../../types/project';

interface AnalyticsModalProps {
  analytics: ProjectAnalytics;
  projects: EnhancedProject[];
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ analytics, projects, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">Project Analytics Dashboard</h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Total Projects</p>
                  <p className="text-2xl font-bold text-secondary-900">{analytics.totalProjects}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-primary-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Active Projects</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.activeProjects}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Completed This Month</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.completedProjects}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Success Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.averageMatchRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Projects by Category</h3>
            <div className="space-y-3">
              {analytics.departmentStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-secondary-700 capitalize">{stat.department}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-secondary-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(stat.projectCount / analytics.totalProjects) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-secondary-900 w-8">
                      {stat.projectCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Performance */}
          <div className="card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Team Performance</h3>
            <div className="space-y-4">
              {analytics.departmentStats.map((stat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-secondary-900">{stat.department}</div>
                    <div className="text-sm text-secondary-600">
                      {stat.projectCount} projects managed
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-secondary-900">
                      {stat.averageMatchRate.toFixed(1)}% avg
                    </div>
                    <div className="text-sm text-secondary-600">match rate</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
