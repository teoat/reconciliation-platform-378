// Field Mapping Management Module
import { FieldMapping, AIMappingSuggestion } from './types';
import { logger } from '../logger';
import storage from './storage';

export class MappingManager {
  private fieldMappings: Map<string, FieldMapping[]> = new Map();
  private aiSuggestions: Map<string, AIMappingSuggestion[]> = new Map();

  constructor() {
    this.loadPersistedMappings();
  }

  private loadPersistedMappings(): void {
    try {
      const stored = storage.getItem('smartFilterMappings');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data.mappings || {}).forEach(([key, mappings]) => {
          this.fieldMappings.set(key, mappings as FieldMapping[]);
        });
        Object.entries(data.suggestions || {}).forEach(([key, suggestions]) => {
          this.aiSuggestions.set(key, suggestions as AIMappingSuggestion[]);
        });
      }
    } catch (error) {
      logger.error('Failed to load persisted field mappings:', error);
    }
  }

  private persistMappings(): void {
    try {
      const data = {
        mappings: Object.fromEntries(this.fieldMappings),
        suggestions: Object.fromEntries(this.aiSuggestions),
      };
      storage.setItem('smartFilterMappings', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to persist field mappings:', error);
    }
  }

  public createMapping(contextId: string, mapping: FieldMapping): FieldMapping {
    const mappings = this.fieldMappings.get(contextId) || [];
    mappings.push(mapping);
    this.fieldMappings.set(contextId, mappings);
    this.persistMappings();
    return mapping;
  }

  public updateMapping(
    contextId: string,
    sourceField: string,
    updates: Partial<FieldMapping>
  ): FieldMapping | undefined {
    const mappings = this.fieldMappings.get(contextId);
    if (!mappings) return undefined;

    const index = mappings.findIndex((m) => m.sourceField === sourceField);
    if (index === -1) return undefined;

    const updated = { ...mappings[index], ...updates };
    mappings[index] = updated;
    this.fieldMappings.set(contextId, mappings);
    this.persistMappings();
    return updated;
  }

  public deleteMapping(contextId: string, sourceField: string): boolean {
    const mappings = this.fieldMappings.get(contextId);
    if (!mappings) return false;

    const index = mappings.findIndex((m) => m.sourceField === sourceField);
    if (index === -1) return false;

    mappings.splice(index, 1);
    if (mappings.length === 0) {
      this.fieldMappings.delete(contextId);
    } else {
      this.fieldMappings.set(contextId, mappings);
    }
    this.persistMappings();
    return true;
  }

  public getMapping(contextId: string, sourceField: string): FieldMapping | undefined {
    const mappings = this.fieldMappings.get(contextId);
    return mappings?.find((m) => m.sourceField === sourceField);
  }

  public getAllMappings(contextId: string): FieldMapping[] {
    return this.fieldMappings.get(contextId) || [];
  }

  public addAISuggestion(contextId: string, suggestion: AIMappingSuggestion): void {
    const suggestions = this.aiSuggestions.get(contextId) || [];
    suggestions.push(suggestion);
    this.aiSuggestions.set(contextId, suggestions);
    this.persistMappings();
  }

  public getAISuggestions(contextId: string): AIMappingSuggestion[] {
    return this.aiSuggestions.get(contextId) || [];
  }

  public clearAISuggestions(contextId: string): void {
    this.aiSuggestions.delete(contextId);
    this.persistMappings();
  }
}
