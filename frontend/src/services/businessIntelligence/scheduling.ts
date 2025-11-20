// Report Scheduling and KPI Monitoring Module
import { ReportConfig, ReportSchedule, KPIDefinition } from './types';
import { logger } from '../logger';

export class SchedulingManager {
  private kpiMonitoringInterval?: NodeJS.Timeout;
  private reportSchedulingInterval?: NodeJS.Timeout;

  startKPIMonitoring(
    kpis: Map<string, KPIDefinition>,
    calculator: (kpi: KPIDefinition) => Promise<void>
  ): void {
    this.kpiMonitoringInterval = setInterval(
      () => {
        this.monitorKPIs(kpis, calculator);
      },
      5 * 60 * 1000
    ) as unknown as NodeJS.Timeout;
  }

  startReportScheduling(
    reports: Map<string, ReportConfig>,
    executor: (reportId: string) => Promise<void>,
    updater: (reportId: string, updates: Partial<ReportConfig>) => Promise<void>
  ): void {
    this.reportSchedulingInterval = setInterval(() => {
      this.checkScheduledReports(reports, executor, updater);
    }, 60000) as unknown as NodeJS.Timeout;
  }

  private async monitorKPIs(
    kpis: Map<string, KPIDefinition>,
    calculator: (kpi: KPIDefinition) => Promise<void>
  ): Promise<void> {
    for (const kpi of Array.from(kpis.values())) {
      if (!kpi.isActive) continue;

      try {
        await calculator(kpi);
      } catch (error) {
        logger.error(`KPI monitoring failed for ${kpi.id}:`, error);
      }
    }
  }

  private async checkScheduledReports(
    reports: Map<string, ReportConfig>,
    executor: (reportId: string) => Promise<void>,
    updater: (reportId: string, updates: Partial<ReportConfig>) => Promise<void>
  ): Promise<void> {
    const now = new Date();

    for (const report of Array.from(reports.values())) {
      if (!report.isActive || !report.schedule?.enabled) continue;

      if (report.schedule.nextRun && report.schedule.nextRun <= now) {
        try {
          await executor(report.id);

          const nextRun = this.calculateNextRun(report.schedule.frequency);
          await updater(report.id, {
            schedule: {
              ...report.schedule,
              nextRun,
              lastRun: now,
            },
          });
        } catch (error) {
          logger.error(`Scheduled report failed for ${report.id}:`, error);
        }
      }
    }
  }

  private calculateNextRun(frequency: string): Date {
    const now = new Date();

    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      case 'yearly':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  destroy(): void {
    if (this.kpiMonitoringInterval) {
      clearInterval(this.kpiMonitoringInterval);
      this.kpiMonitoringInterval = undefined;
    }
    if (this.reportSchedulingInterval) {
      clearInterval(this.reportSchedulingInterval);
      this.reportSchedulingInterval = undefined;
    }
  }
}
