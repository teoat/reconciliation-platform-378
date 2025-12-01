import React from 'react';

export interface ChartProps {
  data?: unknown[];
  width?: number;
  height?: number;
}

export const LineChart: React.FC<ChartProps> = () => {
  return <div className="text-center text-gray-500 p-4">Line Chart Placeholder</div>;
};

export const BarChart: React.FC<ChartProps> = () => {
  return <div className="text-center text-gray-500 p-4">Bar Chart Placeholder</div>;
};

export const PieChart: React.FC<ChartProps> = () => {
  return <div className="text-center text-gray-500 p-4">Pie Chart Placeholder</div>;
};

export default { LineChart, BarChart, PieChart };
