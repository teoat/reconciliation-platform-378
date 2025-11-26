// Query and Calculation Executors
import { ReportConfig, DashboardWidget, KPIDefinition, KPIAlert, AnalyticsQuery } from './types';
import { Metadata } from '@/types/metadata';
import { DataGenerators } from './dataGenerators';

export class QueryExecutors {
  private dataGenerators: DataGenerators;

  constructor() {
    this.dataGenerators = new DataGenerators();
  }

  async executeReportQuery(
    report: ReportConfig,
    parameters?: Metadata
  ): Promise<Array<Record<string, unknown>>> {
    await this.delay(1000);

    switch (report.type) {
      case 'dashboard':
        return this.dataGenerators.generateFinancialData();
      case 'kpi':
        return this.dataGenerators.generateOperationalData();
      case 'detailed':
        return this.dataGenerators.generateComplianceData();
      default:
        return this.dataGenerators.generateSampleData();
    }
  }

  async renderWidget(
    widget: DashboardWidget,
    filters?: Metadata
  ): Promise<Record<string, unknown>> {
    await this.delay(500);

    switch (widget.type) {
      case 'chart':
        return this.dataGenerators.generateChartData();
      case 'kpi':
        return this.dataGenerators.generateKPIData();
      case 'table':
        return this.dataGenerators.generateTableData() as unknown as Record<string, unknown>;
      default:
        return { message: 'Widget data not available' };
    }
  }

  async executeKPICalculation(kpi: KPIDefinition, parameters?: Metadata): Promise<number> {
    await this.delay(2000);
    return Math.random() * 100;
  }

  async checkKPIAlerts(
    kpi: KPIDefinition,
    value: number,
    alertTriggerer: (kpi: KPIDefinition, alert: KPIAlert, value: number) => Promise<void>
  ): Promise<void> {
    for (const alert of kpi.alerts) {
      if (!alert.isEnabled) continue;

      let shouldTrigger = false;

      switch (alert.condition) {
        case 'above_target':
          shouldTrigger = value > kpi.target.value;
          break;
        case 'below_target':
          shouldTrigger = value < kpi.target.value;
          break;
        case 'threshold':
          shouldTrigger = value > alert.threshold;
          break;
        case 'change_percentage':
          shouldTrigger = false;
          break;
      }

      if (shouldTrigger) {
        await alertTriggerer(kpi, alert, value);
      }
    }
  }

  async executeAnalyticsQuery(
    query: AnalyticsQuery,
    parameters?: Metadata
  ): Promise<Array<Record<string, unknown>>> {
    await this.delay(1500);
    return this.dataGenerators.generateSampleData();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
