import React, { useState, useEffect } from 'react';
import { BarChart3, Target, CheckCircle, Clock, Users, PieChart } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { getErrorMessageFromApiError } from '../utils/errorExtraction';
import { usePageOrchestration } from '../hooks/usePageOrchestration';
import { logger } from '../services/logger';
import {
  dashboardPageMetadata,
  getDashboardOnboardingSteps,
  getDashboardPageContext,
  registerDashboardGuidanceHandlers,
  getDashboardGuidanceContent,
} from '../orchestration/pages/DashboardPageOrchestration';

// Interfaces (shared with main index.tsx)
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

// BasePage component (simplified for this extraction)
interface BasePageProps {
  config: PageConfig;
  stats?: StatsCard[];
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

const BasePage: React.FC<BasePageProps> = ({ config, stats, loading, error, children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <config.icon className="w-8 h-8 text-blue-600" aria-hidden={true} />
            <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
          </div>
          <p className="text-lg text-gray-600">{config.description}</p>
        </header>

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        // Dynamic width for progress bar - acceptable inline style
                        style={{ width: `${stat.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && children}
      </div>
    </div>
  );
};

interface DashboardData {
  user_metrics?: {
    user_id: string;
    overall_score: number;
    project_completion_rate: number;
    average_task_time: number;
    productivity_trend: string;
    recommendations: string[];
  };
  prioritized_projects?: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    priority_score: number;
    productivity_impact: number;
    estimated_completion?: string;
    smart_recommendations?: string[];
  }>;
  smart_insights?: string[];
  next_actions?: string[];
}

export const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Page Orchestration with Frenly AI
  const { updatePageContext, trackFeatureUsage, trackFeatureError } = usePageOrchestration({
    pageMetadata: dashboardPageMetadata,
    getPageContext: () =>
      getDashboardPageContext(
        dashboardData?.prioritized_projects?.length || 0,
        dashboardData?.prioritized_projects?.filter((p) => p.status === 'active').length || 0,
        dashboardData?.prioritized_projects?.filter((p) => p.status === 'completed').length || 0,
        dashboardData?.user_metrics?.overall_score
      ),
    getOnboardingSteps: () =>
      getDashboardOnboardingSteps(
        (dashboardData?.prioritized_projects?.length || 0) > 0,
        (dashboardData?.prioritized_projects?.filter((p) => p.status === 'completed').length || 0) >
          0
      ),
    registerGuidanceHandlers: () => registerDashboardGuidanceHandlers(),
    getGuidanceContent: (topic) => getDashboardGuidanceContent(topic),
    onContextChange: (changes) => {
      // Handle context changes if needed
      logger.debug('Dashboard context changed', { changes });
    },
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      trackFeatureUsage('dashboard', 'data-load-started');
      const response = await apiClient.getDashboardData();

      if (response.error) {
        const errorMessage = getErrorMessageFromApiError(response.error);
        setError(errorMessage);
        trackFeatureError('dashboard', new Error(errorMessage));
      } else if (response.data) {
        const data = response.data as DashboardData;
        setDashboardData(data);
        trackFeatureUsage('dashboard', 'data-load-success');
        // Update context when data loads
        updatePageContext({
          projectsCount: data.prioritized_projects?.length || 0,
          productivityScore: data.user_metrics?.overall_score,
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load dashboard data');
      setError(error.message);
      trackFeatureError('dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const config: PageConfig = {
    title: 'Smart Dashboard',
    description: 'AI-powered insights and project prioritization',
    icon: BarChart3,
    path: '/dashboard',
    showStats: true,
  };

  const stats: StatsCard[] = dashboardData
    ? [
        {
          title: 'Productivity Score',
          value: `${Math.round((dashboardData.user_metrics?.overall_score ?? 0) * 100)}%`,
          icon: Target,
          color: 'bg-blue-100 text-blue-600',
          trend: {
            direction:
              dashboardData.user_metrics?.productivity_trend === 'increasing' ? 'up' : 'down',
            value: dashboardData.user_metrics?.productivity_trend || 'stable',
          },
        },
        {
          title: 'Completion Rate',
          value: `${Math.round((dashboardData.user_metrics?.project_completion_rate ?? 0) * 100)}%`,
          icon: CheckCircle,
          color: 'bg-green-100 text-green-600',
          progress: (dashboardData.user_metrics?.project_completion_rate ?? 0) * 100,
        },
        {
          title: 'Avg Task Time',
          value: `${dashboardData.user_metrics?.average_task_time?.toFixed(1) || 0}h`,
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-600',
        },
        {
          title: 'Active Projects',
          value: dashboardData.prioritized_projects?.length || 0,
          icon: Users,
          color: 'bg-purple-100 text-purple-600',
        },
      ]
    : [];

  return (
    <BasePage config={config} stats={stats} loading={loading} error={error}>
      {dashboardData && (
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
                {dashboardData.prioritized_projects?.map((project) => (
                  <div
                    key={project.id as string}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{String(project.name)}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {String(project.description)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : project.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {String(project.status)}
                        </span>
                        <span className="text-sm font-medium text-blue-600">
                          {typeof project.priority_score === 'number'
                            ? Math.round(project.priority_score * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Priority Score</span>
                        <span>
                          {typeof project.priority_score === 'number'
                            ? Math.round(project.priority_score * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          // Dynamic width for progress bar - acceptable inline style
                          style={{
                            width: `${typeof project.priority_score === 'number' ? project.priority_score * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {project.smart_recommendations && project.smart_recommendations.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Recommendations:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {project.smart_recommendations
                            .slice(0, 2)
                            .map((rec: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {rec}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
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
                  {dashboardData.smart_insights?.map((insight, index) => (
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
                  {dashboardData.next_actions?.map((action, index) => (
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
      )}
    </BasePage>
  );
};

export default DashboardPage;
