// Dashboard Management Module
import { DashboardConfig, DashboardWidget, DashboardMetadata } from './types';
import { Metadata } from '@/types/metadata';
import { logger } from '../logger';

export class DashboardManager {
  private dashboards: Map<string, DashboardConfig> = new Map();

  async loadDashboards(): Promise<void> {
    try {
      const saved = localStorage.getItem('bi_dashboards');
      if (saved) {
        const dashboards = JSON.parse(saved) as DashboardConfig[];
        dashboards.forEach((dashboard) => {
          this.dashboards.set(dashboard.id, {
            ...dashboard,
            createdAt: new Date(dashboard.createdAt),
            updatedAt: new Date(dashboard.updatedAt),
          });
        });
      }
    } catch (error) {
      logger.error('Failed to load dashboards:', error);
    }
  }

  async saveDashboards(): Promise<void> {
    try {
      const dashboards = Array.from(this.dashboards.values());
      localStorage.setItem('bi_dashboards', JSON.stringify(dashboards));
    } catch (error) {
      logger.error('Failed to save dashboards:', error);
    }
  }

  async createDashboard(
    dashboard: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const dashboardConfig: DashboardConfig = {
      ...dashboard,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.dashboards.set(id, dashboardConfig);
    await this.saveDashboards();

    return id;
  }

  async updateDashboard(id: string, updates: Partial<DashboardConfig>): Promise<void> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`);
    }

    const updatedDashboard = {
      ...dashboard,
      ...updates,
      updatedAt: new Date(),
    };

    this.dashboards.set(id, updatedDashboard);
    await this.saveDashboards();
  }

  async deleteDashboard(id: string): Promise<void> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`);
    }

    this.dashboards.delete(id);
    await this.saveDashboards();
  }

  getDashboard(id: string): DashboardConfig | undefined {
    return this.dashboards.get(id);
  }

  getAllDashboards(): DashboardConfig[] {
    return Array.from(this.dashboards.values());
  }

  async renderDashboard(
    id: string,
    widgetRenderer: (
      widget: DashboardWidget,
      filters?: Metadata
    ) => Promise<Record<string, unknown>>,
    filters?: Metadata
  ): Promise<
    DashboardConfig & {
      widgets: Array<DashboardWidget & { data: Record<string, unknown> }>;
      loadTime: number;
    }
  > {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`);
    }

    try {
      const startTime = Date.now();

      const widgets = await Promise.all(
        dashboard.widgets
          .filter((widget) => widget.isVisible)
          .map(async (widget) => {
            const widgetData = await widgetRenderer(widget, filters);
            return {
              ...widget,
              data: widgetData,
            };
          })
      );

      const loadTime = Date.now() - startTime;

      dashboard.metadata.performance.lastLoadTime = loadTime;
      dashboard.metadata.viewCount++;

      await this.saveDashboards();

      return {
        ...dashboard,
        widgets,
        loadTime,
      };
    } catch (error) {
      logger.error(`Dashboard rendering failed for ${id}:`, error);
      throw error;
    }
  }
}
