/**
 * Metadata Types - Replace Record<string, unknown> with proper types
 * This file provides type-safe alternatives to Record<string, unknown>
 */

/**
 * Base metadata value type - union of all allowed metadata value types
 */
export type MetadataValue = 
  | string 
  | number 
  | boolean 
  | null 
  | Metadata 
  | MetadataValue[];

/**
 * Metadata object - key-value pairs where values are MetadataValue
 */
export interface Metadata {
  [key: string]: MetadataValue;
}

/**
 * Project-specific metadata
 */
export interface ProjectMetadata {
  projectName?: string;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  tags?: string[];
  category?: string;
  status?: string;
  [key: string]: MetadataValue | undefined;
}

/**
 * File-specific metadata
 */
export interface FileMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  fileHash?: string;
  version?: string;
  [key: string]: MetadataValue | undefined;
}

/**
 * Reconciliation-specific metadata
 */
export interface ReconciliationMetadata {
  status?: string;
  startedAt?: string;
  completedAt?: string;
  recordCount?: number;
  matchCount?: number;
  mismatchCount?: number;
  userId?: string;
  projectId?: string;
  [key: string]: MetadataValue | undefined;
}

/**
 * User-specific metadata
 */
export interface UserMetadata {
  preferences?: {
    theme?: string;
    language?: string;
    timezone?: string;
    [key: string]: MetadataValue | undefined;
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    [key: string]: MetadataValue | undefined;
  };
  [key: string]: MetadataValue | undefined;
}

/**
 * Type guard to check if value is valid metadata
 */
export function isValidMetadata(value: unknown): value is Metadata {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  
  for (const [key, val] of Object.entries(value)) {
    if (typeof key !== 'string') {
      return false;
    }
    
    if (!isValidMetadataValue(val)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Type guard to check if value is valid metadata value
 */
function isValidMetadataValue(value: unknown): value is MetadataValue {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(item => isValidMetadataValue(item));
  }
  if (typeof value === 'object') {
    return isValidMetadata(value);
  }
  return false;
}

/**
 * Safely extract metadata value with default
 */
export function getMetadataValue<T extends MetadataValue>(
  metadata: Metadata,
  key: string,
  defaultValue: T
): T {
  const value = metadata[key];
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return value as T;
}

/**
 * Safely set metadata value
 */
export function setMetadataValue(
  metadata: Metadata,
  key: string,
  value: MetadataValue
): Metadata {
  return {
    ...metadata,
    [key]: value,
  };
}

