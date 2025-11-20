// Filter Execution Engine Module
import { FilterConfig, FilterPreset } from './types';

export class FilterEngine {
  public applyFilter(
    data: Array<Record<string, unknown>>,
    filter: FilterConfig
  ): Array<Record<string, unknown>> {
    return data.filter((item) => this.evaluateFilter(item, filter));
  }

  public applyFilters(
    data: Array<Record<string, unknown>>,
    filters: FilterConfig[]
  ): Array<Record<string, unknown>> {
    let result = data;
    for (const filter of filters) {
      result = this.applyFilter(result, filter);
    }
    return result;
  }

  public applyPreset(
    data: Array<Record<string, unknown>>,
    preset: FilterPreset
  ): Array<Record<string, unknown>> {
    return this.applyFilters(data, preset.filters);
  }

  private evaluateFilter(item: Record<string, unknown>, filter: FilterConfig): boolean {
    const fieldValue = item[filter.field];
    if (fieldValue === undefined && filter.isRequired) {
      return false;
    }

    switch (filter.operator) {
      case 'equals':
        return fieldValue === filter.value;
      case 'contains':
        return String(fieldValue).includes(String(filter.value));
      case 'starts_with':
        return String(fieldValue).startsWith(String(filter.value));
      case 'ends_with':
        return String(fieldValue).endsWith(String(filter.value));
      case 'greater_than':
        return Number(fieldValue) > Number(filter.value);
      case 'less_than':
        return Number(fieldValue) < Number(filter.value);
      case 'between':
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          const [min, max] = filter.value as [number, number];
          return Number(fieldValue) >= min && Number(fieldValue) <= max;
        }
        return false;
      case 'in':
        if (Array.isArray(filter.value)) {
          return filter.value.includes(fieldValue);
        }
        return false;
      case 'not_in':
        if (Array.isArray(filter.value)) {
          return !filter.value.includes(fieldValue);
        }
        return false;
      default:
        return false;
    }
  }

  public validateFilter(filter: FilterConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!filter.field) {
      errors.push('Field is required');
    }

    if (filter.value === undefined && filter.isRequired) {
      errors.push('Value is required');
    }

    if (
      filter.operator === 'between' &&
      (!Array.isArray(filter.value) || filter.value.length !== 2)
    ) {
      errors.push('Between operator requires an array of two values');
    }

    if (
      (filter.operator === 'in' || filter.operator === 'not_in') &&
      !Array.isArray(filter.value)
    ) {
      errors.push(`${filter.operator} operator requires an array value`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public validatePreset(preset: FilterPreset): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!preset.name) {
      errors.push('Preset name is required');
    }

    if (!preset.filters || preset.filters.length === 0) {
      errors.push('Preset must have at least one filter');
    }

    for (const filter of preset.filters) {
      const validation = this.validateFilter(filter);
      if (!validation.valid) {
        errors.push(...validation.errors.map((e) => `Filter ${filter.field}: ${e}`));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
