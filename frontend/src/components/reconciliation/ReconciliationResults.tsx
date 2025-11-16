import React from 'react';
import { Download } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { DataTable, Column } from '../ui/DataTable';
import { BackendReconciliationMatch } from '../../services/apiClient';

interface ReconciliationResultsProps {
  matches: BackendReconciliationMatch[];
  onExport?: () => void;
  isLoading?: boolean;
}

export const ReconciliationResults: React.FC<ReconciliationResultsProps> = ({
  matches,
  onExport,
  isLoading = false,
}) => {
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
      render: (value) => {
        const statusConfig = {
          approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
          pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
          rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
        };
        const config = statusConfig[value as keyof typeof statusConfig] || {
          label: value,
          color: 'bg-gray-100 text-gray-800',
        };

        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.label}
          </span>
        );
      },
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
          <Button size="sm" variant="outline">
            View Details
          </Button>
          {row.status === 'pending' && (
            <>
              <Button size="sm" variant="primary">
                Approve
              </Button>
              <Button size="sm" variant="danger">
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Reconciliation Matches</h3>
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
        <DataTable
          data={matches}
          columns={matchColumns}
          virtualized
          virtualRowHeight={48}
          virtualContainerHeight={560}
          emptyMessage="No matches found yet"
        />
      </div>
    </Card>
  );
};
