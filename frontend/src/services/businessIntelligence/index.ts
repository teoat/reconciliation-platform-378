// Main Business Intelligence Service Orchestrator
import React from 'react';
import { logger } from '../logger';
import {
  ReportConfig,
  DashboardConfig,
  KPIDefinition,
  AnalyticsQuery,
  KPIAlert,
} from './types';
import { ReportManager } from './reports';
import { DashboardManager } from './dashboards';
import { KPIManager } from './kpis';
import { QueryManager } from './queries';
import { FilterApplier } from './filters';
import { QueryExecutors } from './executors';
import { SchedulingManager } from './scheduling';
import { DataGenerators } from './dataGenerators';
import { EventManager } from './events';
import { Metadata } from '@/types/metadata';

class BusinessIntelligenceService {
  private static instance: BusinessIntelligenceService;
  private reportManager: ReportManager;
  private dashboardManager: DashboardManager;
  private kpiManager: KPIManager;
  private queryManager: QueryManager;
  private filterApplier: FilterApplier;
  private queryExecutors: QueryExecutors;
  private schedulingManager: SchedulingManager;
  private eventManager: EventManager;
  private isInitialized: boolean = false;

  private constructor() {
    this.reportManager = new ReportManager();
    this.dashboardManager = new DashboardManager();
    this.kpiManager = new KPIManager();
    this.queryManager = new QueryManager();
    this.filterApplier = new FilterApplier();
    this.queryExecutors = new QueryExecutors();
    this.schedulingManager = new SchedulingManager();
    this.eventManager = new EventManager();
  }

  public static getInstance(): BusinessIntelligenceService {
    if (!BusinessIntelligenceService.instance) {
      BusinessIntelligenceService.instance = new BusinessIntelligenceService();
    }
    return BusinessIntelligenceService.instance;
  }

  private async init(): Promise<void> {
    try {
      await this.reportManager.loadReports();
      await this.dashboardManager.loadDashboards();
      await this.kpiManager.loadKPIs();
      await this.queryManager.loadQueries();

      this.schedulingManager.startKPIMonitoring(
        this.getKPIMap(),
        async (kpi: KPIDefinition) => {
          await this.calculateKPI(kpi.id);
        }
      );

      this.schedulingManager.startReportScheduling(
        this.getReportMap(),
        async (reportId: string) => {
          await this.executeReport(reportId);
        },
        async (reportId: string, updates: Partial<ReportConfig>) => {
          await this.reportManager.updateReport(reportId, updates);
        }
      );

      this.isInitialized = true;
      logger.info('Business Intelligence Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Business Intelligence Service:', error);
    }
  }

  private getReportMap(): Map<string, ReportConfig> {
    const reports = this.reportManager.getAllReports();
    const map = new Map<string, ReportConfig>();
    reports.forEach((report) => map.set(report.id, report));
    return map;
  }

  private getKPIMap(): Map<string, KPIDefinition> {
    const kpis = this.kpiManager.getAllKPIs();
    const map = new Map<string, KPIDefinition>();
    kpis.forEach((kpi) => map.set(kpi.id, kpi));
    return map;
  }

  // Report Management
  public async createReport(
    report: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = await this.reportManager.createReport(report);
    this.eventManager.emit('reportCreated', this.reportManager.getReport(id));
    return id;
  }

  public async updateReport(id: string, updates: Partial<ReportConfig>): Promise<void> {
    await this.reportManager.updateReport(id, updates);
    this.eventManager.emit('reportUpdated', this.reportManager.getReport(id));
  }

  public async deleteReport(id: string): Promise<void> {
    await this.reportManager.deleteReport(id);
    this.eventManager.emit('reportDeleted', id);
  }

  public getReport(id: string): ReportConfig | undefined {
    return this.reportManager.getReport(id);
  }

  public getAllReports(): ReportConfig[] {
    return this.reportManager.getAllReports();
  }

  public async executeReport(id: string, parameters?: Metadata): Promise<Record<string, unknown>> {
    return this.reportManager.executeReport(
      id,
      parameters,
      (report, params) => this.queryExecutors.executeReportQuery(report, params),
      (data, filters, params) => this.filterApplier.applyFilters(data, filters, params)
    );
  }

  // Dashboard Management
  public async createDashboard(
    dashboard: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = await this.dashboardManager.createDashboard(dashboard);
    this.eventManager.emit('dashboardCreated', this.dashboardManager.getDashboard(id));
    return id;
  }

  public async updateDashboard(id: string, updates: Partial<DashboardConfig>): Promise<void> {
    await this.dashboardManager.updateDashboard(id, updates);
    this.eventManager.emit('dashboardUpdated', this.dashboardManager.getDashboard(id));
  }

  public async deleteDashboard(id: string): Promise<void> {
    await this.dashboardManager.deleteDashboard(id);
    this.eventManager.emit('dashboardDeleted', id);
  }

  public getDashboard(id: string): DashboardConfig | undefined {
    return this.dashboardManager.getDashboard(id);
  }

  public getAllDashboards(): DashboardConfig[] {
    return this.dashboardManager.getAllDashboards();
  }

  public async renderDashboard(id: string, filters?: Metadata): Promise<DashboardConfig & {
    widgets: Array<import('./types').DashboardWidget & { data: Record<string, unknown> }>;
    loadTime: number;
  }> {
    return this.dashboardManager.renderDashboard(
      id,
      filters,
      (widget, filters) => this.queryExecutors.renderWidget(widget, filters)
    );
  }

  // KPI Management
  public async createKPI(kpi: Omit<KPIDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = await this.kpiManager.createKPI(kpi);
    this.eventManager.emit('kpiCreated', this.kpiManager.getKPI(id));
    return id;
  }

  public async updateKPI(id: string, updates: Partial<KPIDefinition>): Promise<void> {
    await this.kpiManager.updateKPI(id, updates);
    this.eventManager.emit('kpiUpdated', this.kpiManager.getKPI(id));
  }

  public async deleteKPI(id: string): Promise<void> {
    await this.kpiManager.deleteKPI(id);
    this.eventManager.emit('kpiDeleted', id);
  }

  public getKPI(id: string): KPIDefinition | undefined {
    return this.kpiManager.getKPI(id);
  }

  public getAllKPIs(): KPIDefinition[] {
    return this.kpiManager.getAllKPIs();
  }

  public async calculateKPI(id: string, parameters?: Metadata): Promise<{
    kpi: KPIDefinition;
    value: number;
    calculationTime: number;
    target: import('./types').KPITarget;
    status: 'good' | 'warning' | 'critical';
  }> {
    return this.kpiManager.calculateKPI(
      id,
      parameters,
      (kpi, params) => this.queryExecutors.executeKPICalculation(kpi, params),
      async (kpi, value) => {
        await this.queryExecutors.checkKPIAlerts(kpi, value, async (kpi, alert, value) => {
          alert.lastTriggered = new Date();
          logger.info(`KPI Alert triggered: ${kpi.name} - ${alert.name}`);
        });
      }
    );
  }

  // Query Management
  public async createQuery(query: Omit<AnalyticsQuery, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = await this.queryManager.createQuery(query);
    this.eventManager.emit('queryCreated', this.queryManager.getQuery(id));
    return id;
  }

  public async updateQuery(id: string, updates: Partial<AnalyticsQuery>): Promise<void> {
    await this.queryManager.updateQuery(id, updates);
    this.eventManager.emit('queryUpdated', this.queryManager.getQuery(id));
  }

  public async deleteQuery(id: string): Promise<void> {
    await this.queryManager.deleteQuery(id);
    this.eventManager.emit('queryDeleted', id);
  }

  public getQuery(id: string): AnalyticsQuery | undefined {
    return this.queryManager.getQuery(id);
  }

  public getAllQueries(): AnalyticsQuery[] {
    return this.queryManager.getAllQueries();
  }

  public async executeQuery(id: string, parameters?: Metadata): Promise<Array<Record<string, unknown>>> {
    return this.queryManager.executeQuery(
      id,
      parameters,
      (query, params) => this.queryExecutors.executeAnalyticsQuery(query, params)
    );
  }

  // Event System
  public on(event: string, callback: (...args: unknown[]) => void): void {
    this.eventManager.on(event, callback);
  }

  public off(event: string, callback: (...args: unknown[]) => void): void {
    this.eventManager.off(event, callback);
  }

  public destroy(): void {
    this.schedulingManager.destroy();
    this.eventManager.removeAllListeners();
  }
}

// React hook for business intelligence
export const useBusinessIntelligence = () => {
  const [reports, setReports] = React.useState<ReportConfig[]>([]);
  const [dashboards, setDashboards] = React.useState<DashboardConfig[]>([]);
  const [kpis, setKPIs] = React.useState<KPIDefinition[]>([]);
  const [queries, setQueries] = React.useState<AnalyticsQuery[]>([]);

  React.useEffect(() => {
    const service = BusinessIntelligenceService.getInstance();
    service.init();

    setReports(service.getAllReports());
    setDashboards(service.getAllDashboards());
    setKPIs(service.getAllKPIs());
    setQueries(service.getAllQueries());

    const handleReportCreated = (report: ReportConfig) => {
      setReports((prev) => [...prev, report]);
    };

    const handleReportUpdated = (report: ReportConfig) => {
      setReports((prev) => prev.map((r) => (r.id === report.id ? report : r)));
    };

    const handleReportDeleted = (id: string) => {
      setReports((prev) => prev.filter((r) => r.id !== id));
    };

    const handleDashboardCreated = (dashboard: DashboardConfig) => {
      setDashboards((prev) => [...prev, dashboard]);
    };

    const handleDashboardUpdated = (dashboard: DashboardConfig) => {
      setDashboards((prev) => prev.map((d) => (d.id === dashboard.id ? dashboard : d)));
    };

    const handleDashboardDeleted = (id: string) => {
      setDashboards((prev) => prev.filter((d) => d.id !== id));
    };

    const handleKPICreated = (kpi: KPIDefinition) => {
      setKPIs((prev) => [...prev, kpi]);
    };

    const handleKPIUpdated = (kpi: KPIDefinition) => {
      setKPIs((prev) => prev.map((k) => (k.id === kpi.id ? kpi : k)));
    };

    const handleKPIDeleted = (id: string) => {
      setKPIs((prev) => prev.filter((k) => k.id !== id));
    };

    const handleQueryCreated = (query: AnalyticsQuery) => {
      setQueries((prev) => [...prev, query]);
    };

    const handleQueryUpdated = (query: AnalyticsQuery) => {
      setQueries((prev) => prev.map((q) => (q.id === query.id ? query : q)));
    };

    const handleQueryDeleted = (id: string) => {
      setQueries((prev) => prev.filter((q) => q.id !== id));
    };

    service.on('reportCreated', handleReportCreated);
    service.on('reportUpdated', handleReportUpdated);
    service.on('reportDeleted', handleReportDeleted);
    service.on('dashboardCreated', handleDashboardCreated);
    service.on('dashboardUpdated', handleDashboardUpdated);
    service.on('dashboardDeleted', handleDashboardDeleted);
    service.on('kpiCreated', handleKPICreated);
    service.on('kpiUpdated', handleKPIUpdated);
    service.on('kpiDeleted', handleKPIDeleted);
    service.on('queryCreated', handleQueryCreated);
    service.on('queryUpdated', handleQueryUpdated);
    service.on('queryDeleted', handleQueryDeleted);

    return () => {
      service.off('reportCreated', handleReportCreated);
      service.off('reportUpdated', handleReportUpdated);
      service.off('reportDeleted', handleReportDeleted);
      service.off('dashboardCreated', handleDashboardCreated);
      service.off('dashboardUpdated', handleDashboardUpdated);
      service.off('dashboardDeleted', handleDashboardDeleted);
      service.off('kpiCreated', handleKPICreated);
      service.off('kpiUpdated', handleKPIUpdated);
      service.off('kpiDeleted', handleKPIDeleted);
      service.off('queryCreated', handleQueryCreated);
      service.off('queryUpdated', handleQueryUpdated);
      service.off('queryDeleted', handleQueryDeleted);
    };
  }, []);

  const service = BusinessIntelligenceService.getInstance();

  return {
    reports,
    dashboards,
    kpis,
    queries,
    createReport: service.createReport.bind(service),
    updateReport: service.updateReport.bind(service),
    deleteReport: service.deleteReport.bind(service),
    executeReport: service.executeReport.bind(service),
    createDashboard: service.createDashboard.bind(service),
    updateDashboard: service.updateDashboard.bind(service),
    deleteDashboard: service.deleteDashboard.bind(service),
    renderDashboard: service.renderDashboard.bind(service),
    createKPI: service.createKPI.bind(service),
    updateKPI: service.updateKPI.bind(service),
    deleteKPI: service.deleteKPI.bind(service),
    calculateKPI: service.calculateKPI.bind(service),
    createQuery: service.createQuery.bind(service),
    updateQuery: service.updateQuery.bind(service),
    deleteQuery: service.deleteQuery.bind(service),
    executeQuery: service.executeQuery.bind(service),
  };
};

export const businessIntelligenceService = BusinessIntelligenceService.getInstance();
export default businessIntelligenceService;
export * from './types';


