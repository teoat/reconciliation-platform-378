// Unified Data Management Service
import { logger } from '@/services/logger'
import { PersistenceService } from '../BaseService'

export interface DataItem {
  id: string
  data: any
  timestamp: Date
  version: number
  metadata?: any
}

export class DataService extends PersistenceService<DataItem> {
  private static instance: DataService
  
  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }
  
  constructor() {
    super('reconciliation_data')
  }
  
  public saveData(id: string, data: any, metadata?: any): void {
    const existing = this.get(id)
    const version = existing ? existing.version + 1 : 1
    
    const dataItem: DataItem = {
      id,
      data,
      timestamp: new Date(),
      version,
      metadata
    }
    
    this.set(id, dataItem)
    this.save()
    this.emit('saved', dataItem)
  }
  
  public getData(id: string): any {
    const item = this.get(id)
    return item ? item.data : null
  }
  
  public getVersion(id: string): number {
    const item = this.get(id)
    return item ? item.version : 0
  }
  
  public getAllData(): DataItem[] {
    return Array.from(this.data.values())
  }
  
  public clearData(id: string): void {
    this.delete(id)
    this.save()
  }
  
  public exportData(): string {
    return JSON.stringify(this.getAllData(), null, 2)
  }
  
  public importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)
      data.forEach((item: DataItem) => {
        this.set(item.id, item)
      })
      this.save()
      this.emit('imported', data)
    } catch (error) {
      logger.error('Failed to import data:', error)
    }
  }
}

export const dataService = DataService.getInstance()
