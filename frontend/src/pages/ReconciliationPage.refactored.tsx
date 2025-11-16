import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useApi';
import { SkipLink } from '../components/ui/SkipLink';
import { UserFriendlyError } from '../components/ui/UserFriendlyError';
import { useErrorRecovery } from '../hooks/useErrorRecovery';
import { FileDropzone } from '../components/EnhancedDropzone';
import { DataTable, Column } from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import MetricCard from '../components/ui/MetricCard';
import Modal from '../components/ui/Modal';
import { SkeletonDashboard } from '../components/ui/LoadingSpinner';
import {
  apiClient,
  BackendDataSource,
  BackendReconciliationJob,
  BackendReconciliationMatch,
} from '../services/apiClient';
import { ReconciliationResults } from '../components/reconciliation/ReconciliationResults';
import { MatchingRules } from '../components/reconciliation/MatchingRules';
import { ConflictResolution } from '../components/reconciliation/ConflictResolution';
import { ReconciliationSummary } from '../components/reconciliation/ReconciliationSummary';
import { useReconciliationEngine } from '../hooks/reconciliation/useReconciliationEngine';
import { useMatchingRules } from '../hooks/reconciliation/useMatchingRules';
import { useConflictResolution } from '../hooks/reconciliation/useConflictResolution';
import { Upload, Settings, Play, BarChart3, Download } from 'lucide-react';

const ReconciliationPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Hooks
  const { project, isLoading: projectLoading } = useProject(projectId || null);
  const { state: engineState, actions: engineActions } = useReconciliationEngine();
  const { state: rulesState, actions: rulesActions } = useMatchingRules();
  const { state: conflictState, actions: conflictActions } = useConflictResolution();

  // Local state
  const [activeTab, setActiveTab] = useState<'upload' | 'configure' | 'run' | 'results'>('upload');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Mock data sources and jobs (would come from hooks in real implementation)
  const [dataSources] = useState<BackendDataSource[]>([]);
  const [jobs] = useState<BackendReconciliationJob[]>([]);
  const [matches] = useState<BackendReconciliationMatch[]>([]);

  // Error recovery
  const { recoveryActions, suggestions, errorTitle } = useErrorRecovery({
    error: error?.message || '',
    context: { component: 'ReconciliationPage', action: 'data-operation' },
    onRetry: async () => {
      setError(null);
      // Retry logic would go here
    },
    onReset: () => {
      setError(null);
    },
  });

  // File upload handler
  const handleFileUpload = async (files: File[]) => {
    try {
      // Implementation would use proper upload hooks
      setShowUploadModal(false);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Upload failed'));
    }
  };

  // Start reconciliation
  const handleStartReconciliation = async () => {
    if (!projectId) return;

    try {
      // Mock data for demonstration
      const sourceData = [
        { id: '1', name: 'John Doe', amount: 1000 },
        { id: '2', name: 'Jane Smith', amount: 2000 },
      ];
      const targetData = [
        { id: 'A', name: 'John Doe', amount: 1000 },
        { id: 'B', name: 'Jane Smith', amount: 1999 }, // Slight discrepancy
      ];

      await engineActions.startReconciliation(sourceData, targetData, rulesState.activeRules);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Reconciliation failed'));
    }
  };

  // Data table columns (simplified)
  const dataSourceColumns: Column<BackendDataSource>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <StatusBadge status={value === 'processed' ? 'success' : 'info'}>{value}</StatusBadge>
      ),
    },
  ];

  const jobColumns: Column<BackendReconciliationJob>[] = [
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <StatusBadge status={value === 'completed' ? 'success' : 'warning'}>{value}</StatusBadge>
      ),
    },
    {
      key: 'created_at',
      label: 'Started',
      render: (value) => new Date(value).toLocaleString(),
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The requested project could not be found.</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Links */}
      <SkipLink href="#main-content" label="Skip to main content" />
      <SkipLink href="#navigation-tabs" label="Skip to navigation tabs" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{project?.name ?? 'Project'}</h1>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav
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
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2 inline" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <UserFriendlyError
              error={error.message}
              title={errorTitle}
              context="Reconciliation workflow"
              recoveryActions={recoveryActions}
              suggestions={suggestions}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Data Sources"
                value={dataSources.length}
                icon={<Upload className="w-6 h-6" />}
              />
              <MetricCard
                title="Processed Files"
                value={dataSources.filter((ds) => ds.status === 'processed').length}
                icon={<CheckCircle className="w-6 h-6" />}
              />
              <MetricCard
                title="Active Jobs"
                value={jobs.filter((job) => job.status === 'running').length}
                icon={<Clock className="w-6 h-6" />}
              />
              <MetricCard
                title="Total Matches"
                value={matches.length}
                icon={<Users className="w-6 h-6" />}
              />
            </div>

            {/* Data Sources Table */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Data Sources</h3>
                  <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
                <DataTable
                  data={dataSources}
                  columns={dataSourceColumns}
                  emptyMessage="No data sources uploaded yet"
                />
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'configure' && (
          <div className="space-y-6">
            <MatchingRules rules={rulesState.rules} onRulesChange={rulesActions.updateRule} />
          </div>
        )}

        {activeTab === 'run' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Reconciliation Jobs</h3>
                  <Button
                    variant="primary"
                    onClick={handleStartReconciliation}
                    disabled={engineState.isProcessing}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {engineState.isProcessing ? 'Processing...' : 'Start New Job'}
                  </Button>
                </div>
                <DataTable
                  data={jobs}
                  columns={jobColumns}
                  emptyMessage="No reconciliation jobs yet"
                />
              </div>
            </Card>

            {/* Reconciliation Summary */}
            <ReconciliationSummary
              metrics={engineState.metrics}
              isLoading={engineState.isProcessing}
            />
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            <ReconciliationResults matches={matches} onExport={() => {}} isLoading={false} />

            {/* Conflict Resolution */}
            {conflictState.conflicts.length > 0 && (
              <ConflictResolution
                conflicts={conflictState.conflicts}
                onResolveConflict={conflictActions.resolveConflict}
                onBulkResolve={conflictActions.bulkResolve}
                isLoading={conflictState.isResolving}
              />
            )}
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
          <FileDropzone
            onFilesSelected={handleFileUpload}
            accept=".csv,.xlsx,.json"
            maxFiles={5}
            maxSize={50 * 1024 * 1024}
          />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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

export default ReconciliationPage;
