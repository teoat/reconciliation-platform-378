import React from 'react';
import { Download } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { BackendReconciliationMatch } from '@/services/apiClient';

interface ResultsTabContentProps {
  matches: BackendReconciliationMatch[] | undefined;
  matchColumns: Column<BackendReconciliationMatch>[];
}

export const ResultsTabContent: React.FC<ResultsTabContentProps> = ({ matches, matchColumns }) => {
  return (
    <div id="tabpanel-results" role="tabpanel" aria-labelledby="tab-results" className="space-y-6">
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
            data={(matches ?? []) as unknown as Record<string, unknown>[]}
            columns={matchColumns as unknown as Column<Record<string, unknown>>[]}
            virtualized
            emptyMessage="No reconciliation matches found"
          />
        </div>
      </Card>
    </div>
  );
};
