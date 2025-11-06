import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocketContext } from '../services/WebSocketProvider'
import { useAppSelector, useAppDispatch } from '../store/store'
// import { addNotification, updateNotification } from '../store/slices/notificationSlice'
// import { updateReconciliationJob } from '../store/slices/reconciliationSlice'
// import { updateProject } from '../store/slices/projectSlice'

// Stub no-op functions until the slices are implemented
const addNotification = (_payload: any) => {}
const updateNotification = (_payload: any) => {}
const updateReconciliationJob = (_payload: any) => {}
const updateProject = (_payload: any) => {}

// WebSocket integration hook for real-time updates
export const useWebSocketIntegration = () => {
  const { isConnected, subscribe, unsubscribe, emit } = useWebSocketContext()
  const dispatch = useAppDispatch()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected')
  const [lastMessage, setLastMessage] = useState<any>(null)
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const subscriptions = useRef<Map<string, string>>(new Map())

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!isConnected()) return

    // Subscribe to reconciliation job updates
    const reconciliationSubId = subscribe('reconciliation:progress', (data: any) => {
      console.log('Reconciliation progress update:', data)
      dispatch(updateReconciliationJob({
        id: data.jobId,
        updates: {
          progress: data.progress,
          status: data.status,
          processedRecords: data.processedRecords,
          matchedRecords: data.matchedRecords
        }
      }))
      
      // Show progress notification
      dispatch(addNotification({
        id: `reconciliation-${data.jobId}`,
        type: 'info',
        title: 'Reconciliation Progress',
        message: `Job ${data.jobId} is ${data.progress}% complete`,
        timestamp: new Date().toISOString()
      }))
    })
    subscriptions.current.set('reconciliation:progress', reconciliationSubId)

    // Subscribe to reconciliation job completion
    const completionSubId = subscribe('reconciliation:completed', (data: any) => {
      console.log('Reconciliation completed:', data)
      dispatch(updateReconciliationJob({
        id: data.jobId,
        updates: {
          status: 'completed',
          completedAt: data.completedAt,
          results: data.results
        }
      }))
      
      // Show completion notification
      dispatch(addNotification({
        id: `reconciliation-completed-${data.jobId}`,
        type: 'success',
        title: 'Reconciliation Completed',
        message: `Job ${data.jobId} has been completed successfully`,
        timestamp: new Date().toISOString()
      }))
    })
    subscriptions.current.set('reconciliation:completed', completionSubId)

    // Subscribe to reconciliation job errors
    const errorSubId = subscribe('reconciliation:error', (data: any) => {
      console.error('Reconciliation error:', data)
      dispatch(updateReconciliationJob({
        id: data.jobId,
        updates: {
          status: 'failed',
          error: data.error
        }
      }))
      
      // Show error notification
      dispatch(addNotification({
        id: `reconciliation-error-${data.jobId}`,
        type: 'error',
        title: 'Reconciliation Error',
        message: `Job ${data.jobId} failed: ${data.error}`,
        timestamp: new Date().toISOString()
      }))
    })
    subscriptions.current.set('reconciliation:error', errorSubId)

    // Subscribe to user presence updates
    const presenceSubId = subscribe('user:presence', (data: any) => {
      console.log('User presence update:', data)
      setActiveUsers(prev => {
        const updated = prev.filter(user => user.userId !== data.userId)
        if (data.isOnline) {
          updated.push(data)
        }
        return updated
      })
    })
    subscriptions.current.set('user:presence', presenceSubId)

    // Subscribe to project updates
    const projectSubId = subscribe('project:updated', (data: any) => {
      console.log('Project update:', data)
      dispatch(updateProject({
        id: data.projectId,
        updates: data.updates
      }))
    })
    subscriptions.current.set('project:updated', projectSubId)

    // Subscribe to notifications
    const notificationSubId = subscribe('notification:new', (data: any) => {
      console.log('New notification:', data)
      dispatch(addNotification({
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: data.timestamp
      }))
    })
    subscriptions.current.set('notification:new', notificationSubId)

    // Subscribe to system alerts
    const alertSubId = subscribe('system:alert', (data: any) => {
      console.log('System alert:', data)
      dispatch(addNotification({
        id: `system-alert-${Date.now()}`,
        type: 'warning',
        title: 'System Alert',
        message: data.message,
        timestamp: new Date().toISOString()
      }))
    })
    subscriptions.current.set('system:alert', alertSubId)

    // Subscribe to connection status changes
    const statusSubId = subscribe('connection:status', (data: any) => {
      setConnectionStatus(data.status)
    })
    subscriptions.current.set('connection:status', statusSubId)

    return () => {
      // Cleanup subscriptions
      subscriptions.current.forEach((subId, event) => {
        unsubscribe(event, subId)
      })
      subscriptions.current.clear()
    }
  }, [isConnected, subscribe, unsubscribe, dispatch])

  // Send reconciliation job start command
  const startReconciliationJob = useCallback((jobId: string, projectId: string) => {
    emit('reconciliation:start', {
      jobId,
      projectId,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send reconciliation job stop command
  const stopReconciliationJob = useCallback((jobId: string) => {
    emit('reconciliation:stop', {
      jobId,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Update user presence
  const updateUserPresence = useCallback((status: 'online' | 'away' | 'busy' | 'offline', currentPage?: string, currentProject?: string) => {
    emit('user:presence', {
      status,
      currentPage,
      currentProject,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Join project room for collaboration
  const joinProjectRoom = useCallback((projectId: string) => {
    emit('project:join', {
      projectId,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Leave project room
  const leaveProjectRoom = useCallback((projectId: string) => {
    emit('project:leave', {
      projectId,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send collaboration update
  const sendCollaborationUpdate = useCallback((projectId: string, fieldId: string, value: any) => {
    emit('collaboration:update', {
      projectId,
      fieldId,
      value,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send cursor position update
  const updateCursorPosition = useCallback((projectId: string, x: number, y: number) => {
    emit('collaboration:cursor', {
      projectId,
      x,
      y,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send selection update
  const updateSelection = useCallback((projectId: string, start: number, end: number) => {
    emit('collaboration:selection', {
      projectId,
      start,
      end,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send comment
  const sendComment = useCallback((projectId: string, message: string, targetId?: string) => {
    emit('collaboration:comment', {
      projectId,
      message,
      targetId,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send file upload progress
  const sendFileUploadProgress = useCallback((fileId: string, progress: number, status: string) => {
    emit('file:upload:progress', {
      fileId,
      progress,
      status,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send file processing update
  const sendFileProcessingUpdate = useCallback((fileId: string, status: string, result?: any) => {
    emit('file:processing:update', {
      fileId,
      status,
      result,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send analytics update
  const sendAnalyticsUpdate = useCallback((metric: string, value: any, metadata?: any) => {
    emit('analytics:update', {
      metric,
      value,
      metadata,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send error report
  const sendErrorReport = useCallback((error: any, context?: any) => {
    emit('error:report', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send performance metrics
  const sendPerformanceMetrics = useCallback((metrics: any) => {
    emit('performance:metrics', {
      metrics,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send user activity
  const sendUserActivity = useCallback((action: string, resource: string, resourceId?: string, metadata?: any) => {
    emit('user:activity', {
      action,
      resource,
      resourceId,
      metadata,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send heartbeat
  const sendHeartbeat = useCallback(() => {
    emit('heartbeat', {
      timestamp: new Date().toISOString()
    })
  }, [emit])

  // Send custom event
  const sendCustomEvent = useCallback((event: string, data: any) => {
    emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    })
  }, [emit])

  return {
    connectionStatus,
    lastMessage,
    activeUsers,
    isConnected: isConnected(),
    startReconciliationJob,
    stopReconciliationJob,
    updateUserPresence,
    joinProjectRoom,
    leaveProjectRoom,
    sendCollaborationUpdate,
    updateCursorPosition,
    updateSelection,
    sendComment,
    sendFileUploadProgress,
    sendFileProcessingUpdate,
    sendAnalyticsUpdate,
    sendErrorReport,
    sendPerformanceMetrics,
    sendUserActivity,
    sendHeartbeat,
    sendCustomEvent
  }
}

// Hook for real-time reconciliation updates
export const useRealtimeReconciliation = (jobId?: string) => {
  const { subscribe, unsubscribe } = useWebSocketContext()
  const [jobStatus, setJobStatus] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return

    const progressSubId = subscribe('reconciliation:progress', (data: any) => {
      if (data.jobId === jobId) {
        setProgress(data.progress)
        setIsRunning(data.status === 'running')
        setJobStatus(data)
      }
    })

    const completionSubId = subscribe('reconciliation:completed', (data: any) => {
      if (data.jobId === jobId) {
        setIsRunning(false)
        setJobStatus(data)
      }
    })

    const errorSubId = subscribe('reconciliation:error', (data: any) => {
      if (data.jobId === jobId) {
        setIsRunning(false)
        setError(data.error)
      }
    })

    return () => {
      unsubscribe('reconciliation:progress', progressSubId)
      unsubscribe('reconciliation:completed', completionSubId)
      unsubscribe('reconciliation:error', errorSubId)
    }
  }, [jobId, subscribe, unsubscribe])

  return {
    jobStatus,
    progress,
    isRunning,
    error
  }
}

// Hook for real-time collaboration
export const useRealtimeCollaboration = (projectId?: string) => {
  const { subscribe, unsubscribe, emit } = useWebSocketContext()
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [cursors, setCursors] = useState<Map<string, any>>(new Map())
  const [selections, setSelections] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    if (!projectId) return

    const collaboratorsSubId = subscribe('collaboration:users', (data: any) => {
      if (data.projectId === projectId) {
        setCollaborators(data.users)
      }
    })

    const commentsSubId = subscribe('collaboration:comment', (data: any) => {
      if (data.projectId === projectId) {
        setComments(prev => [...prev, data])
      }
    })

    const cursorSubId = subscribe('collaboration:cursor', (data: any) => {
      if (data.projectId === projectId) {
        setCursors(prev => {
          const newCursors = new Map(prev)
          newCursors.set(data.userId, data)
          return newCursors
        })
      }
    })

    const selectionSubId = subscribe('collaboration:selection', (data: any) => {
      if (data.projectId === projectId) {
        setSelections(prev => {
          const newSelections = new Map(prev)
          newSelections.set(data.userId, data)
          return newSelections
        })
      }
    })

    return () => {
      unsubscribe('collaboration:users', collaboratorsSubId)
      unsubscribe('collaboration:comment', commentsSubId)
      unsubscribe('collaboration:cursor', cursorSubId)
      unsubscribe('collaboration:selection', selectionSubId)
    }
  }, [projectId, subscribe, unsubscribe])

  const sendComment = useCallback((message: string, targetId?: string) => {
    emit('collaboration:comment', {
      projectId,
      message,
      targetId,
      timestamp: new Date().toISOString()
    })
  }, [emit, projectId])

  const updateCursor = useCallback((x: number, y: number) => {
    emit('collaboration:cursor', {
      projectId,
      x,
      y,
      timestamp: new Date().toISOString()
    })
  }, [emit, projectId])

  const updateSelection = useCallback((start: number, end: number) => {
    emit('collaboration:selection', {
      projectId,
      start,
      end,
      timestamp: new Date().toISOString()
    })
  }, [emit, projectId])

  return {
    collaborators,
    comments,
    cursors,
    selections,
    sendComment,
    updateCursor,
    updateSelection
  }
}

export default useWebSocketIntegration
