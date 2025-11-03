// WebSocket Integration Hook for Real-time Progress Tracking
import { logger } from '@/services/logger'
import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '../../services/webSocketService'

interface ReconciliationProgress {
  job_id: string
  status: string
  progress: number
  total_records?: number
  processed_records: number
  matched_records: number
  unmatched_records: number
  eta?: number
  message?: string
}

interface UseWebSocketIntegrationReturn {
  isConnected: boolean
  progress: ReconciliationProgress | null
  subscribeToJob: (jobId: string) => void
  unsubscribeFromJob: (jobId: string) => void
  sendMessage: (message: { type: string; [key: string]: unknown }) => void
}

export const useWebSocketIntegration = (): UseWebSocketIntegrationReturn => {
  const { isConnected, sendMessage: wsSendMessage, lastMessage } = useWebSocket()
  const [progress, setProgress] = useState<ReconciliationProgress | null>(null)
  const [subscribedJobs, setSubscribedJobs] = useState<Set<string>>(new Set())

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data)
        
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
              })
            }
            break
          case 'job_completed':
            if (subscribedJobs.has(data.job_id)) {
              setProgress(prev => prev ? {
                ...prev,
                status: 'completed',
                progress: 100,
                message: 'Job completed successfully'
              } : null)
            }
            break
          case 'job_failed':
            if (subscribedJobs.has(data.job_id)) {
              setProgress(prev => prev ? {
                ...prev,
                status: 'failed',
                message: data.error || 'Job failed'
              } : null)
            }
            break
        }
      } catch (error) {
        logger.error('Error parsing WebSocket message:', error)
      }
    }
  }, [lastMessage, subscribedJobs])

  const subscribeToJob = useCallback((jobId: string) => {
    if (isConnected) {
      wsSendMessage({
        type: 'subscribe_job_progress',
        job_id: jobId
      })
      setSubscribedJobs(prev => new Set([...prev, jobId]))
    }
  }, [isConnected, wsSendMessage])

  const unsubscribeFromJob = useCallback((jobId: string) => {
    if (isConnected) {
      wsSendMessage({
        type: 'unsubscribe_job_progress',
        job_id: jobId
      })
      setSubscribedJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }, [isConnected, wsSendMessage])

  const sendMessage = useCallback((message: { type: string; [key: string]: unknown }) => {
    if (isConnected) {
      wsSendMessage(message)
    }
  }, [isConnected, wsSendMessage])

  return {
    isConnected,
    progress,
    subscribeToJob,
    unsubscribeFromJob,
    sendMessage
  }
}
