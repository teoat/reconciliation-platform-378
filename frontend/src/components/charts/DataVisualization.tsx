import React, { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { PieChart } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { Download } from 'lucide-react';
import { Filter } from 'lucide-react';
import { DataTable } from '../ui/DataTable';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { BarChart, LineChart, PieChart as PieChartComponent } from './Charts';

export interface VisualizableData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface DataVisualizationProps {
  data: VisualizableData[];
  title?: string;
  className?: string;
  exportable?: boolean;
  chartTypes?: ('bar' | 'line' | 'pie')[];
}

export const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  title = 'Data Visualization',
  className = '',
  exportable = true,
  chartTypes = ['bar', 'line', 'pie'],
}) => {
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [showTable, setShowTable] = useState(false);

  const numericColumns = useMemo(() => {
    if (data.length === 0) return [];

    return Object.keys(data[0]).filter((key) => {
      const values = data.map((row) => row[key]);
      return values.every((value) => typeof value === 'number' || !isNaN(Number(value)));
    });
  }, [data]);

  const categoricalColumns = useMemo(() => {
    if (data.length === 0) return [];

    return Object.keys(data[0]).filter((key) => {
      const values = data.map((row) => row[key]);
      return values.every((value) => typeof value === 'string' || typeof value === 'number');
    });
  }, [data]);

  const chartData = useMemo(() => {
    if (!selectedColumn || data.length === 0) return [];

    if (selectedChartType === 'pie') {
      // Group data by selected column and count occurrences
      const grouped = data.reduce(
        (acc, row) => {
          const value = row[selectedColumn];
          const key = String(value);
          acc[key] = (Number(acc[key]) || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return Object.entries(grouped).map(([label, value]) => ({
        label,
        value,
        color: getColorForLabel(label),
      }));
    } else {
      // For bar and line charts, use numeric columns
      const numericCol = numericColumns[0];
      if (!numericCol) return [];

      const grouped = data.reduce(
        (acc, row) => {
          const category = String(row[selectedColumn]);
          const value = Number(row[numericCol]);
          if (!isNaN(value)) {
            acc[category] = (Number(acc[category]) || 0) + value;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      return Object.entries(grouped).map(([label, value]) => ({
        label,
        value,
        color: getColorForLabel(label),
      }));
    }
  }, [selectedColumn, selectedChartType, data, numericColumns]);

  const getColorForLabel = (label: string): string => {
    const colors = [
      '#3B82F6',
      '#8B5CF6',
      '#EF4444',
      '#10B981',
      '#F59E0B',
      '#EC4899',
      '#06B6D4',
      '#84CC16',
      '#F97316',
      '#6366F1',
    ];
    const hash = label.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleExport = () => {
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select a column to visualize data</p>
          </div>
        </div>
      );
    }

    switch (selectedChartType) {
      case 'bar':
        return <BarChart data={chartData} title={title} />;
      case 'line':
        return <LineChart data={chartData} title={title} />;
      case 'pie':
        return <PieChartComponent data={chartData} title={title} />;
      default:
        return null;
    }
  };

  const columns =
    data.length > 0
      ? Object.keys(data[0]).map((key) => ({
          key: key as keyof VisualizableData,
          header: key.charAt(0).toUpperCase() + key.slice(1),
          sortable: true,
          filterable: true,
        }))
      : [];

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTable(!showTable)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>{showTable ? 'Hide Table' : 'Show Table'}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Chart Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Chart Type:</label>
            <Select
              value={selectedChartType}
              onChange={(e) => setSelectedChartType(e.target.value as 'bar' | 'line' | 'pie')}
              options={chartTypes.map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
              }))}
              className="min-w-32"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Column:</label>
            <Select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              options={[
                { value: '', label: 'Select column...' },
                ...(selectedChartType === 'pie' ? categoricalColumns : categoricalColumns).map(
                  (col) => ({
                    value: col,
                    label: col.charAt(0).toUpperCase() + col.slice(1),
                  })
                ),
              ]}
              className="min-w-40"
            />
          </div>
        </div>

        {/* Chart */}
        <div className="mb-6">{renderChart()}</div>

        {/* Data Table */}
        {showTable && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Data Table</h4>
            <DataTable
              data={data}
              columns={columns}
              searchable={true}
              filterable={true}
              pagination={true}
              pageSize={10}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export interface KPIWidgetProps {
  title: string;
  value: number;
  target?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export const KPIWidget: React.FC<KPIWidgetProps> = ({
  title,
  value,
  target,
  unit = '',
  trend = 'stable',
  className = '',
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 rotate-180" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const progressPercentage = target ? Math.min((value / target) * 100, 100) : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`flex items-center space-x-1 ${getTrendColor()}`}>{getTrendIcon()}</div>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">
          {value.toLocaleString()}
          {unit}
        </p>
        {target && (
          <p className="text-sm text-gray-500 mt-1">
            Target: {target.toLocaleString()}
            {unit}
          </p>
        )}
      </div>

      {target && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
};
