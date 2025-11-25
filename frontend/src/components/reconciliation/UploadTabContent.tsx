import React from 'react';
import { FileText, CheckCircle, Clock, Users, Upload } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import MetricCard from '@/components/ui/MetricCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ContextualHelp } from '@/components/ui/ContextualHelp';
import { BackendDataSource, BackendReconciliationJob, BackendReconciliationMatch } from '@/services/apiClient';

interface UploadTabContentProps {
  dataSources: BackendDataSource[] | undefined;
  jobs: BackendReconciliationJob[] | undefined;
  matches: BackendReconciliationMatch[] | undefined;
  dataSourceColumns: Column<BackendDataSource>[];
  onUploadClick: () => void;
}

export const UploadTabContent: React.FC<UploadTabContentProps> = ({
  dataSources,
  jobs,
  matches,
  dataSourceColumns,
  onUploadClick,
}) => {
  return (
    <div id="tabpanel-upload" role="tabpanel" aria-labelledby="tab-upload" className="space-y-6">
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
            <Button variant="primary" onClick={onUploadClick}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
          <DataTable
            data={(dataSources ?? []) as unknown as Record<string, unknown>[]}
            columns={dataSourceColumns as unknown as Column<Record<string, unknown>>[]}
            emptyMessage="No data sources uploaded yet"
          />
        </div>
      </Card>
    </div>
  );
};
