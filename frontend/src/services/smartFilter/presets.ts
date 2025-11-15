// Filter Preset Management Module
import { FilterPreset, FilterConfig } from './types';
import { logger } from '../logger';
import storage from './storage';

export class PresetManager {
  private presets: Map<string, FilterPreset> = new Map();
  private usageHistory: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultPresets();
    this.loadPersistedData();
  }

  private initializeDefaultPresets(): void {
    // Recent items preset
    const recentPreset: FilterPreset = {
      id: 'recent_items',
      name: 'Recent Items',
      description: 'Show items from the last 7 days',
      category: 'smart',
      filters: [
        {
          field: 'created_at',
          operator: 'greater_than',
          value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          label: 'Created After',
          isRequired: true,
          weight: 1.0,
        },
      ],
      usageCount: 0,
      lastUsed: new Date(),
      createdBy: 'system',
      isPublic: true,
      tags: ['recent', 'time'],
      confidence: 0.95,
    };

    // High priority preset
    const highPriorityPreset: FilterPreset = {
      id: 'high_priority',
      name: 'High Priority Items',
      description: 'Show high priority reconciliation items',
      category: 'smart',
      filters: [
        {
          field: 'priority',
          operator: 'equals',
          value: 'high',
          label: 'Priority',
          isRequired: true,
          weight: 1.0,
        },
        {
          field: 'status',
          operator: 'in',
          value: ['pending', 'in_progress'],
          label: 'Status',
          isRequired: true,
          weight: 0.9,
        },
      ],
      usageCount: 0,
      lastUsed: new Date(),
      createdBy: 'system',
      isPublic: true,
      tags: ['priority', 'status'],
      confidence: 0.9,
    };

    this.presets.set(recentPreset.id, recentPreset);
    this.presets.set(highPriorityPreset.id, highPriorityPreset);
    this.persistPresets();
  }

  private loadPersistedData(): void {
    try {
      const stored = storage.getItem('smartFilterPresets');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data.presets || {}).forEach(([id, preset]) => {
          const recursivelyParseDates = (obj: unknown): unknown => {
            if (Array.isArray(obj)) {
              return obj.map(recursivelyParseDates);
            }
            if (obj !== null && typeof obj === 'object') {
              return Object.fromEntries(
                Object.entries(obj).map(([key, value]) => {
                  if (
                    typeof value === 'string' &&
                    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
                  ) {
                    return [key, new Date(value)];
                  }
                  return [key, recursivelyParseDates(value)];
                })
              );
            }
            return obj;
          };
          this.presets.set(id, recursivelyParseDates(preset));
        });
        this.usageHistory = new Map(Object.entries(data.usageHistory || {}));
      }
    } catch (error) {
      logger.error('Failed to load persisted filter presets:', error);
    }
  }

  private persistPresets(): void {
    try {
      const data = {
        presets: Object.fromEntries(this.presets),
        usageHistory: Object.fromEntries(this.usageHistory),
      };
      storage.setItem('smartFilterPresets', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to persist filter presets:', error);
    }
  }

  public createPreset(preset: Omit<FilterPreset, 'id' | 'usageCount' | 'lastUsed'>): FilterPreset {
    if (!preset.name || preset.name.trim() === '') {
      throw new Error('Preset name cannot be empty.');
    }
    if (!preset.filters || preset.filters.length === 0) {
      throw new Error('Preset must have at least one filter.');
    }

    const id = crypto.randomUUID();
    const newPreset: FilterPreset = {
      ...preset,
      id,
      usageCount: 0,
      lastUsed: new Date(),
    };
    this.presets.set(id, newPreset);
    this.persistPresets();
    return newPreset;
  }

  public updatePreset(id: string, updates: Partial<FilterPreset>): FilterPreset | undefined {
    if (updates.name !== undefined && (!updates.name || updates.name.trim() === '')) {
      throw new Error('Preset name cannot be empty.');
    }
    if (updates.filters !== undefined && updates.filters.length === 0) {
      throw new Error('Preset must have at least one filter.');
    }

    const preset = this.presets.get(id);
    if (!preset) return undefined;

    const updated = { ...preset, ...updates };
    this.presets.set(id, updated);
    this.persistPresets();
    return updated;
  }

  public deletePreset(id: string): boolean {
    const deleted = this.presets.delete(id);
    if (deleted) {
      this.usageHistory.delete(id);
      this.persistPresets();
    }
    return deleted;
  }

  public getPreset(id: string): FilterPreset | undefined {
    return this.presets.get(id);
  }

  public getAllPresets(category?: FilterPreset['category']): FilterPreset[] {
    const allPresets = Array.from(this.presets.values());
    if (category) {
      return allPresets.filter((p) => p.category === category);
    }
    return allPresets;
  }

  public getPresetsByTags(tags: string[]): FilterPreset[] {
    return Array.from(this.presets.values()).filter((preset) =>
      tags.some((tag) => preset.tags.includes(tag))
    );
  }

  public getRecentPresets(limit: number = 5): FilterPreset[] {
    return Array.from(this.presets.values())
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
      .slice(0, limit);
  }

  public getPopularPresets(limit: number = 5): FilterPreset[] {
    return Array.from(this.presets.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  public incrementUsage(presetId: string): void {
    const preset = this.presets.get(presetId);
    if (preset) {
      preset.usageCount++;
      preset.lastUsed = new Date();
      this.usageHistory.set(presetId, (this.usageHistory.get(presetId) || 0) + 1);
      this.persistPresets();
    }
  }

  public getUsageCount(presetId: string): number {
    return this.usageHistory.get(presetId) || 0;
  }

  public resetToDefaults(): void {
    this.presets.clear();
    this.usageHistory.clear();
    this.initializeDefaultPresets();
  }
}
