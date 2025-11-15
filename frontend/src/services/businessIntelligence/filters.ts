// Filter Application Module
import { ReportFilter } from './types';
import { Metadata } from '@/types/metadata';

export class FilterApplier {
  applyFilters(
    data: Array<Record<string, unknown>>,
    filters: ReportFilter[],
    parameters?: Metadata
  ): Array<Record<string, unknown>> {
    return data.filter((item) => {
      return filters.every((filter) => {
        const value = item[filter.field];
        const filterValue =
          filter.isDynamic && parameters ? parameters[filter.field] : filter.value;

        switch (filter.operator) {
          case 'equals':
            return value === filterValue;
          case 'not_equals':
            return value !== filterValue;
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'not_contains':
            return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'greater_than':
            return (value as number) > (filterValue as number);
          case 'less_than':
            return (value as number) < (filterValue as number);
          case 'between':
            return (
              Array.isArray(filterValue) &&
              (value as number) >= (filterValue[0] as number) &&
              (value as number) <= (filterValue[1] as number)
            );
          case 'in':
            return Array.isArray(filterValue) && filterValue.includes(value);
          case 'not_in':
            return Array.isArray(filterValue) && !filterValue.includes(value);
          default:
            return true;
        }
      });
    });
  }
}


