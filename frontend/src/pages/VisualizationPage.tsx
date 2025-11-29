import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useData } from '@/components/DataProvider';
import { useProjectAnalytics } from '@/hooks/useFileReconciliation';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import { usePageOrchestration } from '@/hooks/usePageOrchestration';
import {
  visualizationPageMetadata,
  getVisualizationOnboardingSteps,
  getVisualizationPageContext,
  getVisualizationWorkflowState,
  registerVisualizationGuidanceHandlers,
  getVisualizationGuidanceContent,
} from '@/orchestration/pages/VisualizationPageOrchestration';
import { BasePage, PageConfig, StatsCard, ActionConfig } from '@/components/BasePage';

const VisualizationPageContent: React.FC = () => {
  const { currentProject } = useData();
  const toast = useToast();
  const { analytics, isLoading, error, fetchAnalytics } = useProjectAnalytics(
    currentProject?.id || null
  );
  const [selectedChart, setSelectedChart] = useState<'overview' | 'systems' | 'trends'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Page Orchestration with Frenly AI
  const { updatePageContext, trackFeatureUsage, trackFeatureError } = usePageOrchestration({
    pageMetadata: visualizationPageMetadata,
    getPageContext: () =>
      getVisualizationPageContext(
        currentProject?.id,
        1, // chartsCount (simplified)
        0, // dashboardsCount
        currentProject?.name
      ),
    getOnboardingSteps: () =>
      getVisualizationOnboardingSteps(
        selectedChart !== 'overview',
        false // hasCreatedDashboard
      ),
    getWorkflowState: () => getVisualizationWorkflowState(),
    registerGuidanceHandlers: () =>
      registerVisualizationGuidanceHandlers(
        () => { },
        () => { }
      ),
    getGuidanceContent: (topic) => getVisualizationGuidanceContent(topic),
  });

  // Fetch analytics on mount and when project changes
  useEffect(() => {
    if (currentProject?.id) {
      fetchAnalytics();
    }
  }, [currentProject?.id, fetchAnalytics]);

  const handleRefresh = async () => {
    if (!currentProject) {
      toast.warning('No project selected');
      return;
    }
    setIsRefreshing(true);
    try {
      await fetchAnalytics();
      toast.success('Visualization data refreshed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      toast.error(errorMessage);
      logger.error('Refresh failed', {
        error: errorMessage,
        projectId: currentProject?.id,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (!currentProject) {
      toast.warning('No project selected');
      return;
    }
    if (!analytics) {
      toast.warning('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      const exportData = {
        selectedChart,
        analytics: {
          total_files: analytics.total_files,
          total_reconciliation_runs: analytics.total_reconciliation_runs,
          total_matched_records: analytics.total_matched_records,
          total_unmatched_records: analytics.total_unmatched_records,
          average_match_score: analytics.average_match_score,
          last_reconciliation_date: analytics.last_reconciliation_date,
        },
        timestamp: new Date().toISOString(),
        project_id: currentProject.id,
      };
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visualization-${selectedChart}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Visualization data exported successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export data';
      toast.error(errorMessage);
      logger.error('Export failed', {
        error: errorMessage,
        projectId: currentProject?.id,
        chartType: selectedChart,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleChartSelection = (chartType: 'overview' | 'systems' | 'trends') => {
    setSelectedChart(chartType);
  };

  const config: PageConfig = useMemo(() => ({
    title: 'Visualization',
    description: 'Analytics and insights for reconciliation data',
    icon: BarChart3,
    path: '/visualization',
    showStats: true,
    showActions: true,
  }), []);

  // Calculate reconciliation stats from analytics
  const reconciliationStats = useMemo(() => analytics
    ? {
      totalRecords: analytics.total_matched_records + analytics.total_unmatched_records,
      matchedRecords: analytics.total_matched_records,
      unmatchedRecords: analytics.total_unmatched_records,
      discrepancyRecords: analytics.total_unmatched_records,
    }
    : null, [analytics]);

  const stats: StatsCard[] = useMemo(() => reconciliationStats
    ? [
      {
        title: 'Total Records',
        value: reconciliationStats.totalRecords || 0,
        icon: BarChart3,
        color: 'bg-blue-100 text-blue-600',
      },
      {
        title: 'Matched',
        value: reconciliationStats.matchedRecords || 0,
        icon: CheckCircle,
        color: 'bg-green-100 text-green-600',
      },
      {
        title: 'Unmatched',
        value: reconciliationStats.unmatchedRecords || 0,
        icon: AlertCircle,
        color: 'bg-red-100 text-red-600',
      },
      {
        title: 'Reconciliation Runs',
        value: analytics?.total_reconciliation_runs || 0,
        icon: TrendingUp,
        color: 'bg-yellow-100 text-yellow-600',
      },
    ]
    : [], [reconciliationStats, analytics]);

  const actions: ActionConfig[] = useMemo(() => [
    {
      label: isRefreshing ? 'Refreshing...' : 'Refresh',
      icon: RefreshCw,
      onClick: handleRefresh,
      variant: 'secondary',
      loading: isRefreshing,
    },
    {
      label: isExporting ? 'Exporting...' : 'Export',
      icon: Download,
      onClick: handleExport,
      variant: 'secondary',
      loading: isExporting,
    },
  ], [isRefreshing, isExporting, handleRefresh, handleExport]);

  const priorityDistribution = useMemo(() => analytics
    ? [
      {
        name: 'High Priority',
        value: Math.floor(analytics.total_unmatched_records * 0.3),
        color: '#EF4444',
      },
      {
        name: 'Medium Priority',
        value: Math.floor(analytics.total_unmatched_records * 0.5),
        color: '#F59E0B',
      },
      {
        name: 'Low Priority',
        value: Math.floor(analytics.total_unmatched_records * 0.2),
        color: '#10B981',
      },
    ]
    : [], [analytics]);

  const confidenceLevels = useMemo(() => analytics
    ? [
      {
        name: 'High Confidence (>90%)',
        value: Math.floor(analytics.total_matched_records * 0.7),
        color: '#10B981',
      },
      {
        name: 'Medium Confidence (70-90%)',
        value: Math.floor(analytics.total_matched_records * 0.25),
        color: '#F59E0B',
      },
      {
        name: 'Low Confidence (<70%)',
        value: Math.floor(analytics.total_matched_records * 0.05),
        color: '#EF4444',
      },
    ]
    : [], [analytics]);

  return (
    <BasePage
      config={config}
      stats={stats}
      actions={actions}
      loading={isLoading || isRefreshing}
      error={error || undefined}
    >
      {/* Chart Selection */}
      <div className="flex items-center space-x-2">
        <Button
          variant={selectedChart === 'overview' ? 'primary' : 'ghost'}
          onClick={() => handleChartSelection('overview')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={selectedChart === 'systems' ? 'primary' : 'ghost'}
          onClick={() => handleChartSelection('systems')}
        >
          <PieChart className="w-4 h-4 mr-2" />
          Systems
        </Button>
        <Button
          variant={selectedChart === 'trends' ? 'primary' : 'ghost'}
          onClick={() => handleChartSelection('trends')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trends
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
            <div className="space-y-2">
              {priorityDistribution.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color || '#3B82F6' } as React.CSSProperties}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Levels</h3>
            <div className="space-y-2">
              {confidenceLevels.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color || '#3B82F6' } as React.CSSProperties}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Key Insights</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Match Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reconciliationStats && reconciliationStats.totalRecords > 0
                      ? (
                        (reconciliationStats.matchedRecords / reconciliationStats.totalRecords) *
                        100
                      ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Match Score</span>
                  <span className="text-sm font-medium text-gray-900">
                    {analytics?.average_match_score ? analytics.average_match_score.toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">
                    Focus on high-priority discrepancies to improve overall accuracy
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700">
                    Consider automated matching for records with &gt;90% confidence
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BasePage>
  );
};

export const VisualizationPage: React.FC = () => (
  <ErrorBoundary
    fallback={
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
        <p className="text-red-600 mt-2">
          Unable to load the visualization page. Please refresh the page.
        </p>
      </div>
    }
  >
    <VisualizationPageContent />
  </ErrorBoundary>
);
