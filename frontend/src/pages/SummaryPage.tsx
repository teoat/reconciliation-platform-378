import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useData } from '@/components/DataProvider';
import { ApiService } from '@/services/ApiService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import { usePageOrchestration } from '@/hooks/usePageOrchestration';
import {
  summaryPageMetadata,
  getSummaryOnboardingSteps,
  getSummaryPageContext,
  getSummaryWorkflowState,
  registerSummaryGuidanceHandlers,
  getSummaryGuidanceContent,
} from '@/orchestration/pages/SummaryPageOrchestration';
import { BasePage, PageConfig, StatsCard, ActionConfig } from '@/components/BasePage';
import type { ReconciliationStats } from '@/types/backend-aligned';

const SummaryPageContent: React.FC = () => {
  const { currentProject } = useData();
  const toast = useToast();
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Page Orchestration with Frenly AI
  const { updatePageContext } = usePageOrchestration({
    pageMetadata: summaryPageMetadata,
    getPageContext: () =>
      getSummaryPageContext(
        currentProject?.id,
        stats?.total_matches || 0,
        stats?.total_unmatched || 0,
        stats?.average_confidence_score || 0,
        currentProject?.name
      ),
    getOnboardingSteps: () =>
      getSummaryOnboardingSteps(
        !!stats,
        (stats?.total_unmatched || 0) > 0
      ),
    getWorkflowState: () =>
      getSummaryWorkflowState(
        stats?.total_matches || 0,
        stats?.total_unmatched || 0,
        stats?.average_confidence_score || 0
      ),
    registerGuidanceHandlers: () => registerSummaryGuidanceHandlers(),
    getGuidanceContent: (topic) => getSummaryGuidanceContent(topic),
  });

  const fetchStats = async () => {
    if (!currentProject) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await ApiService.getReconciliationStats(currentProject.id);
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        setStats(response.data);
      } else {
        // Fallback if data is directly returned (depends on API wrapper behavior)
        setStats(response as unknown as ReconciliationStats);
      }
      toast.success('Summary data refreshed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch summary stats';
      setError(errorMessage);
      logger.error('Failed to fetch summary stats', { error: errorMessage, projectId: currentProject.id });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentProject?.id) {
      fetchStats();
    }
  }, [currentProject?.id]);

  const handleExport = async () => {
    if (!currentProject || !stats) {
      toast.warning('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      const exportData = {
        project: currentProject.name,
        timestamp: new Date().toISOString(),
        stats,
      };
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary-${currentProject.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Summary exported successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export summary';
      logger.error('Export failed', { error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const config: PageConfig = useMemo(() => ({
    title: 'Summary',
    description: 'High-level overview of reconciliation status',
    icon: FileText,
    path: '/summary',
    showStats: true,
    showActions: true,
  }), []);

  const statsCards: StatsCard[] = useMemo(() => stats
    ? [
      {
        title: 'Total Jobs',
        value: stats.total_jobs,
        icon: Activity,
        color: 'bg-blue-100 text-blue-600',
      },
      {
        title: 'Match Rate',
        value: `${(stats.match_rate * 100).toFixed(1)}%`,
        icon: TrendingUp,
        color: 'bg-green-100 text-green-600',
        progress: stats.match_rate * 100,
      },
      {
        title: 'Matched Records',
        value: stats.total_matches,
        icon: CheckCircle,
        color: 'bg-indigo-100 text-indigo-600',
      },
      {
        title: 'Unmatched',
        value: stats.total_unmatched,
        icon: AlertCircle,
        color: 'bg-red-100 text-red-600',
      },
    ]
    : [], [stats]);

  const actions: ActionConfig[] = useMemo(() => [
    {
      label: isLoading ? 'Refreshing...' : 'Refresh',
      icon: RefreshCw,
      onClick: fetchStats,
      variant: 'secondary',
      loading: isLoading,
    },
    {
      label: isExporting ? 'Exporting...' : 'Export',
      icon: Download,
      onClick: handleExport,
      variant: 'secondary',
      loading: isExporting,
    },
  ], [isLoading, isExporting]);

  return (
    <BasePage
      config={config}
      stats={statsCards}
      actions={actions}
      loading={isLoading && !stats} // Only show full loading state if no data
      error={error}
    >
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Avg. Confidence Score</span>
                <span className="font-semibold text-gray-900">
                  {(stats.average_confidence_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Avg. Processing Time</span>
                <span className="font-semibold text-gray-900">
                  {stats.average_processing_time_ms.toFixed(0)} ms
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Completed Jobs</span>
                <span className="font-semibold text-green-600">{stats.completed_jobs}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Failed Jobs</span>
                <span className="font-semibold text-red-600">{stats.failed_jobs}</span>
              </div>
            </div>
          </div>

          {/* Recommendations / Next Steps */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-4">
              {stats.total_unmatched > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Review Unmatched Records</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      You have {stats.total_unmatched} unmatched records requiring attention.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-yellow-800 hover:text-yellow-900 hover:bg-yellow-100 p-0 h-auto font-medium"
                      onClick={() => window.location.href = '/adjudication'} // Simple navigation for now
                    >
                      Go to Adjudication <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
              {stats.failed_jobs > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Investigate Failed Jobs</h4>
                    <p className="text-sm text-red-700 mt-1">
                      {stats.failed_jobs} jobs failed to complete. Check logs for details.
                    </p>
                  </div>
                </div>
              )}
              {stats.match_rate < 0.8 && stats.total_jobs > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Improve Match Rate</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Match rate is below 80%. Consider refining matching rules.
                    </p>
                  </div>
                </div>
              )}
              {stats.total_jobs === 0 && (
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <Activity className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Get Started</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      No reconciliation jobs found. Create your first job to see stats.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </BasePage>
  );
};

export const SummaryPage: React.FC = () => (
  <ErrorBoundary
    fallback={
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
        <p className="text-red-600 mt-2">
          Unable to load the summary page. Please refresh the page.
        </p>
      </div>
    }
  >
    <SummaryPageContent />
  </ErrorBoundary>
);
