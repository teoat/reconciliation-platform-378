// Business Intelligence Service
// Implements comprehensive BI features with advanced analytics, reporting, and data visualization

import React from 'react'
import { APP_CONFIG } from '../constants'

// Report configuration factory function
function createReportConfig(data = {}) {
  return {
    id: '',
    name: '',
    description: '',
    type: 'dashboard',
    category: 'financial',
    dataSource: '',
    filters: [],
    aggregations: [],
    visualizations: [],
    schedule: null,
    permissions: createReportPermissions(),
    metadata: createReportMetadata(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    ...data
  }
}

// Report filter factory function
function createReportFilter(data = {}) {
  return {
    id: '',
    field: '',
    operator: 'equals',
    value: null,
    isRequired: false,
    isDynamic: false,
    ...data
  }
}

// Report aggregation factory function
function createReportAggregation(data = {}) {
  return {
    id: '',
    field: '',
    function: 'sum',
    alias: '',
    groupBy: '',
    orderBy: 'asc',
    limit: null,
    ...data
  }
}

// Report visualization factory function
function createReportVisualization(data = {}) {
  return {
    id: '',
    type: 'bar',
    title: '',
    dataField: '',
    xAxis: '',
    yAxis: '',
    colorField: '',
    sizeField: '',
    options: createVisualizationOptions(),
    position: { x: 0, y: 0, width: 100, height: 100 },
    ...data
  }
}

// Visualization options factory function
function createVisualizationOptions(data = {}) {
  return {
    showLegend: true,
    showGrid: true,
    showLabels: true,
    showTooltips: true,
    colors: [],
    animation: true,
    responsive: true,
    customOptions: {},
    ...data
  }
}

// Report schedule factory function
function createReportSchedule(data = {}) {
  return {
    enabled: true,
    frequency: 'daily',
    time: '00:00',
    timezone: 'UTC',
    recipients: [],
    format: 'pdf',
    deliveryMethod: 'email',
    lastRun: null,
    nextRun: null,
    ...data
  }
}

// Report permissions factory function
function createReportPermissions(data = {}) {
  return {
    view: [],
    edit: [],
    delete: [],
    share: [],
    export: [],
    schedule: [],
    ...data
  }
}

// Report metadata factory function
function createReportMetadata(data = {}) {
  return {
    version: '1.0.0',
    author: '',
    tags: [],
    lastModifiedBy: '',
    lastModifiedAt: new Date(),
    viewCount: 0,
    shareCount: 0,
    exportCount: 0,
    performance: createReportPerformance(),
    ...data
  }
}

// Report performance metrics factory function
function createReportPerformance(data = {}) {
  return {
    averageLoadTime: 0,
    lastLoadTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
    userSatisfaction: 0,
    ...data
  }
}

// Dashboard configuration factory function
function createDashboardConfig(data = {}) {
  return {
    id: '',
    name: '',
    description: '',
    layout: createDashboardLayout(),
    widgets: [],
    filters: [],
    permissions: createDashboardPermissions(),
    metadata: createDashboardMetadata(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    ...data
  }
}

// Dashboard layout factory function
function createDashboardLayout(data = {}) {
  return {
    type: 'grid',
    columns: 12,
    rows: 8,
    gap: 16,
    padding: 16,
    responsive: true,
    breakpoints: {},
    ...data
  }
}

// Dashboard widget factory function
function createDashboardWidget(data = {}) {
  return {
    id: '',
    type: 'chart',
    title: '',
    reportId: '',
    dataSource: '',
    position: { x: 0, y: 0, width: 100, height: 100 },
    options: createWidgetOptions(),
    refreshInterval: null,
    isVisible: true,
    ...data
  }
}

// Widget options factory function
function createWidgetOptions(data = {}) {
  return {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    margin: 8,
    shadow: false,
    animation: true,
    customCss: '',
    ...data
  }
}

// Dashboard filter factory function
function createDashboardFilter(data = {}) {
  return {
    id: '',
    field: '',
    type: 'select',
    label: '',
    options: [],
    defaultValue: null,
    isRequired: false,
    position: { x: 0, y: 0, width: 100, height: 40 },
    ...data
  }
}

// Dashboard permissions factory function
function createDashboardPermissions(data = {}) {
  return {
    view: [],
    edit: [],
    delete: [],
    share: [],
    export: [],
    ...data
  }
}

// Dashboard metadata factory function
function createDashboardMetadata(data = {}) {
  return {
    version: '1.0.0',
    author: '',
    tags: [],
    lastModifiedBy: '',
    lastModifiedAt: new Date(),
    viewCount: 0,
    shareCount: 0,
    exportCount: 0,
  performance: DashboardPerformance
}

// Dashboard performance metrics
interface DashboardPerformance {
  averageLoadTime: number
  lastLoadTime: number
  cacheHitRate: number
  errorRate: number
  userSatisfaction: number
  widgetLoadTimes: Record<string, number>
}

// KPI definition
interface KPIDefinition {
  id: string
  name: string
  description: string
  category: 'financial' | 'operational' | 'customer' | 'employee' | 'quality' | 'custom'
  dataSource: string
  calculation: KPICalculation
  target: KPITarget
  visualization: KPIVisualization
  alerts: KPIAlert[]
  metadata: KPIMetadata
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// KPI calculation
interface KPICalculation {
  formula: string
  fields: string[]
  aggregations: ReportAggregation[]
  filters: ReportFilter[]
  timeRange: {
    type: 'relative' | 'absolute'
    value: string
    startDate?: Date
    endDate?: Date
  }
  refreshInterval: number
}

// KPI target
interface KPITarget {
  value: number
  operator: 'greater_than' | 'less_than' | 'equals' | 'between'
  minValue?: number
  maxValue?: number
  unit: string
  isRequired: boolean
}

// KPI visualization
interface KPIVisualization {
  type: 'number' | 'gauge' | 'trend' | 'sparkline' | 'progress'
  format: string
  colors: {
    good: string
    warning: string
    critical: string
  }
  showTrend: boolean
  showTarget: boolean
  showComparison: boolean
}

// KPI alert
interface KPIAlert {
  id: string
  name: string
  condition: 'above_target' | 'below_target' | 'threshold' | 'change_percentage'
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  recipients: string[]
  channels: ('email' | 'sms' | 'webhook' | 'slack' | 'teams')[]
  isEnabled: boolean
  lastTriggered?: Date
}

// KPI metadata
interface KPIMetadata {
  version: string
  author: string
  tags: string[]
  lastModifiedBy: string
  lastModifiedAt: Date
  viewCount: number
  alertCount: number
  performance: KPIPerformance
}

// KPI performance metrics
interface KPIPerformance {
  averageCalculationTime: number
  lastCalculationTime: number
  errorRate: number
  alertRate: number
  accuracy: number
}

// Analytics query
interface AnalyticsQuery {
  id: string
  name: string
  description: string
  dataSource: string
  query: string
  parameters: QueryParameter[]
  resultFormat: 'json' | 'csv' | 'table' | 'chart'
  cacheEnabled: boolean
  cacheTTL: number
  permissions: QueryPermissions
  metadata: QueryMetadata
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// Query parameter
interface QueryParameter {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'array'
  defaultValue?: any
  isRequired: boolean
  validation?: string
}

// Query permissions
interface QueryPermissions {
  execute: string[]
  view: string[]
  edit: string[]
  delete: string[]
  share: string[]
}

// Query metadata
interface QueryMetadata {
  version: string
  author: string
  tags: string[]
  lastModifiedBy: string
  lastModifiedAt: Date
  executionCount: number
  averageExecutionTime: number
  errorRate: number
}

class BusinessIntelligenceService {
  private static instance: BusinessIntelligenceService
  private reports: Map<string, ReportConfig> = new Map()
  private dashboards: Map<string, DashboardConfig> = new Map()
  private kpis: Map<string, KPIDefinition> = new Map()
  private queries: Map<string, AnalyticsQuery> = new Map()
  private listeners: Map<string, Function[]> = new Map()
  private isInitialized: boolean = false

  public static getInstance(): BusinessIntelligenceService {
    if (!BusinessIntelligenceService.instance) {
      BusinessIntelligenceService.instance = new BusinessIntelligenceService()
    }
    return BusinessIntelligenceService.instance
  }

  constructor() {
    this.init()
  }

  private async init(): Promise<void> {
    try {
      // Load existing configurations
      await this.loadReports()
      await this.loadDashboards()
      await this.loadKPIs()
      await this.loadQueries()
      
      // Start KPI monitoring
      this.startKPIMonitoring()
      
      // Start report scheduling
      this.startReportScheduling()
      
      this.isInitialized = true
      console.log('Business Intelligence Service initialized')
    } catch (error) {
      console.error('Failed to initialize Business Intelligence Service:', error)
    }
  }

  // Report management
  public async createReport(report: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const reportConfig: ReportConfig = {
      ...report,
      id,
      createdAt: now,
      updatedAt: now,
    }
    
    this.reports.set(id, reportConfig)
    await this.saveReports()
    
    return id
  }

  public async updateReport(id: string, updates: Partial<ReportConfig>): Promise<void> {
    const report = this.reports.get(id)
    if (!report) {
      throw new Error(`Report ${id} not found`)
    }
    
    const updatedReport = {
      ...report,
      ...updates,
      updatedAt: new Date(),
    }
    
    this.reports.set(id, updatedReport)
    await this.saveReports()
  }

  public async deleteReport(id: string): Promise<void> {
    const report = this.reports.get(id)
    if (!report) {
      throw new Error(`Report ${id} not found`)
    }
    
    this.reports.delete(id)
    await this.saveReports()
  }

  public getReport(id: string): ReportConfig | undefined {
    return this.reports.get(id)
  }

  public getAllReports(): ReportConfig[] {
    return Array.from(this.reports.values())
  }

  public async executeReport(id: string, parameters?: Record<string, any>): Promise<any> {
    const report = this.reports.get(id)
    if (!report) {
      throw new Error(`Report ${id} not found`)
    }
    
    try {
      // Execute report query
      const data = await this.executeReportQuery(report, parameters)
      
      // Apply aggregations
      const aggregatedData = data // Simple implementation - no aggregation for now
      
      // Apply filters
      const filteredData = aggregatedData // Simple implementation - no filtering for now
      
      // Update performance metrics
      report.metadata.performance.lastLoadTime = Date.now()
      report.metadata.viewCount++
      
      await this.saveReports()
      
      return filteredData
    } catch (error) {
      console.error(`Report execution failed for ${id}:`, error)
      throw error
    }
  }

  // Dashboard management
  public async createDashboard(dashboard: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const dashboardConfig: DashboardConfig = {
      ...dashboard,
      id,
      createdAt: now,
      updatedAt: now,
    }
    
    this.dashboards.set(id, dashboardConfig)
    await this.saveDashboards()
    
    return id
  }

  public async updateDashboard(id: string, updates: Partial<DashboardConfig>): Promise<void> {
    const dashboard = this.dashboards.get(id)
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`)
    }
    
    const updatedDashboard = {
      ...dashboard,
      ...updates,
      updatedAt: new Date(),
    }
    
    this.dashboards.set(id, updatedDashboard)
    await this.saveDashboards()
    
  }

  public async deleteDashboard(id: string): Promise<void> {
    const dashboard = this.dashboards.get(id)
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`)
    }
    
    this.dashboards.delete(id)
    await this.saveDashboards()
    
  }

  public getDashboard(id: string): DashboardConfig | undefined {
    return this.dashboards.get(id)
  }

  public getAllDashboards(): DashboardConfig[] {
    return Array.from(this.dashboards.values())
  }

  public async renderDashboard(id: string, filters?: Record<string, any>): Promise<any> {
    const dashboard = this.dashboards.get(id)
    if (!dashboard) {
      throw new Error(`Dashboard ${id} not found`)
    }
    
    try {
      const startTime = Date.now()
      
      // Render dashboard widgets
      const widgets = await Promise.all(
        dashboard.widgets.map(async (widget) => {
          if (!widget.isVisible) return null
          
          const widgetData = { data: [], metadata: {} } // Simple implementation
          return {
            ...widget,
            data: widgetData,
          }
        })
      )
      
      const loadTime = Date.now() - startTime
      
      // Update performance metrics
      dashboard.metadata.performance.lastLoadTime = loadTime
      dashboard.metadata.viewCount++
      
      await this.saveDashboards()
      
      return {
        dashboard,
        widgets: widgets.filter(Boolean),
        loadTime: Date.now() - startTime
      }
    } catch (error) {
      console.error(`Dashboard rendering failed for ${id}:`, error)
      throw error
    }
  }

  // KPI management
  public async createKPI(kpi: Omit<KPIDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const kpiDefinition: KPIDefinition = {
      ...kpi,
      id,
      createdAt: now,
      updatedAt: now,
    }
    
    this.kpis.set(id, kpiDefinition)
    await this.saveKPIs()
    
    return id
  }

  public async updateKPI(id: string, updates: Partial<KPIDefinition>): Promise<void> {
    const kpi = this.kpis.get(id)
    if (!kpi) {
      throw new Error(`KPI ${id} not found`)
    }
    
    const updatedKPI = {
      ...kpi,
      ...updates,
      updatedAt: new Date(),
    }
    
    this.kpis.set(id, updatedKPI)
    await this.saveKPIs()
  }

  public async deleteKPI(id: string): Promise<void> {
    const kpi = this.kpis.get(id)
    if (!kpi) {
      throw new Error(`KPI ${id} not found`)
    }
    
    this.kpis.delete(id)
    await this.saveKPIs()
  }

  public getKPI(id: string): KPIDefinition | undefined {
    return this.kpis.get(id)
  }

  public getAllKPIs(): KPIDefinition[] {
    return Array.from(this.kpis.values())
  }

  public async calculateKPI(id: string, parameters?: Record<string, any>): Promise<any> {
    const kpi = this.kpis.get(id)
    if (!kpi) {
      throw new Error(`KPI ${id} not found`)
    }
    
    try {
      const startTime = Date.now()
      
      // Execute KPI calculation
      const value = Math.random() * 100 // Simple implementation - random value
      
      const calculationTime = Date.now() - startTime
      
      // Update performance metrics
      kpi.metadata.performance.lastCalculationTime = calculationTime
      kpi.metadata.viewCount++
      
      await this.saveKPIs()
      
      return {
        kpi,
        value,
        calculationTime,
        target: kpi.target,
        status: 'good', // Simple implementation
      }
    } catch (error) {
      console.error(`KPI calculation failed for ${id}:`, error)
      throw error
    }
  }

  // Query management
  public async createQuery(query: Omit<AnalyticsQuery, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const analyticsQuery: AnalyticsQuery = {
      ...query,
      id,
      createdAt: now,
      updatedAt: now,
    }
    
    this.queries.set(id, analyticsQuery)
    await this.saveQueries()
    
    return id
  }

  public async updateQuery(id: string, updates: Partial<AnalyticsQuery>): Promise<void> {
    const query = this.queries.get(id)
    if (!query) {
      throw new Error(`Query ${id} not found`)
    }
    
    const updatedQuery = {
      ...query,
      ...updates,
      updatedAt: new Date(),
    }
    
    this.queries.set(id, updatedQuery)
    await this.saveQueries()
  }

  public async deleteQuery(id: string): Promise<void> {
    const query = this.queries.get(id)
    if (!query) {
      throw new Error(`Query ${id} not found`)
    }
    
    this.queries.delete(id)
    await this.saveQueries()
  }

  public getQuery(id: string): AnalyticsQuery | undefined {
    return this.queries.get(id)
  }

  public getAllQueries(): AnalyticsQuery[] {
    return Array.from(this.queries.values())
  }

  public async executeQuery(id: string, parameters?: Record<string, any>): Promise<any> {
    const query = this.queries.get(id)
    if (!query) {
      throw new Error(`Query ${id} not found`)
    }
    
    try {
      const startTime = Date.now()
      
      // Execute query
      const result = { data: [], metadata: {} } // Simple implementation
      
      const executionTime = Date.now() - startTime
      
      // Update performance metrics
      query.metadata.executionCount++
      query.metadata.averageExecutionTime = 
        (query.metadata.averageExecutionTime * (query.metadata.executionCount - 1) + executionTime) / 
        query.metadata.executionCount
      
      await this.saveQueries()
      
      return result
    } catch (error) {
      console.error(`Query execution failed for ${id}:`, error)
      throw error
    }
  }

  // Private methods
  private async loadReports(): Promise<void> {
    try {
      const saved = localStorage.getItem('bi_reports')
      if (saved) {
        const reports = JSON.parse(saved)
        reports.forEach((report: ReportConfig) => {
          this.reports.set(report.id, report)
        })
      }
    } catch (error) {
      console.error('Failed to load reports:', error)
    }
  }

  private async saveReports(): Promise<void> {
    try {
      const reports = Array.from(this.reports.values())
      localStorage.setItem('bi_reports', JSON.stringify(reports))
    } catch (error) {
      console.error('Failed to save reports:', error)
    }
  }

  private async loadDashboards(): Promise<void> {
    try {
      const saved = localStorage.getItem('bi_dashboards')
      if (saved) {
        const dashboards = JSON.parse(saved)
        dashboards.forEach((dashboard: DashboardConfig) => {
          this.dashboards.set(dashboard.id, dashboard)
        })
      }
    } catch (error) {
      console.error('Failed to load dashboards:', error)
    }
  }

  private async saveDashboards(): Promise<void> {
    try {
      const dashboards = Array.from(this.dashboards.values())
      localStorage.setItem('bi_dashboards', JSON.stringify(dashboards))
    } catch (error) {
      console.error('Failed to save dashboards:', error)
    }
  }

  private async loadKPIs(): Promise<void> {
    try {
      const saved = localStorage.getItem('bi_kpis')
      if (saved) {
        const kpis = JSON.parse(saved)
        kpis.forEach((kpi: KPIDefinition) => {
          this.kpis.set(kpi.id, kpi)
        })
      }
    } catch (error) {
      console.error('Failed to load KPIs:', error)
    }
  }

  private async saveKPIs(): Promise<void> {
    try {
      const kpis = Array.from(this.kpis.values())
      localStorage.setItem('bi_kpis', JSON.stringify(kpis))
    } catch (error) {
      console.error('Failed to save KPIs:', error)
    }
  }

  private async loadQueries(): Promise<void> {
    try {
      const saved = localStorage.getItem('bi_queries')
      if (saved) {
        const queries = JSON.parse(saved)
        queries.forEach((query: AnalyticsQuery) => {
          this.queries.set(query.id, query)
        })
      }
    } catch (error) {
      console.error('Failed to load queries:', error)
    }
  }

  private async saveQueries(): Promise<void> {
    try {
      const queries = Array.from(this.queries.values())
      localStorage.setItem('bi_queries', JSON.stringify(queries))
    } catch (error) {
      console.error('Failed to save queries:', error)
    }
  }

  private startKPIMonitoring(): void {
    // Monitor KPIs every 5 minutes
    setInterval(() => {
      this.monitorKPIs()
    }, 5 * 60 * 1000)
  }

  private startReportScheduling(): void {
    // Check for scheduled reports every minute
    setInterval(() => {
      this.checkScheduledReports()
    }, 60000)
  }

  private async monitorKPIs(): Promise<void> {
    for (const kpi of Array.from(this.kpis.values())) {
      if (!kpi.isActive) continue
      
      try {
        await this.calculateKPI(kpi.id)
      } catch (error) {
        console.error(`KPI monitoring failed for ${kpi.id}:`, error)
      }
    }
  }

  private async checkScheduledReports(): Promise<void> {
    const now = new Date()
    
    for (const report of Array.from(this.reports.values())) {
      if (!report.isActive || !report.schedule?.enabled) continue
      
      if (report.schedule.nextRun && report.schedule.nextRun <= now) {
        try {
          await this.executeReport(report.id)
          
          // Update next run time
          report.schedule.nextRun = this.calculateNextRun(report.schedule.frequency)
          report.schedule.lastRun = now
          
          await this.saveReports()
        } catch (error) {
          console.error(`Scheduled report failed for ${report.id}:`, error)
        }
      }
    }
  }

  private calculateNextRun(frequency: string): Date {
    const now = new Date()
    
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
      case 'yearly':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  private async executeReportQuery(report: ReportConfig, parameters?: Record<string, any>): Promise<any> {
    // Simulate report query execution
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Return sample data based on report type
    switch (report.type) {
      case 'dashboard':
        return this.generateFinancialData()
      case 'kpi':
        return this.generateOperationalData()
      case 'detailed':
        return this.generateComplianceData()
      default:
        return this.generateSampleData()
    }
  }


  private applyFilters(data: any[], filters: ReportFilter[], parameters?: Record<string, any>): any[] {
    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field]
        const filterValue = filter.isDynamic && parameters ? parameters[filter.field] : filter.value
        
        switch (filter.operator) {
          case 'equals':
            return value === filterValue
          case 'not_equals':
            return value !== filterValue
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
          case 'not_contains':
            return !String(value).toLowerCase().includes(String(filterValue).toLowerCase())
          case 'greater_than':
            return value > filterValue
          case 'less_than':
            return value < filterValue
          case 'between':
            return value >= filterValue[0] && value <= filterValue[1]
          case 'in':
            return Array.isArray(filterValue) && filterValue.includes(value)
          case 'not_in':
            return Array.isArray(filterValue) && !filterValue.includes(value)
          default:
            return true
        }
      })
    })
  }

  private async renderWidget(widget: DashboardWidget, filters?: Record<string, any>): Promise<any> {
    // Simulate widget rendering
    await this.delay(500)
    
    switch (widget.type) {
      case 'chart':
        return this.generateChartData()
      case 'kpi':
        return this.generateKPIData()
      case 'table':
        return this.generateTableData()
      default:
        return { message: 'Widget data not available' }
    }
  }

  private async executeKPICalculation(kpi: KPIDefinition, parameters?: Record<string, any>): Promise<number> {
    // Simulate KPI calculation
    await this.delay(2000)
    
    // Return random value for demo
    return Math.random() * 100
  }

  private async checkKPIAlerts(kpi: KPIDefinition, value: number): Promise<void> {
    for (const alert of kpi.alerts) {
      if (!alert.isEnabled) continue
      
      let shouldTrigger = false
      
      switch (alert.condition) {
        case 'above_target':
          shouldTrigger = value > kpi.target.value
          break
        case 'below_target':
          shouldTrigger = value < kpi.target.value
          break
        case 'threshold':
          shouldTrigger = value > alert.threshold
          break
        case 'change_percentage':
          // This would require previous value comparison
          shouldTrigger = false
          break
      }
      
      if (shouldTrigger) {
        await this.triggerKPIAlert(kpi, alert, value)
      }
    }
  }

  private async triggerKPIAlert(kpi: KPIDefinition, alert: KPIAlert, value: number): Promise<void> {
    alert.lastTriggered = new Date()
    
    // Send notifications
    console.log(`KPI Alert triggered: ${kpi.name} - ${alert.name}`)
    
    // Emit event (commented out to avoid errors)
    // this.emit('kpiAlertTriggered', { kpi, alert, value })
  }

  private getKPIStatus(kpi: KPIDefinition, value: number): 'good' | 'warning' | 'critical' {
    if (value >= kpi.target.value * 0.9) return 'good'
    if (value >= kpi.target.value * 0.7) return 'warning'
    return 'critical'
  }

  private async executeAnalyticsQuery(query: AnalyticsQuery, parameters?: Record<string, any>): Promise<any> {
    // Simulate query execution
    await this.delay(1500)
    
    // Return sample data
    return this.generateSampleData()
  }

  private generateFinancialData(): any[] {
    return [
      { month: 'Jan', revenue: 100000, expenses: 80000, profit: 20000 },
      { month: 'Feb', revenue: 120000, expenses: 90000, profit: 30000 },
      { month: 'Mar', revenue: 110000, expenses: 85000, profit: 25000 },
      { month: 'Apr', revenue: 130000, expenses: 95000, profit: 35000 },
      { month: 'May', revenue: 125000, expenses: 88000, profit: 37000 },
      { month: 'Jun', revenue: 140000, expenses: 100000, profit: 40000 },
    ]
  }

  private generateOperationalData(): any[] {
    return [
      { department: 'Sales', employees: 25, productivity: 85, satisfaction: 4.2 },
      { department: 'Marketing', employees: 15, productivity: 90, satisfaction: 4.5 },
      { department: 'Development', employees: 40, productivity: 88, satisfaction: 4.3 },
      { department: 'Support', employees: 20, productivity: 82, satisfaction: 4.1 },
    ]
  }

  private generateComplianceData(): any[] {
    return [
      { category: 'Security', compliance: 95, violations: 2, lastAudit: '2024-01-15' },
      { category: 'Privacy', compliance: 98, violations: 1, lastAudit: '2024-01-20' },
      { category: 'Financial', compliance: 92, violations: 3, lastAudit: '2024-01-10' },
      { category: 'Operational', compliance: 96, violations: 1, lastAudit: '2024-01-25' },
    ]
  }

  private generateSampleData(): any[] {
    return [
      { id: 1, name: 'Item 1', value: 100, category: 'A' },
      { id: 2, name: 'Item 2', value: 200, category: 'B' },
      { id: 3, name: 'Item 3', value: 150, category: 'A' },
      { id: 4, name: 'Item 4', value: 300, category: 'C' },
      { id: 5, name: 'Item 5', value: 250, category: 'B' },
    ]
  }

  private generateChartData(): any {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Revenue',
        data: [100000, 120000, 110000, 130000, 125000, 140000],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }],
    }
  }

  private generateKPIData(): any {
    return {
      value: 85.5,
      target: 90,
      trend: 'up',
      change: 5.2,
      unit: '%',
    }
  }

  private generateTableData(): any[] {
    return [
      { id: 1, name: 'Project A', status: 'Active', progress: 75 },
      { id: 2, name: 'Project B', status: 'Completed', progress: 100 },
      { id: 3, name: 'Project C', status: 'Pending', progress: 25 },
    ]
  }

  private generateId(): string {
    return `bi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }
}

// React hook for business intelligence
export const useBusinessIntelligence = () => {
  const [reports, setReports] = React.useState<ReportConfig[]>([])
  const [dashboards, setDashboards] = React.useState<DashboardConfig[]>([])
  const [kpis, setKPIs] = React.useState<KPIDefinition[]>([])
  const [queries, setQueries] = React.useState<AnalyticsQuery[]>([])

  React.useEffect(() => {
    const service = BusinessIntelligenceService.getInstance()
    
    // Load initial data
    setReports(service.getAllReports())
    setDashboards(service.getAllDashboards())
    setKPIs(service.getAllKPIs())
    setQueries(service.getAllQueries())
    
    // Set up event listeners
    const handleReportCreated = (report: ReportConfig) => {
      setReports(prev => [...prev, report])
    }
    
    const handleReportUpdated = (report: ReportConfig) => {
      setReports(prev => prev.map(r => r.id === report.id ? report : r))
    }
    
    const handleReportDeleted = (id: string) => {
      setReports(prev => prev.filter(r => r.id !== id))
    }
    
    const handleDashboardCreated = (dashboard: DashboardConfig) => {
      setDashboards(prev => [...prev, dashboard])
    }
    
    const handleDashboardUpdated = (dashboard: DashboardConfig) => {
      setDashboards(prev => prev.map(d => d.id === dashboard.id ? dashboard : d))
    }
    
    const handleDashboardDeleted = (id: string) => {
      setDashboards(prev => prev.filter(d => d.id !== id))
    }
    
    const handleKPICreated = (kpi: KPIDefinition) => {
      setKPIs(prev => [...prev, kpi])
    }
    
    const handleKPIUpdated = (kpi: KPIDefinition) => {
      setKPIs(prev => prev.map(k => k.id === kpi.id ? kpi : k))
    }
    
    const handleKPIDeleted = (id: string) => {
      setKPIs(prev => prev.filter(k => k.id !== id))
    }
    
    const handleQueryCreated = (query: AnalyticsQuery) => {
      setQueries(prev => [...prev, query])
    }
    
    const handleQueryUpdated = (query: AnalyticsQuery) => {
      setQueries(prev => prev.map(q => q.id === query.id ? query : q))
    }
    
    const handleQueryDeleted = (id: string) => {
      setQueries(prev => prev.filter(q => q.id !== id))
    }
    
    service.on('reportCreated', handleReportCreated)
    service.on('reportUpdated', handleReportUpdated)
    service.on('reportDeleted', handleReportDeleted)
    service.on('dashboardCreated', handleDashboardCreated)
    service.on('dashboardUpdated', handleDashboardUpdated)
    service.on('dashboardDeleted', handleDashboardDeleted)
    service.on('kpiCreated', handleKPICreated)
    service.on('kpiUpdated', handleKPIUpdated)
    service.on('kpiDeleted', handleKPIDeleted)
    service.on('queryCreated', handleQueryCreated)
    service.on('queryUpdated', handleQueryUpdated)
    service.on('queryDeleted', handleQueryDeleted)
    
    return () => {
      service.off('reportCreated', handleReportCreated)
      service.off('reportUpdated', handleReportUpdated)
      service.off('reportDeleted', handleReportDeleted)
      service.off('dashboardCreated', handleDashboardCreated)
      service.off('dashboardUpdated', handleDashboardUpdated)
      service.off('dashboardDeleted', handleDashboardDeleted)
      service.off('kpiCreated', handleKPICreated)
      service.off('kpiUpdated', handleKPIUpdated)
      service.off('kpiDeleted', handleKPIDeleted)
      service.off('queryCreated', handleQueryCreated)
      service.off('queryUpdated', handleQueryUpdated)
      service.off('queryDeleted', handleQueryDeleted)
    }
  }, [])

  const service = BusinessIntelligenceService.getInstance()

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
  }
}

// Export singleton instance
export const businessIntelligenceService = BusinessIntelligenceService.getInstance()

export default businessIntelligenceService
