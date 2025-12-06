// Unified Data Management Service
import { logger } from '@/services/logger';
import { PersistenceService } from '../BaseService';

export interface DataItem {
  id: string;
  data: unknown;
  timestamp: Date;
  version: number;
  metadata?: Record<string, unknown>;
}

export class DataService extends PersistenceService<DataItem> {
  private static instance: DataService;

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  constructor() {
    super('reconciliation_data');
  }

  public saveData(id: string, data: unknown, metadata?: Record<string, unknown>): void {
    const existing = this.get(id);
    const version = existing ? existing.version + 1 : 1;

    const dataItem: DataItem = {
      id,
      data,
      timestamp: new Date(),
      version,
      metadata,
    };

    this.set(id, dataItem);
    this.save();
    this.emit('saved', dataItem);
  }

  public getData<T = unknown>(id: string): T | null {
    const item = this.get(id);
    return item ? (item.data as T) : null;
  }

  public getVersion(id: string): number {
    const item = this.get(id);
    return item ? item.version : 0;
  }

  public getAllData(): DataItem[] {
    return Array.from(this.data.values());
  }

  public clearData(id: string): void {
    this.delete(id);
    this.save();
  }

  public exportData(): string {
    return JSON.stringify(this.getAllData(), null, 2);
  }

  public importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData) as DataItem[];
      data.forEach((item: DataItem) => {
        this.set(item.id, item);
      });
      this.save();
      this.emit('imported', data as unknown);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to import data:', { error: errorObj.message });
    }
  }
}

export const dataService = DataService.getInstance();
