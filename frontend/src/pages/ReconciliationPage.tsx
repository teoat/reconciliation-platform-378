import React, { useState, memo, lazy, Suspense, useEffect } from 'react';
import { toRecord } from '@/utils/typeHelpers';
import { logger } from '@/services/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { SkipLink } from '@/components/ui/SkipLink';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { UserFriendlyError } from '@/components/ui/UserFriendlyError';
import { ContextualHelp } from '@/components/ui/ContextualHelp';
import { EnhancedContextualHelp } from '@/components/ui/EnhancedContextualHelp';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { usePageOrchestration } from '@/hooks/usePageOrchestration';
import {
  reconciliationPageMetadata,
  getReconciliationOnboardingSteps,
  getReconciliationPageContext,
  getReconciliationWorkflowState,
  registerReconciliationGuidanceHandlers,
  getReconciliationGuidanceContent,
} from '@/orchestration/examples/ReconciliationPageOrchestration';
import {
  Upload,
  FileText,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Settings,
  BarChart3,
  Users,
  Clock,
  Download,
} from 'lucide-react';
import { useProject } from '@/hooks/api';
import { useDataSourcesAPI } from '@/hooks/api-enhanced/useDataSourcesAPI';
import { useReconciliationJobsAPI } from '@/hooks/api-enhanced/useReconciliationJobsAPI';
import { useReconciliationMatchesAPI } from '@/hooks/api-enhanced/useReconciliationMatchesAPI';

// Wrapper functions to match expected interface
const useDataSources = (projectId: string | null) => {
  const result = useDataSourcesAPI(projectId || undefined);
  return {
    dataSources: result.dataSources || [],
    uploadFile: result.uploadFile,
    processFile: result.processFile,
    isLoading: result.isLoading,
    error: result.error,
  };
};

const useReconciliationMatches = (projectId: string | null) => {
  const result = useReconciliationMatchesAPI(projectId || undefined);
  // Convert ReconciliationMatch[] to BackendReconciliationMatch[]
  const convertedMatches: BackendReconciliationMatch[] = (result.matches || []).map((match) => ({
    id: match.id,
    project_id: match.projectId || projectId || '',
    source_record_id: match.recordAId || '',
    target_record_id: match.recordBId || '',
    confidence_score: match.confidenceScore || 0,
    match_type: match.matchType || 'automatic',
    status: match.status || 'pending',
    created_at: match.createdAt || new Date().toISOString(),
    updated_at: match.updatedAt || new Date().toISOString(),
  } as unknown as BackendReconciliationMatch));
  
  return {
    matches: convertedMatches,
    updateMatch: result.updateMatch,
    isLoading: result.isLoading,
    error: result.error,
  };
};

const useReconciliationJobs = (projectId: string | null) => {
  const result = useReconciliationJobsAPI(projectId || undefined);
  return {
    jobs: result.jobs || [],
    createJob: result.createJob,
    startJob: result.startJob,
    isLoading: result.isLoading,
    error: result.error,
  };
};
import { useReconciliationOperations } from '@/hooks/reconciliation/useReconciliationOperations';
// FileDropzone will be lazy loaded
import { DataTable, Column } from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { SkeletonDashboard } from '@/components/ui/LoadingSpinner';
import {
  apiClient,
  BackendDataSource,
  BackendReconciliationJob,
  BackendReconciliationMatch,
} from '@/services/apiClient';
import { PageMeta } from '@/components/seo/PageMeta';
import { ReconciliationHeader } from '@/components/reconciliation/ReconciliationHeader';
import { ReconciliationTabs } from '@/components/reconciliation/ReconciliationTabs';
import { UploadTabContent } from '@/components/reconciliation/UploadTabContent';
import { ConfigureTabContent } from '@/components/reconciliation/ConfigureTabContent';
import { RunTabContent } from '@/components/reconciliation/RunTabContent';
import { ResultsTabContent } from '@/components/reconciliation/ResultsTabContent';

// Lazy load heavy components
const FileDropzone = lazy(() =>
  import('@/components/files').then((module) => ({ default: module.FileDropzone || module.EnhancedDropzone }))
);

const ReconciliationPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Hooks
  const { project, isLoading: projectLoading } = useProject(projectId || null);
  const { dataSources, uploadFile, processFile } = useDataSources(projectId || null);
  const { jobs, createJob: _createJob, startJob } = useReconciliationJobs(projectId || null);
  const { matches, updateMatch } = useReconciliationMatches(projectId || null);

  // Reconciliation operations hook
  const {
    isCreatingJob: _isCreatingJob,
    isStartingJob: _isStartingJob,
    error: _reconciliationError,
    startReconciliation,
  } = useReconciliationOperations({
    projectId,
    onJobCreated: (jobId) => {
      logger.info('Reconciliation job created', { jobId });
      trackFeatureUsage('reconciliation', 'job-created', { jobId });
    },
    onJobStarted: (jobId) => {
      logger.info('Reconciliation job started', { jobId });
      trackFeatureUsage('reconciliation', 'job-started', { jobId });
    },
    onError: (error) => {
      setError(error);
      trackFeatureError('reconciliation', error);
    },
  });

  // State
  const [activeTab, setActiveTab] = useState<'upload' | 'configure' | 'run' | 'results'>('upload');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [completedTabs, setCompletedTabs] = useState<string[]>([]);

  // Page Orchestration with Frenly AI
  const { updatePageContext, trackFeatureUsage, trackFeatureError, trackUserAction } =
    usePageOrchestration({
      pageMetadata: reconciliationPageMetadata,
      getPageContext: () =>
        getReconciliationPageContext(
          projectId,
          activeTab,
          dataSources?.length || 0,
          jobs?.length || 0,
          matches?.length || 0,
          project?.name
        ),
      getOnboardingSteps: () =>
        getReconciliationOnboardingSteps(
          activeTab,
          (dataSources?.length || 0) > 0,
          (jobs?.length || 0) > 0
        ),
      getWorkflowState: () => getReconciliationWorkflowState(activeTab, completedTabs),
      registerGuidanceHandlers: () =>
        registerReconciliationGuidanceHandlers(
          () => setActiveTab('upload'),
          () => setActiveTab('configure'),
          () => setActiveTab('run'),
          () => setActiveTab('results')
        ),
      getGuidanceContent: (topic) => getReconciliationGuidanceContent(topic),
      onContextChange: (changes) => {
        // Handle context changes if needed
        if (changes.activeTab) {
          logger.debug('Tab changed', { tab: changes.activeTab });
        }
      },
    });

  // Error recovery
  const { recoveryActions, suggestions, errorTitle } = useErrorRecovery({
    error: error ? (error instanceof Error ? error : new Error(String(error))) : '',
    context: { component: 'ReconciliationPage', action: 'data-operation' },
    onRetry: async () => {
      setError(null);
      // Retry the last operation
      await performDataSync();
    },
    onReset: () => {
      setError(null);
      // Reset component state
    },
  });

  const [reconciliationSettings, setReconciliationSettings] = useState({
    matchingThreshold: 0.8,
    autoApprove: false,
    notificationEmail: '',
    dataSourceMapping: {},
  });

  // Handle file upload with error handling
  const handleFileUpload = async (files: File[]) => {
    trackFeatureUsage('upload', 'file-upload-started', { fileCount: files.length });
    try {
      for (const file of files) {
        try {
          const result = await uploadFile(file, {
            name: file.name,
            source_type: 'reconciliation_data',
          });

          if (result.success && result.dataSource) {
            // Process the file after upload
            await processFile(result.dataSource.id);
            trackFeatureUsage('upload', 'file-upload-success', { fileName: file.name });
          }
        } catch (uploadError) {
          logger.error('Upload failed:', uploadError);
          const error =
            uploadError instanceof Error ? uploadError : new Error('File upload failed');
          setError(error);
          trackFeatureError('upload', error);
        }
      }
      setShowUploadModal(false);
      // Mark upload tab as completed
      if (!completedTabs.includes('upload')) {
        setCompletedTabs([...completedTabs, 'upload']);
      }
      // Update page context
      updatePageContext({ dataSourcesCount: dataSources?.length || 0 });
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload process failed');
      setError(uploadError);
      trackFeatureError('upload', uploadError);
    }
  };

  // Start reconciliation job with error handling
  const handleStartReconciliation = async () => {
    trackFeatureUsage('run-jobs', 'job-creation-started');
    trackUserAction('button-clicked', 'start-reconciliation-button');
    await startReconciliation();
    // Mark run tab as completed
    if (!completedTabs.includes('run')) {
      setCompletedTabs([...completedTabs, 'run']);
    }
    // Update page context
    updatePageContext({ jobsCount: jobs?.length || 0 });
  };

  // Perform data sync (placeholder)
  const performDataSync = async () => {
    // Placeholder for data sync operation
    return Promise.resolve();
  };

  // Data table columns for data sources
  const dataSourceColumns: Column<BackendDataSource>[] = [
    {
      key: 'filename' as keyof BackendDataSource,
      header: 'Name',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{String(value)}</span>
        </div>
      ),
    },
    {
      key: 'content_type' as keyof BackendDataSource,
      header: 'Type',
      sortable: true,
      render: (value) => (
        <StatusBadge status={String(value) === 'reconciliation_data' ? 'success' : 'info'}>                                                                             
          {String(value)}
        </StatusBadge>
      ),
    },
    {
      key: 'status' as keyof BackendDataSource,
      header: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge
          status={String(value) === 'processed' ? 'success' : String(value) === 'processing' ? 'warning' : 'info'}                                                              
        >
          {String(value)}
        </StatusBadge>
      ),
    },
    {
      key: 'created_at' as keyof BackendDataSource,
      header: 'Uploaded',
      sortable: true,
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
    {
      key: 'id' as keyof BackendDataSource,
      header: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => processFile(String((row as unknown as BackendDataSource).id))}
            disabled={(row as unknown as BackendDataSource).status === 'processing'}
          >
            Process
          </Button>
        </div>
      ),
    },
  ];

  // Data table columns for reconciliation jobs
  const jobColumns: Column<BackendReconciliationJob>[] = [
    {
      key: 'id' as keyof BackendReconciliationJob,
      header: 'Job ID',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{value ? String(value).slice(0, 8) : 'N/A'}...</span>                                                                       
      ),
    },
    {
      key: 'status' as keyof BackendReconciliationJob,
      header: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge
          status={String(value) === 'completed' ? 'success' : String(value) === 'running' ? 'warning' : 'info'}                                                                 
        >
          {String(value)}
        </StatusBadge>
      ),
    },
    {
      key: 'created_at' as keyof BackendReconciliationJob,
      header: 'Started',
      sortable: true,
      render: (value) => (value ? new Date(String(value)).toLocaleString() : 'N/A'),
    },
    {
      key: 'progress' as keyof BackendReconciliationJob,
      header: 'Progress',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              // Dynamic width for progress bar - acceptable inline style
              style={
                {
                  width: `${row.status === 'completed' ? 100 : value || 0}%`,
                } as React.CSSProperties
              }
            />
          </div>
          <span className="text-sm text-gray-600">
            {row.status === 'completed' ? '100%' : `${value || 0}%`}
          </span>
        </div>
      ),
    },
    {
      key: 'id' as keyof BackendReconciliationJob,
      header: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          {(row as unknown as BackendReconciliationJob).status === 'pending' && (
            <Button size="sm" variant="primary" onClick={() => startJob(String(row.id))}>
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          {row.status === 'running' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                /* Pause job */
              }}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          {row.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/projects/${projectId}/results/${row.id}`)}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              View Results
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Data table columns for matches
  const matchColumns: Column<BackendReconciliationMatch>[] = [
    {
      key: 'id' as keyof BackendReconciliationMatch,
      header: 'Match ID',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{value ? String(value).slice(0, 8) : 'N/A'}...</span>                                                                       
      ),
    },
    {
      key: 'confidence_score' as keyof BackendReconciliationMatch,
      header: 'Confidence',
      sortable: true,
      render: (value) => {
        const score = typeof value === 'number' ? value : 0;
        const progressValue = Math.round(score * 100);
        return (
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  score >= 0.8 ? 'bg-green-500' : score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'                                                                 
                }`}
                // Dynamic width for progress bar - acceptable inline style
                style={{ width: `${score * 100}%` } as React.CSSProperties}
              />
            </div>
            <span className="text-sm font-medium">{progressValue}%</span>
          </div>
        );
      },
    },
    {
      key: 'match_type' as keyof BackendReconciliationMatch,
      header: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge
          status={String(value) === 'approved' ? 'success' : String(value) === 'pending' ? 'warning' : 'info'}                                                                  
        >
          {String(value)}
        </StatusBadge>
      ),
    },
    {
      key: 'created_at' as keyof BackendReconciliationMatch,
      header: 'Created',
      sortable: true,
      render: (value) => (value ? new Date(String(value)).toLocaleDateString() : 'N/A'),
    },
    {
      key: 'id' as keyof BackendReconciliationMatch,
      header: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              /* View match details */
            }}
          >
            View Details
          </Button>
          {((row as unknown as BackendReconciliationMatch).match_type === 'pending' || (row as unknown as BackendReconciliationMatch).match_type === 'manual') && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  // Optimistic approve
                  const original = { ...row };
                  const matchId = String((row as unknown as BackendReconciliationMatch).id);
                  await updateMatch(matchId, { match_type: 'exact' } as Partial<BackendReconciliationMatch>);
                  try {
                    if (projectId) {
                      await apiClient.updateReconciliationMatch(projectId, matchId, { status: 'approved' });
                    }
                  } catch (e) {
                    // Rollback on failure
                    await updateMatch(matchId, original as Partial<BackendReconciliationMatch>);
                  }
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  const original = { ...row };
                  const matchId = String((row as unknown as BackendReconciliationMatch).id);
                  await updateMatch(matchId, { match_type: 'manual' } as Partial<BackendReconciliationMatch>);
                  try {
                    if (projectId) {
                      await apiClient.updateReconciliationMatch(projectId, matchId, { status: 'rejected' });
                    }
                  } catch (e) {
                    await updateMatch(matchId, original as Partial<BackendReconciliationMatch>);
                  }
                }}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <SkeletonDashboard />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The requested project could not be found.</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Keyboard navigation for tabs
  useKeyboardNavigation({
    onArrowLeft: () => {
      const tabs: ('upload' | 'configure' | 'run' | 'results')[] = [
        'upload',
        'configure',
        'run',
        'results',
      ];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    },
    onArrowRight: () => {
      const tabs: ('upload' | 'configure' | 'run' | 'results')[] = [
        'upload',
        'configure',
        'run',
        'results',
      ];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    },
    enabled: true,
  });

  // Focus management on tab change
  useEffect(() => {
    // Announce tab change to screen readers
    const tabNames: Record<string, string> = {
      upload: 'Upload Data',
      configure: 'Configure',
      run: 'Run Jobs',
      results: 'Results',
    };
    const announcement = document.getElementById('tab-announcement');
    if (announcement) {
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = `Switched to ${tabNames[activeTab]} tab`;
      setTimeout(() => {
        announcement.textContent = '';
      }, 1000);
    }
    // Update page context when tab changes
    updatePageContext({ activeTab });
    trackUserAction('tab-changed', `tab-${activeTab}`);
  }, [activeTab, updatePageContext, trackUserAction]);

  return (
    <>
      <PageMeta
        title={`Reconciliation - ${project?.name || 'Project'}`}
        description="Manage reconciliation jobs, upload data sources, configure matching rules, and view results."
        keywords="reconciliation, data matching, project, jobs, results"
      />
      <div className="min-h-screen bg-gray-50">
        {/* Skip Links */}
        <SkipLink href="#main-content" label="Skip to main content" />
        <SkipLink href="#navigation-tabs" label="Skip to navigation tabs" />

        {/* Screen reader announcements */}
        <div
          id="tab-announcement"
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />

        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {project?.name ? `Reconciliation: ${project.name}` : 'Reconciliation'}
          </h1>
          <ReconciliationHeader
            projectName={project?.name}
            onSettingsClick={() => setShowSettingsModal(true)}
            onUploadClick={() => setShowUploadModal(true)}
          />
        </div>

        {/* Navigation Tabs */}
        <ReconciliationTabs
          activeTab={activeTab}
          completedTabs={completedTabs}
          onTabChange={setActiveTab}
        />

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User-Friendly Error Display */}
          {error && (
            <div className="mb-6">
              <UserFriendlyError
                error={error || 'Unknown error'}
                title={errorTitle}
                context="Reconciliation workflow"
                recoveryActions={recoveryActions}
                suggestions={suggestions}
                onDismiss={() => setError(null)}
                errorId="reconciliation-error"
              />
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <UploadTabContent
              dataSources={dataSources}
              jobs={jobs}
              matches={matches}
              dataSourceColumns={dataSourceColumns}
              onUploadClick={() => setShowUploadModal(true)}
            />
          )}

          {/* Configure Tab */}
          {activeTab === 'configure' && (
            <ConfigureTabContent
              reconciliationSettings={reconciliationSettings}
              setReconciliationSettings={setReconciliationSettings}
            />
          )}

          {/* Run Jobs Tab */}
          {activeTab === 'run' && (
            <RunTabContent
              dataSources={dataSources}
              jobs={jobs}
              jobColumns={jobColumns}
              onStartReconciliation={handleStartReconciliation}
            />
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <ResultsTabContent matches={matches} matchColumns={matchColumns} />
          )}
        </div>

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Data Files"
        >
          <div className="p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              <FileDropzone
                onFilesSelected={handleFileUpload}
                accept=".csv,.xlsx,.json"
                maxFiles={5}
                maxSize={50 * 1024 * 1024} // 50MB
              />
            </Suspense>
          </div>
        </Modal>

        {/* Settings Modal */}
        <Modal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="Reconciliation Settings"
        >
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="notification-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Notification Email
                </label>
                <input
                  id="notification-email"
                  type="email"
                  value={reconciliationSettings.notificationEmail}
                  onChange={(e) =>
                    setReconciliationSettings((prev) => ({
                      ...prev,
                      notificationEmail: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email for notifications"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setShowSettingsModal(false)}>
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default memo(ReconciliationPage);
