// KPI Management Module
import {
  KPIDefinition,
  KPICalculation,
  KPITarget,
  KPIVisualization,
  KPIAlert,
  KPIMetadata,
} from './types';
import { Metadata } from '@/types/metadata';
import { logger } from '../logger';

export class KPIManager {
  private kpis: Map<string, KPIDefinition> = new Map();

  async loadKPIs(): Promise<void> {
    try {
      const saved = localStorage.getItem('bi_kpis');
      if (saved) {
        const kpis = JSON.parse(saved) as KPIDefinition[];
        kpis.forEach((kpi) => {
          this.kpis.set(kpi.id, {
            ...kpi,
            createdAt: new Date(kpi.createdAt),
            updatedAt: new Date(kpi.updatedAt),
          });
        });
      }
    } catch (error) {
      logger.error('Failed to load KPIs:', error);
    }
  }

  async saveKPIs(): Promise<void> {
    try {
      const kpis = Array.from(this.kpis.values());
      localStorage.setItem('bi_kpis', JSON.stringify(kpis));
    } catch (error) {
      logger.error('Failed to save KPIs:', error);
    }
  }

  async createKPI(kpi: Omit<KPIDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `kpi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const kpiDefinition: KPIDefinition = {
      ...kpi,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.kpis.set(id, kpiDefinition);
    await this.saveKPIs();

    return id;
  }

  async updateKPI(id: string, updates: Partial<KPIDefinition>): Promise<void> {
    const kpi = this.kpis.get(id);
    if (!kpi) {
      throw new Error(`KPI ${id} not found`);
    }

    const updatedKPI = {
      ...kpi,
      ...updates,
      updatedAt: new Date(),
    };

    this.kpis.set(id, updatedKPI);
    await this.saveKPIs();
  }

  async deleteKPI(id: string): Promise<void> {
    const kpi = this.kpis.get(id);
    if (!kpi) {
      throw new Error(`KPI ${id} not found`);
    }

    this.kpis.delete(id);
    await this.saveKPIs();
  }

  getKPI(id: string): KPIDefinition | undefined {
    return this.kpis.get(id);
  }

  getAllKPIs(): KPIDefinition[] {
    return Array.from(this.kpis.values());
  }

  async calculateKPI(
    id: string,
    parameters?: Metadata,
    calculator: (kpi: KPIDefinition, parameters?: Metadata) => Promise<number>,
    alertChecker: (kpi: KPIDefinition, value: number) => Promise<void>
  ): Promise<{
    kpi: KPIDefinition;
    value: number;
    calculationTime: number;
    target: KPITarget;
    status: 'good' | 'warning' | 'critical';
  }> {
    const kpi = this.kpis.get(id);
    if (!kpi) {
      throw new Error(`KPI ${id} not found`);
    }

    try {
      const startTime = Date.now();
      const value = await calculator(kpi, parameters);
      const calculationTime = Date.now() - startTime;

      kpi.metadata.performance.lastCalculationTime = calculationTime;
      kpi.metadata.viewCount++;

      await this.saveKPIs();
      await alertChecker(kpi, value);

      return {
        kpi,
        value,
        calculationTime,
        target: kpi.target,
        status: this.getKPIStatus(kpi, value),
      };
    } catch (error) {
      logger.error(`KPI calculation failed for ${id}:`, error);
      throw error;
    }
  }

  private getKPIStatus(kpi: KPIDefinition, value: number): 'good' | 'warning' | 'critical' {
    if (value >= kpi.target.value * 0.9) return 'good';
    if (value >= kpi.target.value * 0.7) return 'warning';
    return 'critical';
  }
}
