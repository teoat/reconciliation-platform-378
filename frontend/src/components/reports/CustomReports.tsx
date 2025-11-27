'use client';

import { Plus, FileText } from 'lucide-react';
import { useData } from './DataProvider';
import type { CustomReportsProps } from './types';
import { useCustomReports } from './hooks/useCustomReports';
import { ReportCard, ReportDetailModal, CreateReportModal, ReportsErrorBoundary } from './components';

const CustomReports = ({ project, onProgressUpdate }: CustomReportsProps) => {
  const { getReconciliationData, getCashflowData } = useData();

  const {
    filteredReports,
    selectedReport,
    showCreateModal,
    showReportModal,
    isLoading,
    filterTags,
    error,
    setSelectedReport,
    setShowCreateModal,
    setShowReportModal,
    setFilterTags,
    exportReport,
    deleteReport,
    loadReports,
  } = useCustomReports({
    getReconciliationData,
    getCashflowData,
    onProgressUpdate,
  });

  const handleViewReport = (report: import('./types').CustomReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleExportReport = (report: import('./types').CustomReport) => {
    exportReport(report, 'pdf');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Loading Custom Reports
            </h3>
            <p className="text-secondary-600">Fetching your saved reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReportsErrorBoundary>
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Custom Reports</h1>
            <p className="text-secondary-600">
              Create, manage, and share custom reports with advanced filtering and visualization
              options
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Filter by tags..."
              value={filterTags}
              onChange={(e) => setFilterTags(e.target.value)}
              className="input-field"
            />
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Report</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {project && (
          <div className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg inline-block">
            Project: {project.name}
          </div>
        )}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onView={handleViewReport}
            onExport={handleExportReport}
            onDelete={deleteReport}
          />
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No reports found</h3>
          <p className="text-secondary-600 mb-4">
            {filterTags
              ? 'Try adjusting your filter criteria.'
              : 'Create your first custom report to get started.'}
          </p>
          {!filterTags && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create Your First Report
            </button>
          )}
        </div>
      )}

      {/* Report Detail Modal */}
      {showReportModal && selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setShowReportModal(false)}
          onExport={exportReport}
        />
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <CreateReportModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={async (report) => {
            // Reload reports after creation
            await loadReports();
            setShowCreateModal(false);
          }}
        />
      )}
      </div>
    </ReportsErrorBoundary>
  );
};

export default CustomReports;
