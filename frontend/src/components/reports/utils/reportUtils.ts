/**
 * Utility functions for report formatting and visualization
 */

import { FileText, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Format metric value based on format type
 */
export function formatMetricValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'date':
      return new Date(value).toLocaleDateString();
    default:
      return value.toLocaleString();
  }
}

/**
 * Get visualization icon based on type
 */
export function getVisualizationIcon(type: string): ReactNode {
  switch (type) {
    case 'bar':
      return <BarChart3 className="w-4 h-4" />;
    case 'line':
      return <TrendingUp className="w-4 h-4" />;
    case 'pie':
      return <PieChart className="w-4 h-4" />;
    case 'table':
      return <FileText className="w-4 h-4" />;
    default:
      return <BarChart3 className="w-4 h-4" />;
  }
}

