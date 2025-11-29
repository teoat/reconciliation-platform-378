// Column type inference utilities
import type { DataRow, ColumnInfo } from '@/types/ingestion/index';

/**
 * Infers column types from data
 */
export const inferColumnTypes = (data: DataRow[]): ColumnInfo[] => {
  if (!data.length) return [];

  const columns = Object.keys(data[0]);

  return columns.map((columnName) => {
    const values = data
      .map((row) => row[columnName])
      .filter((val) => val !== null && val !== undefined);
    const sampleValues = values.slice(0, 5);

    let type: ColumnInfo['type'] = 'string';
    let statistics: ColumnInfo['statistics'] = {
      count: values.length,
      nullCount: data.length - values.length,
    };

    // Type inference logic
    if (values.every((val) => !isNaN(Number(val)) && val !== '')) {
      type = 'number';
      const nums = values.map(Number);
      statistics = {
        ...statistics,
        min: Math.min(...nums),
        max: Math.max(...nums),
        avg: nums.reduce((a, b) => a + b, 0) / nums.length,
      };
    } else if (values.every((val) => typeof val === 'string' && !isNaN(Date.parse(val)))) {
      type = 'date';
    } else if (
      columnName.toLowerCase().includes('amount') ||
      columnName.toLowerCase().includes('price')
    ) {
      type = 'currency';
    } else if (
      values.every((val) => typeof val === 'boolean' || val === 'true' || val === 'false')
    ) {
      type = 'boolean';
    }

    return {
      name: columnName,
      type,
      nullable: statistics.nullCount > 0,
      unique: new Set(values).size === values.length,
      sampleValues,
      statistics,
    };
  });
};

/**
 * Detects if a column is likely an ID field
 */
export const isIdColumn = (columnName: string): boolean => {
  const lower = columnName.toLowerCase();
  return lower.includes('id') || lower === 'id' || lower.endsWith('_id');
};

/**
 * Detects if a column is likely a date field
 */
export const isDateColumn = (columnName: string): boolean => {
  const lower = columnName.toLowerCase();
  return lower.includes('date') || lower.includes('time') || lower.includes('created') || lower.includes('updated');
};

/**
 * Detects if a column is likely a numeric field
 */
export const isNumericColumn = (columnName: string): boolean => {
  const lower = columnName.toLowerCase();
  return lower.includes('amount') || lower.includes('price') || lower.includes('cost') || lower.includes('total') || lower.includes('quantity');
};
