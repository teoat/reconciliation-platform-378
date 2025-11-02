// Smart Filter Presets & AI Field Mapping Service
// DEPRECATED: This file has been refactored into modular structure.
// Use: import { smartFilterService } from './smartFilter'
import { smartFilterService as service } from './smartFilter'
export { service as default, service as smartFilterService }
export * from './smartFilter'

// Legacy exports for backward compatibility - will be removed
import { FilterPreset, FilterConfig, FieldMapping, AIMappingSuggestion, SmartDefaults } from './smartFilter/types';
import { PresetManager } from './smartFilter/presets';

class SmartFilterService {
  private static instance: SmartFilterService
  private presetManager: PresetManager
  private fieldMappings: Map<string, FieldMapping[]> = new Map()
  private aiSuggestions: Map<string, AIMappingSuggestion[]> = new Map()
  private listeners: Map<string, Function[]> = new Map()

  public static getInstance(): SmartFilterService {
    if (!SmartFilterService.instance) {
      SmartFilterService.instance = new SmartFilterService()
    }
    return SmartFilterService.instance
  }

  constructor() {
    this.presetManager = new PresetManager()
  }

  // Filter Preset Management
  public createPreset(
    preset: Omit<FilterPreset, 'id' | 'usageCount' | 'lastUsed'>
  ): FilterPreset {
    const newPreset = this.presetManager.createPreset(preset);
    this.emit('presetCreated', newPreset);
    return newPreset;
  }

  public getPreset(id: string): FilterPreset | undefined {
    return this.presetManager.getPreset(id);
  }

  public getAllPresets(category?: FilterPreset['category']): FilterPreset[] {
    return this.presetManager.getAllPresets(category);
  }

  public getRecentPresets(limit: number = 5): FilterPreset[] {
    return this.presetManager.getRecentPresets(limit);
  }

  public getPopularPresets(limit: number = 5): FilterPreset[] {
    return this.presetManager.getPopularPresets(limit);
  }

  public usePreset(id: string): FilterPreset | undefined {
    const preset = this.presetManager.getPreset(id);
    if (!preset) return undefined;

    this.presetManager.incrementUsage(id);
    this.emit('presetUsed', preset);
    return preset;
  }

  public updatePreset(id: string, updates: Partial<FilterPreset>): FilterPreset | undefined {
    const updated = this.presetManager.updatePreset(id, updates);
    if (updated) {
      this.emit('presetUpdated', updated);
    }
    return updated;
  }

  public deletePreset(id: string): boolean {
    const deleted = this.presetManager.deletePreset(id);
    if (deleted) {
      this.emit('presetDeleted', id);
    }
    return deleted;
  }

  private calculatePresetConfidence(filters: FilterConfig[]): number {
    // Calculate confidence based on filter complexity and field coverage
    let confidence = 0.5 // Base confidence
    
    // Increase confidence for more specific filters
    filters.forEach(filter => {
      if (filter.isRequired) confidence += 0.1
      if (filter.weight > 0.8) confidence += 0.05
    })
    
    // Decrease confidence for too many filters (over-filtering)
    if (filters.length > 5) confidence -= 0.1
    
    return Math.min(0.95, Math.max(0.1, confidence))
  }

  // AI Field Mapping
  public generateFieldMappingSuggestions(
    sourceFields: string[],
    targetFields: string[],
    sampleData?: any[]
  ): AIMappingSuggestion[] {
    const suggestions: AIMappingSuggestion[] = []

    // Exact match suggestions
    sourceFields.forEach(sourceField => {
      const exactMatch = targetFields.find(targetField => 
        this.normalizeFieldName(sourceField) === this.normalizeFieldName(targetField)
      )
      
      if (exactMatch) {
        suggestions.push({
          id: `exact_${sourceField}_${exactMatch}`,
          sourceFields: [sourceField],
          targetFields: [exactMatch],
          confidence: 0.95,
          reasoning: 'Exact field name match',
          alternatives: [],
          suggestedTransformations: []
        })
      }
    })

    // Fuzzy match suggestions
    sourceFields.forEach(sourceField => {
      const fuzzyMatches = targetFields
        .map(targetField => ({
          field: targetField,
          similarity: this.calculateSimilarity(sourceField, targetField)
        }))
        .filter(match => match.similarity > 0.7)
        .sort((a, b) => b.similarity - a.similarity)

      if (fuzzyMatches.length > 0) {
        const bestMatch = fuzzyMatches[0]
        suggestions.push({
          id: `fuzzy_${sourceField}_${bestMatch.field}`,
          sourceFields: [sourceField],
          targetFields: [bestMatch.field],
          confidence: bestMatch.similarity,
          reasoning: `Fuzzy match with ${Math.round(bestMatch.similarity * 100)}% similarity`,
          alternatives: fuzzyMatches.slice(1).map(match => ({
            sourceField,
            targetField: match.field,
            confidence: match.similarity,
            mappingType: 'fuzzy',
            transformation: undefined,
            validation: undefined
          })),
          suggestedTransformations: []
        })
      }
    })

    // Semantic match suggestions (based on field meaning)
    const semanticMappings = this.generateSemanticMappings(sourceFields, targetFields)
    suggestions.push(...semanticMappings)

    // Store suggestions for later use
    const key = `${sourceFields.join(',')}_${targetFields.join(',')}`
    this.aiSuggestions.set(key, suggestions)

    return suggestions
  }

  private normalizeFieldName(fieldName: string): string {
    return fieldName
      .toLowerCase()
      .replace(/[_\s-]/g, '')
      .replace(/id$/, '')
      .replace(/name$/, '')
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeFieldName(str1)
    const s2 = this.normalizeFieldName(str2)
    
    if (s1 === s2) return 1.0
    
    // Simple Levenshtein distance-based similarity
    const maxLength = Math.max(s1.length, s2.length)
    const distance = this.levenshteinDistance(s1, s2)
    
    return 1 - (distance / maxLength)
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private generateSemanticMappings(sourceFields: string[], targetFields: string[]): AIMappingSuggestion[] {
    const semanticMappings: AIMappingSuggestion[] = []
    
    // Common field mappings
    const commonMappings = {
      'amount': ['value', 'total', 'sum', 'price', 'cost'],
      'date': ['created_at', 'updated_at', 'timestamp', 'time'],
      'description': ['note', 'comment', 'details', 'summary'],
      'status': ['state', 'condition', 'phase'],
      'id': ['identifier', 'key', 'primary_key'],
      'name': ['title', 'label', 'display_name']
    }

    sourceFields.forEach(sourceField => {
      const normalizedSource = this.normalizeFieldName(sourceField)
      
      Object.entries(commonMappings).forEach(([semanticType, variations]) => {
        if (variations.includes(normalizedSource)) {
          const matchingTargets = targetFields.filter(targetField => {
            const normalizedTarget = this.normalizeFieldName(targetField)
            return variations.includes(normalizedTarget)
          })

          if (matchingTargets.length > 0) {
            semanticMappings.push({
              id: `semantic_${sourceField}_${matchingTargets[0]}`,
              sourceFields: [sourceField],
              targetFields: [matchingTargets[0]],
              confidence: 0.8,
              reasoning: `Semantic match: both fields represent ${semanticType}`,
              alternatives: matchingTargets.slice(1).map(targetField => ({
                sourceField,
                targetField,
                confidence: 0.7,
                mappingType: 'semantic',
                transformation: undefined,
                validation: undefined
              })),
              suggestedTransformations: []
            })
          }
        }
      })
    })

    return semanticMappings
  }

  public applyFieldMapping(
    sourceData: any[],
    mapping: FieldMapping,
    options: {
      validateData?: boolean
      transformData?: boolean
    } = {}
  ): any[] {
    const { validateData = true, transformData = true } = options
    
    return sourceData.map(item => {
      const mappedItem = { ...item }
      
      // Apply field mapping
      if (item[mapping.sourceField] !== undefined) {
        let value = item[mapping.sourceField]
        
        // Apply transformation if specified
        if (transformData && mapping.transformation) {
          value = this.applyTransformation(value, mapping.transformation)
        }
        
        // Validate data if specified
        if (validateData && mapping.validation) {
          if (!this.validateValue(value, mapping.validation)) {
            logger.warn(`Validation failed for field ${mapping.targetField}:`, value)
          }
        }
        
        mappedItem[mapping.targetField] = value
      }
      
      return mappedItem
    })
  }

  private applyTransformation(value: any, transformation: any): any {
    switch (transformation.type) {
      case 'format':
        // Apply formatting rules
        return this.formatValue(value, transformation.rules)
      case 'convert':
        // Convert data type
        return this.convertValue(value, transformation.rules)
      case 'extract':
        // Extract part of the value
        return this.extractValue(value, transformation.rules)
      case 'combine':
        // Combine multiple fields
        return this.combineValues(value, transformation.rules)
      default:
        return value
    }
  }

  private formatValue(value: any, rules: any[]): any {
    // Implement formatting logic
    return value
  }

  private convertValue(value: any, rules: any[]): any {
    // Implement conversion logic
    return value
  }

  private extractValue(value: any, rules: any[]): any {
    // Implement extraction logic
    return value
  }

  private combineValues(value: any, rules: any[]): any {
    // Implement combination logic
    return value
  }

  private validateValue(value: any, validation: any): boolean {
    if (validation.required && (value === null || value === undefined || value === '')) {
      return false
    }
    
    if (validation.minLength && value.length < validation.minLength) {
      return false
    }
    
    if (validation.maxLength && value.length > validation.maxLength) {
      return false
    }
    
    if (validation.format && !new RegExp(validation.format).test(value)) {
      return false
    }
    
    return true
  }

  // Smart Defaults
  public generateSmartDefaults(
    context: {
      projectType?: string
      userRole?: string
      recentActivity?: any[]
      dataSize?: number
    }
  ): SmartDefaults {
    const defaults: SmartDefaults = {
      filters: [],
      sorting: { field: 'created_at', direction: 'desc' },
      pagination: { pageSize: 50 },
      viewMode: 'table',
      columns: []
    }

    // Adjust based on context
    if (context.projectType === 'reconciliation') {
      defaults.filters = [
        {
          field: 'status',
          operator: 'in',
          value: ['pending', 'in_progress'],
          label: 'Status',
          isRequired: false,
          weight: 0.8
        }
      ]
      defaults.sorting = { field: 'priority', direction: 'desc' }
    }

    if (context.userRole === 'admin') {
      defaults.pagination.pageSize = 100
    }

    if (context.dataSize && context.dataSize > 1000) {
      defaults.viewMode = 'table'
      defaults.pagination.pageSize = 25
    }

    return defaults
  }

  // One-Click Mapping
  public createOneClickMapping(
    sourceField: string,
    targetField: string,
    confidence: number
  ): FieldMapping {
    return {
      sourceField,
      targetField,
      confidence,
      mappingType: confidence > 0.9 ? 'exact' : 'fuzzy',
      transformation: undefined,
      validation: {
        required: false
      }
    }
  }

  public applyOneClickMapping(
    sourceData: any[],
    sourceField: string,
    targetField: string
  ): any[] {
    const mapping = this.createOneClickMapping(sourceField, targetField, 0.95)
    return this.applyFieldMapping(sourceData, mapping)
  }

  // Analytics and Insights
  public getFilterAnalytics(): {
    mostUsedPresets: FilterPreset[]
    mostUsedFields: { field: string; count: number }[]
    averageFiltersPerPreset: number
    userPreferences: any
  } {
    const mostUsedPresets = this.getPopularPresets(10)
    
    const fieldUsage = new Map<string, number>()
    this.presets.forEach(preset => {
      preset.filters.forEach(filter => {
        fieldUsage.set(filter.field, (fieldUsage.get(filter.field) || 0) + preset.usageCount)
      })
    })
    
    const mostUsedFields = Array.from(fieldUsage.entries())
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    const totalFilters = Array.from(this.presets.values())
      .reduce((sum, preset) => sum + preset.filters.length, 0)
    const averageFiltersPerPreset = totalFilters / this.presets.size

    return {
      mostUsedPresets,
      mostUsedFields,
      averageFiltersPerPreset,
      userPreferences: {
        preferredViewMode: 'table',
        defaultPageSize: 50,
        favoritePresets: mostUsedPresets.slice(0, 3).map(p => p.id)
      }
    }
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

  // ============================================================================
  // FILTER PRESETS MANAGEMENT
  // ============================================================================

  public createDefaultPresets(): FilterPreset[] {
    const defaultPresets: FilterPreset[] = [
      {
        id: 'default_all',
        name: 'Show All',
        description: 'Display all records without filters',
        category: 'default',
        filters: [],
        usageCount: 0,
        lastUsed: new Date(),
        createdBy: 'system',
        isPublic: true,
        tags: ['default', 'all'],
        confidence: 1.0,
        isDefault: true
      },
      {
        id: 'default_recent',
        name: 'Recent Records',
        description: 'Show records from the last 7 days',
        category: 'default',
        filters: [{
          field: 'created_at',
          operator: 'greater_than',
          value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          label: 'Created After',
          isRequired: false,
          weight: 1.0
        }],
        usageCount: 0,
        lastUsed: new Date(),
        createdBy: 'system',
        isPublic: true,
        tags: ['default', 'recent', 'time'],
        confidence: 1.0,
        isDefault: true
      },
      {
        id: 'default_pending',
        name: 'Pending Review',
        description: 'Show records that need review',
        category: 'default',
        filters: [{
          field: 'status',
          operator: 'equals',
          value: 'pending',
          label: 'Status',
          isRequired: true,
          weight: 1.0
        }],
        usageCount: 0,
        lastUsed: new Date(),
        createdBy: 'system',
        isPublic: true,
        tags: ['default', 'status', 'pending'],
        confidence: 1.0,
        isDefault: true
      },
      {
        id: 'default_high_priority',
        name: 'High Priority',
        description: 'Show high priority records',
        category: 'default',
        filters: [{
          field: 'priority',
          operator: 'equals',
          value: 'high',
          label: 'Priority',
          isRequired: true,
          weight: 1.0
        }],
        usageCount: 0,
        lastUsed: new Date(),
        createdBy: 'system',
        isPublic: true,
        tags: ['default', 'priority', 'high'],
        confidence: 1.0,
        isDefault: true
      }
    ]

    // Add default presets to the service
    defaultPresets.forEach(preset => {
      this.presets.set(preset.id, preset)
    })

    return defaultPresets
  }

  public getSmartDefaults(context: {
    projectId?: string
    workflowStage?: string
    dataType?: string
    userId?: string
  }): FilterPreset[] {
    const smartDefaults: FilterPreset[] = []

    // Context-based smart defaults
    if (context.workflowStage === 'ingestion') {
      smartDefaults.push({
        id: 'smart_ingestion_errors',
        name: 'Ingestion Errors',
        description: 'Show records with ingestion errors',
        category: 'smart',
        filters: [{
          field: 'ingestion_status',
          operator: 'equals',
          value: 'error',
          label: 'Ingestion Status',
          isRequired: true,
          weight: 1.0
        }],
        usageCount: 0,
        lastUsed: new Date(),
        createdBy: 'system',
        isPublic: true,
        tags: ['smart', 'ingestion', 'errors'],
        confidence: 0.9,
        isSmart: true,
        metadata: context
      })
    }

    if (context.workflowStage === 'reconciliation') {
      smartDefaults.push({
        id: 'smart_unmatched',
        name: 'Unmatched Records',
        description: 'Show records that need matching',
        category: 'smart',
        filters: [{
          field: 'match_status',
          operator: 'equals',
          value: 'unmatched',
          label: 'Match Status',
          isRequired: true,
          weight: 1.0
        }],
        usageCount: 0,
        lastUsed: new Date(),
        createdBy: 'system',
        isPublic: true,
        tags: ['smart', 'reconciliation', 'unmatched'],
        confidence: 0.9,
        isSmart: true,
        metadata: context
      })
    }

    if (context.dataType === 'financial') {
      smartDefaults.push({
        id: 'smart_large_amounts',
        name: 'Large Amounts',
        description: 'Show records with amounts over $10,000',
        category: 'smart',
        filters: [{
          field: 'amount',
          operator: 'greater_than',
          value: 10000,
          label: 'Amount',
          isRequired: true,
          weight: 1.0
        }],
        usageCount: 0,
        lastUsed: new Date(),
        createdBy: 'system',
        isPublic: true,
        tags: ['smart', 'financial', 'large-amounts'],
        confidence: 0.8,
        isSmart: true,
        metadata: context
      })
    }

    return smartDefaults
  }

  public getFilterHistory(userId: string, limit: number = 10): FilterPreset[] {
    const userHistory = this.usageHistory.get(userId) || []
    return userHistory
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
      .slice(0, limit)
      .map(usage => this.presets.get(usage.presetId))
      .filter((preset): preset is FilterPreset => preset !== undefined)
  }

  public saveFilterPreset(
    preset: Omit<FilterPreset, 'id' | 'usageCount' | 'lastUsed' | 'createdBy'>,
    userId: string
  ): FilterPreset {
    const newPreset: FilterPreset = {
      ...preset,
      id: this.generateId(),
      usageCount: 0,
      lastUsed: new Date(),
      createdBy: userId
    }

    this.presets.set(newPreset.id, newPreset)
    this.savePresets()

    return newPreset
  }

  public updateFilterPreset(
    presetId: string,
    updates: Partial<FilterPreset>,
    userId: string
  ): FilterPreset | null {
    const existing = this.presets.get(presetId)
    if (!existing) return null

    // Only allow updates by the creator or system
    if (existing.createdBy !== userId && existing.createdBy !== 'system') {
      return null
    }

    const updatedPreset: FilterPreset = {
      ...existing,
      ...updates,
      id: presetId // Ensure ID doesn't change
    }

    this.presets.set(presetId, updatedPreset)
    this.savePresets()

    return updatedPreset
  }

  public deleteFilterPreset(presetId: string, userId: string): boolean {
    const preset = this.presets.get(presetId)
    if (!preset) return false

    // Only allow deletion by the creator or system
    if (preset.createdBy !== userId && preset.createdBy !== 'system') {
      return false
    }

    // Don't allow deletion of default presets
    if (preset.isDefault) return false

    this.presets.delete(presetId)
    this.savePresets()

    return true
  }

  public getPresetsByCategory(category: FilterPreset['category']): FilterPreset[] {
    return Array.from(this.presets.values())
      .filter(preset => preset.category === category)
      .sort((a, b) => b.usageCount - a.usageCount)
  }

  public getPresetsByTags(tags: string[]): FilterPreset[] {
    return Array.from(this.presets.values())
      .filter(preset => tags.some(tag => preset.tags.includes(tag)))
      .sort((a, b) => b.usageCount - a.usageCount)
  }

  public searchPresets(query: string): FilterPreset[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.presets.values())
      .filter(preset => 
        preset.name.toLowerCase().includes(lowerQuery) ||
        preset.description.toLowerCase().includes(lowerQuery) ||
        preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => b.usageCount - a.usageCount)
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  public destroy(): void {
    this.presets.clear()
    this.fieldMappings.clear()
    this.usageHistory.clear()
    this.aiSuggestions.clear()
    this.listeners.clear()
  }
}

// React hook for smart filters
export const useSmartFilters = () => {
  const service = SmartFilterService.getInstance()

  const createPreset = (name: string, description: string, filters: FilterConfig[], options?: any) => {
    return service.createPreset(name, description, filters, options)
  }

  const getPreset = (id: string) => {
    return service.getPreset(id)
  }

  const getAllPresets = (category?: FilterPreset['category']) => {
    return service.getAllPresets(category)
  }

  const getRecentPresets = (limit?: number) => {
    return service.getRecentPresets(limit)
  }

  const usePreset = (id: string) => {
    return service.usePreset(id)
  }

  const generateFieldMappingSuggestions = (sourceFields: string[], targetFields: string[], sampleData?: any[]) => {
    return service.generateFieldMappingSuggestions(sourceFields, targetFields, sampleData)
  }

  const applyOneClickMapping = (sourceData: any[], sourceField: string, targetField: string) => {
    return service.applyOneClickMapping(sourceData, sourceField, targetField)
  }

  const generateSmartDefaults = (context: any) => {
    return service.generateSmartDefaults(context)
  }

  const getFilterAnalytics = () => {
    return service.getFilterAnalytics()
  }

  return {
    createPreset,
    getPreset,
    getAllPresets,
    getRecentPresets,
    usePreset,
    generateFieldMappingSuggestions,
    applyOneClickMapping,
    generateSmartDefaults,
    getFilterAnalytics
  }
}

// Export singleton instance
export const smartFilterService = SmartFilterService.getInstance()
