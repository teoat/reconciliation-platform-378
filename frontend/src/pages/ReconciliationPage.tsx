import React, { useState, memo, lazy, Suspense, useEffect } from 'react';
import { logger } from '@/services/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { SkipLink } from '../components/ui/SkipLink';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { UserFriendlyError } from '../components/ui/UserFriendlyError';
import { ContextualHelp } from '../components/ui/ContextualHelp';
import { useErrorRecovery } from '../hooks/useErrorRecovery';
import { Upload } from 'lucide-react';
import { FileText } from 'lucide-react';
import { Play } from 'lucide-react';
import { Pause } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Settings } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { Users } from 'lucide-react';
import { Clock } from 'lucide-react';
import { Download } from 'lucide-react';
import { useProject } from '../hooks/useApi';
import { useDataSources } from '../hooks/useApi';
import { useReconciliationJobs } from '../hooks/useApi';
import { useReconciliationMatches } from '../hooks/useApi';
// FileDropzone will be lazy loaded
import { DataTable, Column } from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import MetricCard from '../components/ui/MetricCard';
import { SkeletonDashboard } from '../components/ui/LoadingSpinner';
import {
  apiClient,
  BackendDataSource,
  BackendReconciliationJob,
  BackendReconciliationMatch,
} from '../services/apiClient';

// Lazy load heavy components
const FileDropzone = lazy(() =>
  import('../components/EnhancedDropzone').then((module) => ({ default: module.FileDropzone }))
);

interface ReconciliationPageProps {}

const ReconciliationPage: React.FC<ReconciliationPageProps> = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Hooks
  const { project, isLoading: projectLoading } = useProject(projectId || null);
  const { dataSources, uploadFile, processFile } = useDataSources(projectId || null);
  const { jobs, createJob, startJob } = useReconciliationJobs(projectId || null);
  const { matches, updateMatch } = useReconciliationMatches(projectId || null);

  // State
  const [activeTab, setActiveTab] = useState<'upload' | 'configure' | 'run' | 'results'>('upload');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Error recovery
  const { recoveryActions, suggestions, errorTitle } = useErrorRecovery({
    error: error || '',
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
    try {
      for (const file of files) {
        try {
          const result = await uploadFile(file, projectId!, file.name, 'reconciliation_data');

          if (result.success && result.dataSource) {
            // Process the file after upload
            await processFile(result.dataSource.id);
          }
        } catch (uploadError) {
          logger.error('Upload failed:', uploadError);
          setError(uploadError instanceof Error ? uploadError : new Error('File upload failed'));
        }
      }
      setShowUploadModal(false);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Upload process failed'));
    }
  };

  // Start reconciliation job with error handling
  const handleStartReconciliation = async () => {
    if (!projectId) return;

    try {
      const result = await createJob({
        project_id: projectId,
        name: `Reconciliation Job ${new Date().toISOString()}`,
        description: 'Automated reconciliation job',
        status: 'pending',
      });

      if (result.success && result.job) {
        await startJob(result.job.id);
      } else {
        setError(new Error('Failed to create reconciliation job'));
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Failed to start reconciliation job'));
    }
  };

  // Perform data sync (placeholder)
  const performDataSync = async () => {
    // Placeholder for data sync operation
    return Promise.resolve();
  };

  // Data table columns for data sources
  const dataSourceColumns: Column<BackendDataSource>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'source_type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <StatusBadge status={value === 'reconciliation_data' ? 'success' : 'info'}>
          {value}
        </StatusBadge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge
          status={value === 'processed' ? 'success' : value === 'processing' ? 'warning' : 'info'}
        >
          {value}
        </StatusBadge>
      ),
    },
    {
      key: 'created_at',
      label: 'Uploaded',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => processFile(row.id)}
            disabled={row.status === 'processing'}
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
      key: 'id',
      label: 'Job ID',
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{value.slice(0, 8)}...</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge
          status={value === 'completed' ? 'success' : value === 'running' ? 'warning' : 'info'}
        >
          {value}
        </StatusBadge>
      ),
    },
    {
      key: 'created_at',
      label: 'Started',
      sortable: true,
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${row.status === 'completed' ? 100 : value || 0}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">
            {row.status === 'completed' ? '100%' : `${value || 0}%`}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          {row.status === 'pending' && (
            <Button size="sm" variant="primary" onClick={() => startJob(row.id)}>
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
      key: 'id',
      label: 'Match ID',
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{value.slice(0, 8)}...</span>,
    },
    {
      key: 'confidence_score',
      label: 'Confidence',
      sortable: true,
      render: (value) => {
        const progressValue = Math.round(value * 100);
        return (
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  value >= 0.8 ? 'bg-green-500' : value >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${value * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">{progressValue}%</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <StatusBadge
          status={value === 'approved' ? 'success' : value === 'pending' ? 'warning' : 'info'}
        >
          {value}
        </StatusBadge>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
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
          {row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  // Optimistic approve
                  const original = { ...row };
                  await updateMatch(row.id, { ...row, status: 'approved' });
                  try {
                    await apiClient.batchResolveMatches([{ match_id: row.id, action: 'approve' }]);
                  } catch (e) {
                    // Rollback on failure
                    await updateMatch(row.id, original);
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
                  await updateMatch(row.id, { ...row, status: 'rejected' });
                  try {
                    await apiClient.batchResolveMatches([{ match_id: row.id, action: 'reject' }]);
                  } catch (e) {
                    await updateMatch(row.id, original);
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
  }, [activeTab]);

  return (
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
      <header className="bg-white shadow-sm border-b" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900" id="page-title">
                  {project?.name ?? 'Unknown Project'}
                </h1>
                <p className="text-sm text-gray-500">Reconciliation Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="navigation-tabs">
        <div className="border-b border-gray-200">
          <div
            className="-mb-px flex space-x-8"
            role="tablist"
            aria-label="Reconciliation workflow tabs"
          >
            {[
              { id: 'upload' as const, label: 'Upload Data', icon: Upload },
              { id: 'configure' as const, label: 'Configure', icon: Settings },
              { id: 'run' as const, label: 'Run Jobs', icon: Play },
              { id: 'results' as const, label: 'Results', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTab(tab.id);
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2 inline" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
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
          <div
            id="tabpanel-upload"
            role="tabpanel"
            aria-labelledby="tab-upload"
            className="space-y-6"
          >
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Data Sources"
                value={dataSources?.length ?? 0}
                icon={<FileText className="w-6 h-6" />}
              />
              <MetricCard
                title="Processed Files"
                value={dataSources?.filter((ds) => ds?.status === 'processed').length ?? 0}
                icon={<CheckCircle className="w-6 h-6" />}
              />
              <MetricCard
                title="Active Jobs"
                value={jobs?.filter((job) => job?.status === 'running').length ?? 0}
                icon={<Clock className="w-6 h-6" />}
              />
              <MetricCard
                title="Total Matches"
                value={matches?.length ?? 0}
                icon={<Users className="w-6 h-6" />}
              />
            </div>

            {/* Data Sources Table */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">Data Sources</h3>
                    <ContextualHelp
                      trigger="hover"
                      position="right"
                      helpContent={{
                        id: 'data-sources-help',
                        title: 'Upload Data Files',
                        content:
                          'Upload CSV or Excel files containing your reconciliation data. Supported formats: .csv, .xlsx, .xls. Maximum file size: 50MB per file.',
                        tips: [
                          {
                            id: 'tip-1',
                            title: 'Upload Method',
                            content: 'Use the Upload Files button or drag and drop files',
                            category: 'tip',
                          },
                          {
                            id: 'tip-2',
                            title: 'Validation',
                            content: 'Files are automatically validated after upload',
                            category: 'tip',
                          },
                          {
                            id: 'tip-3',
                            title: 'Multiple Files',
                            content: 'Multiple files can be uploaded at once',
                            category: 'tip',
                          },
                        ],
                      }}
                    />
                  </div>
                  <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
                <DataTable
                  data={dataSources ?? []}
                  columns={dataSourceColumns}
                  emptyMessage="No data sources uploaded yet"
                />
              </div>
            </Card>
          </div>
        )}

        {/* Configure Tab */}
        {activeTab === 'configure' && (
          <div
            id="tabpanel-configure"
            role="tabpanel"
            aria-labelledby="tab-configure"
            className="space-y-6"
          >
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Reconciliation Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="matching-threshold"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Matching Threshold
                    </label>
                    <input
                      id="matching-threshold"
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={reconciliationSettings.matchingThreshold}
                      onChange={(e) =>
                        setReconciliationSettings((prev) => ({
                          ...prev,
                          matchingThreshold: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full"
                      aria-label="Matching threshold slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>10%</span>
                      <span className="font-medium">
                        {Math.round(reconciliationSettings.matchingThreshold * 100)}%
                      </span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="auto-approve"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Auto-approve matches
                    </label>
                    <input
                      id="auto-approve"
                      type="checkbox"
                      checked={reconciliationSettings.autoApprove}
                      onChange={(e) =>
                        setReconciliationSettings((prev) => ({
                          ...prev,
                          autoApprove: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label="Auto-approve matches checkbox"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Run Jobs Tab */}
        {activeTab === 'run' && (
          <div id="tabpanel-run" role="tabpanel" aria-labelledby="tab-run" className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Reconciliation Jobs</h3>
                  <Button
                    variant="primary"
                    onClick={handleStartReconciliation}
                    disabled={!dataSources || dataSources.length === 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start New Job
                  </Button>
                </div>
                <DataTable
                  data={jobs ?? []}
                  columns={jobColumns}
                  emptyMessage="No reconciliation jobs yet"
                />
              </div>
            </Card>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div
            id="tabpanel-results"
            role="tabpanel"
            aria-labelledby="tab-results"
            className="space-y-6"
          >
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Reconciliation Matches</h3>
                  <Button
                    variant="outline"
                    onClick={() => {
                      /* Export results */
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                </div>
                <DataTable
                  data={matches ?? []}
                  columns={matchColumns}
                  virtualized
                  virtualRowHeight={48}
                  virtualContainerHeight={560}
                  emptyMessage="No matches found yet"
                />
              </div>
            </Card>
          </div>
        )}
      </main>

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
  );
};

export default memo(ReconciliationPage);
