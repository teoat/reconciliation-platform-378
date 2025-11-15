// Report Management Module
import {
  ReportConfig,
  ReportFilter,
  ReportAggregation,
  ReportMetadata,
} from './types';
import { Metadata } from '@/types/metadata';
import { logger } from '../logger';

export class ReportManager {
  private reports: Map<string, ReportConfig> = new Map();

  async loadReports(): Promise<void> {
    try {
      const saved = localStorage.getItem('bi_reports');
      if (saved) {
        const reports = JSON.parse(saved) as ReportConfig[];
        reports.forEach((report) => {
          this.reports.set(report.id, {
            ...report,
            createdAt: new Date(report.createdAt),
            updatedAt: new Date(report.updatedAt),
          });
        });
      }
    } catch (error) {
      logger.error('Failed to load reports:', error);
    }
  }

  async saveReports(): Promise<void> {
    try {
      const reports = Array.from(this.reports.values());
      localStorage.setItem('bi_reports', JSON.stringify(reports));
    } catch (error) {
      logger.error('Failed to save reports:', error);
    }
  }

  async createReport(
    report: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const reportConfig: ReportConfig = {
      ...report,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.reports.set(id, reportConfig);
    await this.saveReports();

    return id;
  }

  async updateReport(id: string, updates: Partial<ReportConfig>): Promise<void> {
    const report = this.reports.get(id);
    if (!report) {
      throw new Error(`Report ${id} not found`);
    }

    const updatedReport = {
      ...report,
      ...updates,
      updatedAt: new Date(),
    };

    this.reports.set(id, updatedReport);
    await this.saveReports();
  }

  async deleteReport(id: string): Promise<void> {
    const report = this.reports.get(id);
    if (!report) {
      throw new Error(`Report ${id} not found`);
    }

    this.reports.delete(id);
    await this.saveReports();
  }

  getReport(id: string): ReportConfig | undefined {
    return this.reports.get(id);
  }

  getAllReports(): ReportConfig[] {
    return Array.from(this.reports.values());
  }

  async executeReport(
    id: string,
    parameters?: Metadata,
    queryExecutor: (report: ReportConfig, parameters?: Metadata) => Promise<Array<Record<string, unknown>>>,
    filterApplier: (data: Array<Record<string, unknown>>, filters: ReportFilter[], parameters?: Metadata) => Array<Record<string, unknown>>
  ): Promise<Record<string, unknown>> {
    const report = this.reports.get(id);
    if (!report) {
      throw new Error(`Report ${id} not found`);
    }

    try {
      const data = await queryExecutor(report, parameters);
      const filteredData = filterApplier(data, report.filters, parameters);

      report.metadata.performance.lastLoadTime = Date.now();
      report.metadata.viewCount++;

      await this.saveReports();

      return { data: filteredData, metadata: report.metadata };
    } catch (error) {
      logger.error(`Report execution failed for ${id}:`, error);
      throw error;
    }
  }
}

