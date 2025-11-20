// ============================================================================
// FILE TYPES
// ============================================================================

import type { ID, Timestamp } from './backend-aligned';

export interface FileUpload {
  id: ID;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  url?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  uploadedAt?: Timestamp;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Timestamp;
  path: string;
}
