/**
 * Report Chart Component - Renders charts for report visualizations
 */

import { BarChart, LineChart, PieChart } from '../../charts/Charts';
import type { ReportVisualization, ReportMetric } from '../types';
import type { ReportData } from '../types';

interface ReportChartProps {
  visualization: ReportVisualization;
  metrics: ReportMetric[];
  data: ReportData;
}

export function ReportChart({ visualization, metrics, data }: ReportChartProps) {
  // Transform data for chart
  const chartData = metrics
    .filter((m) => visualization.metrics.includes(m.id))
    .map((metric) => {
      const value = data.metrics[metric.id] || 0;
      return {
        label: metric.name,
        value: typeof value === 'number' ? value : 0,
        color: getColorForMetric(metric.id),
      };
    });

  // If groupBy is specified, group data
  if (visualization.groupBy && data.data.length > 0) {
    const grouped = (data.data as Record<string, unknown>[]).reduce(
      (acc, record) => {
        const groupKey = String(record[visualization.groupBy!] || 'Other');
        if (!acc[groupKey]) {
          acc[groupKey] = { label: groupKey, value: 0, color: getColorForMetric(groupKey) };
        }
        // Sum values for grouped metrics
        visualization.metrics.forEach((metricId) => {
          const metric = metrics.find((m) => m.id === metricId);
          if (metric?.field) {
            const fieldValue = Number(record[metric.field]) || 0;
            acc[groupKey].value += fieldValue;
          }
        });
        return acc;
      },
      {} as Record<string, { label: string; value: number; color: string }>
    );
    return renderChart(Object.values(grouped));
  }

  return renderChart(chartData);

  function renderChart(chartData: Array<{ label: string; value: number; color?: string }>) {
    if (chartData.length === 0) {
      return (
        <div className="h-48 bg-secondary-50 rounded flex items-center justify-center">
          <span className="text-secondary-500">No data available</span>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      width: 600,
      height: 300,
      showGrid: true,
      showLegend: true,
      className: 'w-full',
    };

    switch (visualization.type) {
      case 'bar':
        return <BarChart {...commonProps} title={visualization.type} />;
      case 'line':
        return <LineChart {...commonProps} title={visualization.type} />;
      case 'pie':
        return <PieChart {...commonProps} title={visualization.type} />;
      case 'table':
        return renderTable(chartData);
      default:
        return <BarChart {...commonProps} title={visualization.type} />;
    }
  }

  function renderTable(chartData: Array<{ label: string; value: number; color?: string }>) {
    const sortedData = visualization.sortBy
      ? [...chartData].sort((a, b) => {
          if (visualization.sortBy === 'value') return b.value - a.value;
          return a.label.localeCompare(b.label);
        })
      : chartData;

    const limitedData = visualization.limit
      ? sortedData.slice(0, visualization.limit)
      : sortedData;

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {limitedData.map((row, index) => (
              <tr key={index}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.label}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

function getColorForMetric(metricId: string): string {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
  ];
  const hash = metricId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[Math.abs(hash) % colors.length];
}

