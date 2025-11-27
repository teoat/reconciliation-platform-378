/**
 * Chart generation utilities for progress visualization
 * 
 * Note: This module provides chart generation helpers.
 * Actual chart rendering would be handled by charting libraries (e.g., Chart.js, Recharts).
 */

/**
 * Generate chart configuration for progress visualization
 */
export function generateProgressChartConfig(
  stages: Array<{ name: string; progress: number; status: string }>
): Record<string, unknown> {
  return {
    type: 'bar',
    data: {
      labels: stages.map((s) => s.name),
      datasets: [
        {
          label: 'Progress',
          data: stages.map((s) => s.progress),
          backgroundColor: stages.map((s) => getStatusColor(s.status)),
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  };
}

/**
 * Get color for stage status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#10b981'; // green
    case 'active':
      return '#3b82f6'; // blue
    case 'pending':
      return '#9ca3af'; // gray
    case 'error':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

