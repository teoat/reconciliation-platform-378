/**
 * Metadata Types
 * This file provides type-safe alternatives to Record<string, unknown>
 */

/**
 * Base metadata value type - union of all allowed metadata value types
 */
export type MetadataValue = string | number | boolean | null | undefined | Metadata | MetadataValue[];

/**
 * Metadata object - key-value pairs where values are MetadataValue
 */
export interface Metadata {
  [key: string]: MetadataValue;
}

/**
 * Reconciliation-specific metadata
 */
export interface ReconciliationMetadata {
  matchId?: string;
  matchType?: string;
  confidence?: number;
  timestamp?: string;
  sourceId?: string;
  targetId?: string;
  [key: string]: MetadataValue;
}
