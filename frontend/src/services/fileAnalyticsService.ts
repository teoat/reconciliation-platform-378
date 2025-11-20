// File Processing Analytics Service
import { logger } from '@/services/logger';
// High-value enhancement combining File Service + Analytics Service

import { apiClient } from './apiClient';

interface FileProcessingMetrics {
  fileId: string;
  fileName: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  bytesUploaded: number;
  totalBytes: number;
  processingStartTime?: Date;
  processingEndTime?: Date;
  recordsProcessed: number;
  recordsTotal: number;
  errors: string[];
}

interface AnalyticsEvent {
  eventType:
    | 'file_upload_start'
    | 'file_upload_progress'
    | 'file_processing_complete'
    | 'file_error';
  timestamp: Date;
  fileId: string;
  metadata: Record<string, unknown>;
}

/**
 * File Processing Analytics Service
 *
 * Combines file processing with real-time analytics
 * Provides operational visibility and metrics tracking
 */
export class FileProcessingAnalyticsService {
  private metrics: Map<string, FileProcessingMetrics> = new Map();
  private events: AnalyticsEvent[] = [];
  private listeners: Set<(metrics: FileProcessingMetrics) => void> = new Set();

  /**
   * Track file upload with real-time metrics
   */
  async trackFileUpload(file: File, projectId: string): Promise<string> {
    const fileId = crypto.randomUUID();

    // Initialize metrics
    this.metrics.set(fileId, {
      fileId,
      fileName: file.name,
      status: 'uploading',
      bytesUploaded: 0,
      totalBytes: file.size,
      recordsProcessed: 0,
      recordsTotal: 0,
      errors: [],
    });

    // Emit analytics event
    this.emitEvent({
      eventType: 'file_upload_start',
      timestamp: new Date(),
      fileId,
      metadata: { fileName: file.name, fileSize: file.size, projectId },
    });

    try {
      // Upload file with progress tracking
      const result = await apiClient.uploadDataSource(
        file,
        projectId,
        file.name,
        'reconciliation_data'
      );

      if (result.success) {
        // Update metrics
        const metrics = this.metrics.get(fileId);
        if (metrics) {
          metrics.status = 'processing';
          metrics.processingStartTime = new Date();
          this.metrics.set(fileId, metrics);
          this.notifyListeners(metrics);
        }

        return result.data.id;
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      const metrics = this.metrics.get(fileId);
      if (metrics) {
        metrics.status = 'failed';
        metrics.errors.push(error instanceof Error ? error.message : 'Unknown error');
        this.metrics.set(fileId, metrics);
        this.notifyListeners(metrics);
      }
      throw error;
    }
  }

  /**
   * Track file processing progress
   */
  updateProcessingProgress(fileId: string, recordsProcessed: number, recordsTotal: number) {
    const metrics = this.metrics.get(fileId);
    if (metrics) {
      metrics.recordsProcessed = recordsProcessed;
      metrics.recordsTotal = recordsTotal;
      this.metrics.set(fileId, metrics);
      this.notifyListeners(metrics);
    }
  }

  /**
   * Mark file processing as complete
   */
  markProcessingComplete(fileId: string) {
    const metrics = this.metrics.get(fileId);
    if (metrics) {
      metrics.status = 'completed';
      metrics.processingEndTime = new Date();
      this.metrics.set(fileId, metrics);

      // Emit analytics event
      this.emitEvent({
        eventType: 'file_processing_complete',
        timestamp: new Date(),
        fileId,
        metadata: {
          recordsProcessed: metrics.recordsProcessed,
          duration: metrics.processingEndTime.getTime() - metrics.processingStartTime!.getTime(),
        },
      });

      this.notifyListeners(metrics);
    }
  }

  /**
   * Get file processing metrics
   */
  getMetrics(fileId: string): FileProcessingMetrics | undefined {
    return this.metrics.get(fileId);
  }

  /**
   * Get all active file processing metrics
   */
  getAllMetrics(): FileProcessingMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get analytics events
   */
  getEvents(fileId?: string): AnalyticsEvent[] {
    if (fileId) {
      return this.events.filter((e) => e.fileId === fileId);
    }
    return this.events;
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback: (metrics: FileProcessingMetrics) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emitEvent(event: AnalyticsEvent) {
    this.events.push(event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }

  private notifyListeners(metrics: FileProcessingMetrics) {
    this.listeners.forEach((listener) => {
      try {
        listener(metrics);
      } catch (error) {
        logger.error('Error notifying listener:', error);
      }
    });
  }
}

// Export singleton instance
export const fileAnalyticsService = new FileProcessingAnalyticsService();
