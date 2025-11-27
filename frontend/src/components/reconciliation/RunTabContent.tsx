import React, { memo } from 'react';
import { Play } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { BackendReconciliationJob, BackendDataSource } from '@/services/apiClient';

interface RunTabContentProps {
  dataSources: BackendDataSource[] | undefined;
  jobs: BackendReconciliationJob[] | undefined;
  jobColumns: Column<BackendReconciliationJob>[];
  onStartReconciliation: () => void;
}

const RunTabContentComponent: React.FC<RunTabContentProps> = ({
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
            data={(jobs ?? []) as unknown as Record<string, unknown>[]}
            columns={jobColumns as unknown as Column<Record<string, unknown>>[]}
            emptyMessage="No reconciliation jobs yet"
          />
        </div>
      </Card>
    </div>
  );
};

RunTabContentComponent.displayName = 'RunTabContent';

export const RunTabContent = memo(RunTabContentComponent);
