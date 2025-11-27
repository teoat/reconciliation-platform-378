/**
 * Cashflow Filters Hook
 * 
 * Handles filtering logic for expense categories
 */

import { useMemo } from 'react';
import type { ExpenseCategory, FilterConfig } from '../types';

interface UseCashflowFiltersProps {
  expenseCategories: ExpenseCategory[];
  searchTerm: string;
  filters: FilterConfig[];
}

export const useCashflowFilters = ({
  expenseCategories,
  searchTerm,
  filters,
}: UseCashflowFiltersProps) => {
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const filteredCategories = useMemo(() => {
    let filtered = expenseCategories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        category =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.subcategories.some(sub =>
            sub.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply active filters
    filters.forEach(filter => {
      if (!filter.active) return;

      filtered = filtered.filter(category => {
        const value = getNestedValue(category, filter.field);
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greaterThan':
            return Number(value) > Number(filter.value);
          case 'lessThan':
            return Number(value) < Number(filter.value);
          case 'between':
            return (
              Number(value) >= Number(filter.value) &&
              Number(value) <= Number(filter.value2)
            );
          default:
            return true;
        }
      });
    });

    return filtered;
  }, [expenseCategories, searchTerm, filters]);

  return {
    filteredCategories,
    getNestedValue,
  };
};

