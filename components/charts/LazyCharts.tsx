import React, { lazy, Suspense, ComponentType } from 'react';

// Lazy load the entire recharts library
const LazyRecharts = lazy(() => import('recharts'));

// Loading component
const ChartLoader = () => (
  <div className="flex items-center justify-center h-80">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

// Create lazy chart components that render with Suspense
const createLazyChartComponent = (componentName: string) => {
  const LazyChartComponent = (props: React.ComponentProps<any>) => (
    <Suspense fallback={<ChartLoader />}>
      <LazyRecharts>
        {(RechartsModule: Record<string, React.ComponentType<any>>) => {
          const Component = RechartsModule[componentName] as React.ComponentType<any>;
          return Component ? <Component {...props} /> : null;
        }}
      </LazyRecharts>
    </Suspense>
  );
  LazyChartComponent.displayName = `Lazy${componentName}`;
  return LazyChartComponent;
};

// Export lazy chart components
export const LazyBarChart = createLazyChartComponent('BarChart');
export const LazyBar = createLazyChartComponent('Bar');
export const LazyXAxis = createLazyChartComponent('XAxis');
export const LazyYAxis = createLazyChartComponent('YAxis');
export const LazyCartesianGrid = createLazyChartComponent('CartesianGrid');
export const LazyTooltip = createLazyChartComponent('Tooltip');
export const LazyResponsiveContainer = createLazyChartComponent('ResponsiveContainer');
export const LazyPieChart = createLazyChartComponent('PieChart');
export const LazyPie = createLazyChartComponent('Pie');
export const LazyCell = createLazyChartComponent('Cell');
export const LazyLineChart = createLazyChartComponent('LineChart');
export const LazyLine = createLazyChartComponent('Line');
export const LazyArea = createLazyChartComponent('Area');
export const LazyAreaChart = createLazyChartComponent('AreaChart');

// Loading component
export { ChartLoader };
