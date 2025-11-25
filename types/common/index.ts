// Common utility types and shared types

import { Metadata } from '../metadata';

export interface BaseMetadata {
  createdAt?: string | Date;
  updatedAt?: string | Date;
  version?: number;
  userId?: string;
  checksum?: string;
  [key: string]: unknown;
}

export interface DataSourceMetadata extends BaseMetadata {
  mimeType?: string;
  encoding?: string;
  delimiter?: string;
  hasHeaders?: boolean;
  rowCount?: number;
  columnCount?: number;
  fileSize?: number;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
export type EffortLevel = 'low' | 'medium' | 'high';

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };
export type DeepRequired<T> = { [P in keyof T]-?: DeepRequired<T[P]> };

// Common parameter types
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  field: string;
  operator: ComparisonOperator;
  value: any;
}

export interface SearchParams {
  query: string;
  fields: string[];
  fuzzy?: boolean;
  caseSensitive?: boolean;
}

export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'not_in';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// UI Component Types (shared across pages)
export interface PageConfig {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  path: string;
  showStats?: boolean;
  showFilters?: boolean;
  showActions?: boolean;
}

export interface StatsCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  progress?: number;
}

export interface ActionConfig {
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

// Re-export Metadata for convenience
export type { Metadata } from '../metadata';
