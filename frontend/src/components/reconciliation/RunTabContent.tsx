import React from 'react';
import { Play } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { BackendReconciliationJob } from '@/services/apiClient';

interface RunTabContentProps {
  dataSources: any[] | undefined;
  jobs: BackendReconciliationJob[] | undefined;
  jobColumns: Column<BackendReconciliationJob>[];
  onStartReconciliation: () => void;
}

export const RunTabContent: React.FC<RunTabContentProps> = ({
  dataSources,
  jobs,
  jobColumns,
  onStartReconciliation,
}) => {
  return (
    <div id="tabpanel-run" role="tabpanel" aria-labelledby="tab-run" className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Reconciliation Jobs</h3>
            <Button
              variant="primary"
              onClick={onStartReconciliation}
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
  );
};
