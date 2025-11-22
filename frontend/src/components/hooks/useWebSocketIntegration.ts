// WebSocket Integration Hook for Real-time Progress Tracking
import { logger } from '@/services/logger';
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../services/webSocketService';

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
<<<<<<< HEAD
  const { isConnected, sendMessage: wsSendMessage, lastMessage } = useWebSocket();
  const [progress, setProgress] = useState<ReconciliationProgress | null>(null);
  const [subscribedJobs, setSubscribedJobs] = useState<Set<string>>(new Set());
=======
  const { isConnected, sendMessage: wsSendMessage, on, off } = useWebSocket()
  const [progress, setProgress] = useState<ReconciliationProgress | null>(null)
  const [subscribedJobs, setSubscribedJobs] = useState<Set<string>>(new Set())
>>>>>>> 26355dbeb6c502c5e28667489dcec2dc481751c1

  // Handle incoming messages
  useEffect(() => {
    const handleMessage = (data: any) => {
      try {
<<<<<<< HEAD
        const data = JSON.parse(lastMessage.data);

=======
>>>>>>> 26355dbeb6c502c5e28667489dcec2dc481751c1
        switch (data.type) {
          case 'job_progress_update':
            if (subscribedJobs.has(data.job_id)) {
              setProgress({
                job_id: data.job_id,
                status: data.status,
                progress: data.progress,
                total_records: data.total_records,
                processed_records: data.processed_records,
                matched_records: data.matched_records,
                unmatched_records: data.unmatched_records,
                eta: data.eta,
                message: data.message,
              });
            }
            break;
          case 'job_completed':
            if (subscribedJobs.has(data.job_id)) {
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
          case 'job_failed':
            if (subscribedJobs.has(data.job_id)) {
              setProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      status: 'failed',
                      message: data.error || 'Job failed',
                    }
                  : null
              );
            }
            break;
        }
      } catch (error) {
        logger.error('Error parsing WebSocket message:', error);
      }
    }
<<<<<<< HEAD
  }, [lastMessage, subscribedJobs]);
=======

    // Register event listener
    on('message', handleMessage)
    
    // Cleanup
    return () => {
      off('message', handleMessage)
    }
  }, [on, off, subscribedJobs])
>>>>>>> 26355dbeb6c502c5e28667489dcec2dc481751c1

  const subscribeToJob = useCallback(
    (jobId: string) => {
      if (isConnected) {
        wsSendMessage({
          type: 'subscribe_job_progress',
          job_id: jobId,
        });
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
          job_id: jobId,
        });
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
