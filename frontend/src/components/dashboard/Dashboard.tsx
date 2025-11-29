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
import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { DashboardWidget, DashboardLayout } from '@/services/businessIntelligence/types';

interface DashboardProps {
  projectId: string;
  widgets: DashboardWidget[];
}

interface LayoutRow {
  widgets: DashboardWidget[];
}

interface WidgetData {
  id: string;
  data: any;
  error?: any;
}

// Simple widget renderer component
const WidgetRenderer = ({ data, type }: { data: any; type: string }) => {
  if (!data) {
    return <div className="widget-empty">No data available</div>;
  }

  switch (type) {
    case 'kpi':
      return (
        <div className="widget-kpi">
          <div className="kpi-value">{data.total || 0}</div>
          <div className="kpi-label">Total</div>
        </div>
      );
    case 'chart':
      return <div className="widget-chart">Chart visualization: {JSON.stringify(data)}</div>;
    case 'table':
      return <div className="widget-table">Table data: {data.count || 0} items</div>;
    default:
      return <div className="widget-default">{JSON.stringify(data)}</div>;
  }
};

const DashboardWidgetComponent = memo(
  ({ widget, onUpdate }: { widget: DashboardWidget; onUpdate: (id: string, data: any) => void }) => {
    useEffect(() => {
      if (widget.refreshInterval) {
        const interval = setInterval(() => {
          apiClient
            .get(`/widgets/${widget.id}/data`)
            .then((res) => onUpdate(widget.id, res.data))
            .catch((err) => console.error('Widget fetch error:', err));
        }, widget.refreshInterval * 1000);
        return () => clearInterval(interval);
      }
    }, [widget.id, widget.refreshInterval, onUpdate]);

    return (
      <div className="dashboard-widget">
        <h3>{widget.title}</h3>
        <WidgetRenderer data={null} type={widget.type} />
      </div>
    );
  }
);

const Dashboard = memo(({ projectId, widgets }: DashboardProps) => {
  const queryClient = useQueryClient();
  const [layout, setLayout] = useState<LayoutRow[]>([{ widgets }]);

  const { data: allWidgetData, isLoading } = useQuery({
    queryKey: ['dashboard', projectId],
    queryFn: async () => {
      const results = await Promise.allSettled(
        widgets.map((widget) => apiClient.get(`/widgets/${widget.id}/data?project=${projectId}`))
      );
      return results.map((result, index) => ({
        id: widgets[index].id,
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : null,
      })) as WidgetData[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Memoized layout computation
  const computedLayout = useMemo(() => {
    return layout.map((row) => ({
      ...row,
      widgets: row.widgets.map((w) => ({
        ...w,
        data: allWidgetData?.find((d) => d.id === w.id)?.data || null,
      })),
    }));
  }, [layout, allWidgetData]);

  // Optimized event handlers with cache update
  const handleWidgetUpdate = useCallback(
    (widgetId: string, newData: any) => {
      // Update query cache optimistically
      queryClient.setQueryData(['dashboard', projectId], (old: WidgetData[] | undefined) => {
        if (!old) return old;
        return old.map((item) => (item.id === widgetId ? { ...item, data: newData } : item));
      });
    },
    [queryClient, projectId]
  );

  const handleLayoutChange = useCallback(
    (newLayout: LayoutRow[]) => {
      setLayout(newLayout);
      // Debounced save to backend
      const saveLayout = async () => {
        try {
          await apiClient.post(`/dashboards/${projectId}/layout`, { layout: newLayout });
        } catch (error) {
          console.error('Failed to save layout:', error);
        }
      };
      const timeoutId = setTimeout(saveLayout, 1000);
      return () => clearTimeout(timeoutId);
    },
    [projectId]
  );

  const refreshAllWidgets = useCallback(() => {
    // Invalidate all dashboard queries
    queryClient.invalidateQueries({ queryKey: ['dashboard', projectId] });
  }, [queryClient, projectId]);

  // Virtualization for large widget lists
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: widgets.length > 20 ? widgets.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Project Dashboard</h1>
        <button onClick={refreshAllWidgets}>Refresh All</button>
      </div>

      {/* Virtualized widget list for large dashboards */}
      {widgets.length > 20 ? (
        <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <DashboardWidgetComponent
                  widget={widgets[virtualItem.index]}
                  onUpdate={handleWidgetUpdate}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Regular rendering for smaller dashboards
        computedLayout.map((row, rowIndex: number) => (
          <div key={rowIndex} className="dashboard-row">
            {row.widgets.map((widget) => (
              <DashboardWidgetComponent key={widget.id} widget={widget} onUpdate={handleWidgetUpdate} />
            ))}
          </div>
        ))
      )}
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
DashboardWidgetComponent.displayName = 'DashboardWidgetComponent';

export default Dashboard;
