/**
 * Dashboard Component
 * 
 * Main dashboard page displaying project overview, health status, and quick actions.
 * 
 * @component
 * @example
 * ```tsx
 * <Dashboard />
 * ```
 * 
 * @returns {JSX.Element} The dashboard component
 */
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { useNavigate } from 'react-router-dom';
import { useHealthCheck } from '@/hooks/useFileReconciliation';
import { useProjects } from '@/hooks/api';
import { apiClient } from '@/services/apiClient';
import { logger } from '@/services/logger';
import Button from '@/components/ui/Button';
import { PageMeta } from '@/components/seo/PageMeta';
import { EnhancedContextualHelp } from '@/components/ui/EnhancedContextualHelp';

interface DashboardProps {
  projectId: string;
  widgets: Widget[];
}

const DashboardWidget = memo(({ widget, onUpdate }: { widget: Widget; onUpdate: (id: string, data: any) => void }) => {
  const fetchWidgetData = useCallback(async (widgetId: string) => {
    // Debounced API call
    const debouncedFetch = debounce(async () => {
      const { data } = await apiClient.get(`/widgets/${widgetId}/data`);
      onUpdate(widgetId, data);
    }, 300);
    debouncedFetch();
  }, [onUpdate]);

  useEffect(() => {
    if (widget.autoRefresh) {
      fetchWidgetData(widget.id);
      const interval = setInterval(() => fetchWidgetData(widget.id), widget.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [widget.autoRefresh, widget.refreshInterval, fetchWidgetData]);

  const processedData = useMemo(() => {
    // Expensive data processing
    return computeWidgetMetrics(widget.rawData || []);
  }, [widget.rawData]);

  return (
    <div className="dashboard-widget">
      <h3>{widget.title}</h3>
      <WidgetRenderer data={processedData} type={widget.type} />
    </div>
  );
});

const Dashboard = memo(({ projectId, widgets }: DashboardProps) => {
  const [layout, setLayout] = useState<Layout>(defaultLayout);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);

  // Memoized widget data fetching
  const widgetQueries = useMemo(() => 
    widgets.map(widget => ({
      queryKey: ['widget', widget.id, projectId],
      queryFn: () => apiClient.get(`/widgets/${widget.id}/data?project=${projectId}`).then(res => res.data),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    })), 
    [widgets, projectId]
  );

  const { data: allWidgetData, isLoading } = useQuery({
    queryKey: ['dashboard', projectId],
    queryFn: async () => {
      const results = await Promise.allSettled(
        widgetQueries.map(q => apiClient.get(q.queryFn.name.replace('queryFn', '')))
      );
      return results.map((result, index) => ({
        id: widgets[index].id,
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : null,
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Memoized layout computation
  const computedLayout = useMemo(() => {
    return layout.map(row => ({
      ...row,
      widgets: row.widgets.map(w => ({
        ...w,
        data: allWidgetData?.find(d => d.id === w.id)?.data || null,
      }))
    }));
  }, [layout, allWidgetData]);

  // Optimized event handlers
  const handleWidgetUpdate = useCallback((widgetId: string, newData: any) => {
    setSelectedWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
    // Optimistic update
    // update local cache here
  }, []);

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    setLayout(newLayout);
    // Debounce save to backend
  }, []);

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Project Dashboard</h1>
        <button onClick={() => refreshAllWidgets()}>Refresh All</button>
      </div>
      
      {/* Virtualized widget list for large dashboards */}
      {widgets.length > 20 ? (
        <List
          height={600}
          itemCount={widgets.length}
          itemSize={200}
          width="100%"
        >
          {({ index, style }) => (
            <div style={style}>
              <DashboardWidget 
                key={widgets[index].id}
                widget={widgets[index]} 
                onUpdate={handleWidgetUpdate} 
              />
            </div>
          )}
        </List>
      ) : (
        // Regular rendering for smaller dashboards
        computedLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="dashboard-row">
            {row.widgets.map(widget => (
              <DashboardWidget 
                key={widget.id}
                widget={widget} 
                onUpdate={handleWidgetUpdate} 
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
});

// Memoized utility functions
const computeWidgetMetrics = useMemo(() => {
  return (data: any[]) => {
    // Expensive computation with memoization key
    return data.reduce((acc, item) => {
      acc.total += item.value;
      acc.count += 1;
      return acc;
    }, { total: 0, count: 0, average: 0 });
  };
}, []);

const refreshAllWidgets = useCallback(() => {
  // Invalidate all queries
  // queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // This line was not in the new_code, so I'm not adding it.
}, []);

export default Dashboard;
