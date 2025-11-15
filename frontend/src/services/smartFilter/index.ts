// Main Smart Filter Service Orchestrator
import { FilterPreset, FieldMapping, AIMappingSuggestion, FilterConfig, SmartDefaults } from './types';
import { PresetManager } from './presets';
import { MappingManager } from './mappings';
import { FilterEngine } from './engine';
import { AISuggestionEngine } from './ai';
import { FilterCache } from './cache';
import { logger } from '../logger';

class SmartFilterService {
  private static instance: SmartFilterService;
  private presetManager: PresetManager;
  private mappingManager: MappingManager;
  private filterEngine: FilterEngine;
  private aiEngine: AISuggestionEngine;
  private cache: FilterCache;
  private listeners: Map<string, Array<(...args: unknown[]) => void>> = new Map();

  private constructor() {
    this.presetManager = new PresetManager();
    this.mappingManager = new MappingManager();
    this.filterEngine = new FilterEngine();
    this.aiEngine = new AISuggestionEngine();
    this.cache = new FilterCache();

    // Periodic cache cleanup
    setInterval(() => {
      this.cache.cleanup();
    }, 60000); // Every minute
  }

  public static getInstance(): SmartFilterService {
    if (!SmartFilterService.instance) {
      SmartFilterService.instance = new SmartFilterService();
    }
    return SmartFilterService.instance;
  }

  // Preset Management
  public createPreset(preset: Omit<FilterPreset, 'id' | 'usageCount' | 'lastUsed'>): FilterPreset {
    return this.presetManager.createPreset(preset);
  }

  public updatePreset(id: string, updates: Partial<FilterPreset>): FilterPreset | undefined {
    return this.presetManager.updatePreset(id, updates);
  }

  public deletePreset(id: string): boolean {
    return this.presetManager.deletePreset(id);
  }

  public getPreset(id: string): FilterPreset | undefined {
    return this.presetManager.getPreset(id);
  }

  public getAllPresets(category?: FilterPreset['category']): FilterPreset[] {
    return this.presetManager.getAllPresets(category);
  }

  public getPresetsByCategory(category: FilterPreset['category']): FilterPreset[] {
    return this.presetManager.getPresetsByCategory(category);
  }

  public getPresetsByTags(tags: string[]): FilterPreset[] {
    return this.presetManager.getPresetsByTags(tags);
  }

  // Mapping Management
  public createMapping(contextId: string, mapping: FieldMapping): FieldMapping {
    return this.mappingManager.createMapping(contextId, mapping);
  }

  public updateMapping(contextId: string, sourceField: string, updates: Partial<FieldMapping>): FieldMapping | undefined {
    return this.mappingManager.updateMapping(contextId, sourceField, updates);
  }

  public deleteMapping(contextId: string, sourceField: string): boolean {
    return this.mappingManager.deleteMapping(contextId, sourceField);
  }

  public getMapping(contextId: string, sourceField: string): FieldMapping | undefined {
    return this.mappingManager.getMapping(contextId, sourceField);
  }

  public getAllMappings(contextId: string): FieldMapping[] {
    return this.mappingManager.getAllMappings(contextId);
  }

  // Filter Execution
  public applyFilter<T extends Record<string, unknown>>(data: T[], filter: FilterConfig): T[] {
    return this.filterEngine.applyFilter(data, filter) as T[];
  }

  public applyFilters<T extends Record<string, unknown>>(data: T[], filters: FilterConfig[]): T[] {
    return this.filterEngine.applyFilters(data, filters) as T[];
  }

  public applyPreset<T extends Record<string, unknown>>(data: T[], preset: FilterPreset): T[] {
    this.presetManager.incrementUsage(preset.id);
    return this.filterEngine.applyPreset(data, preset) as T[];
  }

  // Validation
  public validateFilter(filter: FilterConfig): { valid: boolean; errors: string[] } {
    return this.filterEngine.validateFilter(filter);
  }

  public validatePreset(preset: FilterPreset): { valid: boolean; errors: string[] } {
    return this.filterEngine.validatePreset(preset);
  }

  // AI Suggestions
  public async suggestMapping(
    sourceFields: string[],
    targetFields: string[],
    context?: Record<string, unknown>
  ): Promise<AIMappingSuggestion> {
    return this.aiEngine.suggestMapping(sourceFields, targetFields, context);
  }

  public async suggestPreset(
    data: Array<Record<string, unknown>>,
    context?: Record<string, unknown>
  ): Promise<FilterPreset> {
    return this.aiEngine.suggestPreset(data, context);
  }

  // AISuggestion Management
  public addAISuggestion(contextId: string, suggestion: AIMappingSuggestion): void {
    this.mappingManager.addAISuggestion(contextId, suggestion);
  }

  public getAISuggestions(contextId: string): AIMappingSuggestion[] {
    return this.mappingManager.getAISuggestions(contextId);
  }

  public clearAISuggestions(contextId: string): void {
    this.mappingManager.clearAISuggestions(contextId);
  }

  // Event System
  public on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  // Cache Management
  public getCache(): FilterCache {
    return this.cache;
  }

  public destroy(): void {
    this.cache.clear();
    this.listeners.clear();
  }
}

export const smartFilterService = SmartFilterService.getInstance();
export default smartFilterService;
export * from './types';

