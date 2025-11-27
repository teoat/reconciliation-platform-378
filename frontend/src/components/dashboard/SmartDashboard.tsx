'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { TrendingUp, TrendingDown, Clock, Users, Target, AlertCircle, CheckCircle, BarChart3, PieChart } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import type { BackendProject } from '@/services/apiClient/types';
import { getErrorMessageFromApiError } from '@/utils/common/errorHandling';
import { SmartDashboardMetricCard } from './SmartDashboardMetricCard';
import { SmartDashboardProjectCard } from './SmartDashboardProjectCard';

interface SmartDashboardProps {
  project?: BackendProject;
}

interface DashboardData {
  user_metrics: {
    user_id: string;
    overall_score: number;
    project_completion_rate: number;
    average_task_time: number;
    productivity_trend: string;
    recommendations: string[];
  };
  prioritized_projects: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    priority_score: number;
    productivity_impact: number;
    estimated_completion?: string;
    smart_recommendations: string[];
  }>;
  smart_insights: string[];
  next_actions: string[];
}

const SmartDashboard = memo(({ project: _project }: SmartDashboardProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/dashboard/smart');

      if (response.error) {
        setError(getErrorMessageFromApiError(response.error));
      } else if (response.data) {
        setDashboardData(response.data as DashboardData);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 rounded-lg h-96"></div>
            <div className="bg-gray-200 rounded-lg h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { user_metrics, prioritized_projects, smart_insights, next_actions } = dashboardData;

  // Safe access with fallbacks
  const userMetrics = user_metrics ?? {
    overall_score: 0,
    productivity_trend: 'stable' as const,
    project_completion_rate: 0,
    average_task_time: 0,
  };
  const projects = prioritized_projects ?? [];
  // Future use: smart_insights and next_actions
  // const insights = smart_insights ?? [];
  // const actions = next_actions ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Smart Dashboard</h1>
          <p className="text-gray-600 mt-1">AI-powered insights and project prioritization</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-600">Live Data</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SmartDashboardMetricCard
          label="Productivity Score"
          value={`${Math.round((userMetrics.overall_score ?? 0) * 100)}%`}
          icon={Target}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          trend={
            <div className="flex items-center">
              {userMetrics.productivity_trend === 'increasing' ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-gray-400 mr-1" />
              )}
              <span className="text-sm text-gray-600 capitalize">
                {userMetrics.productivity_trend ?? 'stable'}
              </span>
            </div>
          }
        />
        <SmartDashboardMetricCard
          label="Completion Rate"
          value={`${Math.round((userMetrics.project_completion_rate ?? 0) * 100)}%`}
          icon={CheckCircle}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          progressBar={{
            value: (userMetrics.project_completion_rate ?? 0) * 100,
            color: 'bg-green-500',
          }}
        />
        <SmartDashboardMetricCard
          label="Avg Task Time"
          value={`${(userMetrics.average_task_time ?? 0).toFixed(1)}h`}
          icon={Clock}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-600"
          subtitle="Per task"
        />
        <SmartDashboardMetricCard
          label="Active Projects"
          value={projects.length}
          icon={Users}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          subtitle="In progress"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prioritized Projects */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Prioritized Projects
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {projects.map((project) => (
                <SmartDashboardProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </div>

        {/* Smart Insights & Next Actions */}
        <div className="space-y-6">
          {/* Smart Insights */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-green-600" />
                Smart Insights
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {smart_insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Actions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-600" />
                Next Actions
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {next_actions.map((action, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-purple-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {user_metrics.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Personalized Recommendations
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user_metrics.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SmartDashboard.displayName = 'SmartDashboard';

export default SmartDashboard;
