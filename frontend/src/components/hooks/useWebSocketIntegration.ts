// WebSocket Integration Hook for Real-time Progress Tracking
import { logger } from '@/services/logger';
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/services/websocket/hooks/useWebSocket';

interface ReconciliationProgress {
  job_id: string;
  status: string;
  progress: number;
  total_records?: number;
  processed_records: number;
  matched_records: number;
  unmatched_records: number;
  eta?: number;
  message?: string;
}

interface UseWebSocketIntegrationReturn {
  isConnected: boolean;
  progress: ReconciliationProgress | null;
  subscribeToJob: (jobId: string) => void;
  unsubscribeFromJob: (jobId: string) => void;
  sendMessage: (message: { type: string; [key: string]: unknown }) => void;
}

export const useWebSocketIntegration = (): UseWebSocketIntegrationReturn => {
const { isConnected, sendMessage: wsSendMessage, on, off } = useWebSocket()
  const [progress, setProgress] = useState<ReconciliationProgress | null>(null)
  const [subscribedJobs, setSubscribedJobs] = useState<Set<string>>(new Set())

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (data: unknown) => {
      try {
        const message = data as Record<string, unknown>;
        const messageType = String(message.type || '');

        switch (messageType) {
          case 'job_progress_update': {
            const jobId = String(message.job_id || '');
            if (subscribedJobs.has(jobId)) {
              setProgress({
                job_id: jobId,
                status: String(message.status || ''),
                progress: Number(message.progress || 0),
                total_records: message.total_records ? Number(message.total_records) : undefined,
                processed_records: Number(message.processed_records || 0),
                matched_records: Number(message.matched_records || 0),
                unmatched_records: Number(message.unmatched_records || 0),
                eta: message.eta ? Number(message.eta) : undefined,
                message: message.message ? String(message.message) : undefined,
              });
            }
            break;
          }
          case 'job_completed': {
            const jobId = String(message.job_id || '');
            if (subscribedJobs.has(jobId)) {
              setProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      status: 'completed',
                      progress: 100,
                      message: 'Job completed successfully',
                    }
                  : null
              );
            }
            break;
          }
          case 'job_failed': {
            const jobId = String(message.job_id || '');
            if (subscribedJobs.has(jobId)) {
              setProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      status: 'failed',
                      message: message.error ? String(message.error) : 'Job failed',
                    }
                  : null
              );
            }
            break;
          }
        }
      } catch (error) {
        logger.error('Error parsing WebSocket message:', { error: error instanceof Error ? error.message : String(error) });
      }
    }
// Register event listener
    on('message', handleMessage)
    
    // Cleanup
    return () => {
      off('message', handleMessage)
    }
  }, [on, off, subscribedJobs])

  const subscribeToJob = useCallback(
    (jobId: string) => {
      if (isConnected) {
        wsSendMessage({
          type: 'subscribe_job_progress',
          data: { job_id: jobId },
        } as Partial<import('@/services/websocket/types').WebSocketMessage>);
        setSubscribedJobs((prev) => new Set([...prev, jobId]));
      }
    },
    [isConnected, wsSendMessage]
  );

  const unsubscribeFromJob = useCallback(
    (jobId: string) => {
      if (isConnected) {
        wsSendMessage({
          type: 'unsubscribe_job_progress',
          data: { job_id: jobId },
        } as Partial<import('@/services/websocket/types').WebSocketMessage>);
        setSubscribedJobs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }
    },
    [isConnected, wsSendMessage]
  );

  const sendMessage = useCallback(
    (message: { type: string; [key: string]: unknown }) => {
      if (isConnected) {
        wsSendMessage(message);
      }
    },
    [isConnected, wsSendMessage]
  );

  return {
    isConnected,
    progress,
    subscribeToJob,
    unsubscribeFromJob,
    sendMessage,
  };
};
