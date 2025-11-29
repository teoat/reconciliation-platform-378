import { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@/services/logger';
import { useWebSocketContext } from '../services/WebSocketProvider';
import { useAppDispatch, addNotification, reconciliationJobsActions } from '../store/unifiedStore';
import type {
  WebSocketMessage,
} from '../types/websocket';
// WebSocket message types - using generic WebSocketMessage for now
type ReconciliationProgressMessage = WebSocketMessage;
type ReconciliationCompletedMessage = WebSocketMessage;
type ReconciliationErrorMessage = WebSocketMessage;
type UserPresenceMessage = WebSocketMessage;
type ProjectUpdateMessage = WebSocketMessage;
type NotificationMessage = WebSocketMessage;
type ConnectionStatusMessage = WebSocketMessage;
type CollaborationUsersMessage = WebSocketMessage;
type CollaborationCommentMessage = WebSocketMessage;

// Helper function to safely extract data from WebSocketMessage union type
function getMessageData(message: WebSocketMessage): Record<string, unknown> {
  return 'data' in message ? (message.data as Record<string, unknown>) : {};
}

function getMessageId(message: WebSocketMessage): string | undefined {
  return 'id' in message ? (message.id as string | undefined) : undefined;
}

function getMessageTimestamp(message: WebSocketMessage): string | undefined {
  return 'timestamp' in message ? (message.timestamp as string | undefined) : undefined;
}

// WebSocket integration hook for real-time updates
export const useWebSocketIntegration = () => {
  const {
    status,
    isConnected: checkIsConnected,
    subscribe,
    unsubscribe,
    emit,
    updatePresence: _updatePresence,
  } = useWebSocketContext();
  const dispatch = useAppDispatch();
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error'
  >('disconnected');
  const [_lastMessage, _setLastMessage] = useState<WebSocketMessage | null>(null);
  const [activeUsers, setActiveUsers] = useState<UserPresenceMessage[]>([]);
  const subscriptions = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (status.connected) {
      setConnectionStatus('connected');
    } else if (status.reconnecting) {
      setConnectionStatus('reconnecting');
    } else if (status.connecting) {
      setConnectionStatus('connecting');
    } else if (status.error) {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [status]);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!checkIsConnected()) return;

    // Subscribe to reconciliation job updates
    const reconciliationSubId = subscribe(
      'reconciliation:progress',
      (data: ReconciliationProgressMessage) => {
        logger.info('Reconciliation progress update:', { data });
        // Dispatch reconciliation job update
        // Note: updateJob expects a full ReconciliationJob object
        // For now, we'll just show the notification without updating the job
        logger.info('Reconciliation progress:', { data });

        // Show progress notification
        const messageData = getMessageData(data);
        const jobId = messageData.jobId as string | undefined;
        const progress = messageData.progress as number | undefined;
        dispatch(
          addNotification({
            id: getMessageId(data) || `notification-${Date.now()}-${Math.random()}`,
            type: 'info',
            title: 'Reconciliation Progress',
            message: `Job ${jobId || 'unknown'} is ${progress || 0}% complete`,
            timestamp: getMessageTimestamp(data) || new Date().toISOString(),
            read: false,
          })
        );
      }
    );
    subscriptions.current.set('reconciliation:progress', reconciliationSubId);

    const completionSubId = subscribe(
      'reconciliation:completed',
      (data: ReconciliationCompletedMessage) => {
        logger.info('Reconciliation completed:', { data });
        // Complete job in unified store
        const messageData = getMessageData(data);
        const jobId = messageData.jobId as string | undefined;
        if (jobId) {
          dispatch(reconciliationJobsActions.completeJob(jobId));
        }

        // Show completion notification
        dispatch(
          addNotification({
            id: getMessageId(data) || `notification-${Date.now()}-${Math.random()}`,
            type: 'success',
            title: 'Reconciliation Completed',
            message: `Job ${jobId || 'unknown'} has been completed successfully`,
            timestamp: getMessageTimestamp(data) || new Date().toISOString(),
            read: false,
          })
        );
      }
    );
    subscriptions.current.set('reconciliation:completed', completionSubId);

    const errorSubId = subscribe('reconciliation:error', (data: ReconciliationErrorMessage) => {
      logger.error('Reconciliation error:', data as unknown as Record<string, unknown>);
      const messageData = getMessageData(data);
      const jobId = messageData.jobId as string | undefined;
      const error = messageData.error as string | Error | undefined;
      // Fail job in unified store
      if (jobId) {
        dispatch(
          reconciliationJobsActions.failJob({
            jobId,
            error: error instanceof Error ? error.message : String(error || 'Unknown error'),
          })
        );
      }

      // Show error notification
      dispatch(
        addNotification({
          id: getMessageId(data) || `notification-${Date.now()}-${Math.random()}`,
          type: 'error',
          title: 'Reconciliation Error',
          message: `Job ${jobId || 'unknown'} failed: ${error instanceof Error ? error.message : String(error || 'Unknown error')}`,
          timestamp: getMessageTimestamp(data) || new Date().toISOString(),
          read: false,
        })
      );
    });
    subscriptions.current.set('reconciliation:error', errorSubId);

    // Subscribe to user presence updates
    const presenceSubId = subscribe('user:presence', (data: UserPresenceMessage) => {
      logger.info('User presence update:', { data });
      const messageData = getMessageData(data);
      const userId = messageData.userId as string | undefined;
      const isOnline = messageData.isOnline as boolean | undefined;
      setActiveUsers((prev) => {
        const updated = prev.filter((user) => {
          const userData = getMessageData(user as WebSocketMessage);
          return (userData.userId as string | undefined) !== userId;
        });
        if (isOnline && userId) {
          updated.push(data);
        }
        return updated;
      });
    });
    subscriptions.current.set('user:presence', presenceSubId);

    // Subscribe to project updates
    const projectSubId = subscribe('project:updated', (data: ProjectUpdateMessage) => {
      logger.info('Project update:', { data });
      // Note: updateProject expects a full Project object
      // For now, we'll just log the update
    });
    subscriptions.current.set('project:updated', projectSubId);

    // Subscribe to notifications
    const notificationSubId = subscribe('notification:new', (data: NotificationMessage) => {
      logger.info('New notification:', { data });
      const messageData = getMessageData(data);
      const type = messageData.type as string | undefined;
      const title = messageData.title as string | undefined;
      const message = messageData.message as string | undefined;
      dispatch(
        addNotification({
          id: getMessageId(data) || `notification-${Date.now()}-${Math.random()}`,
          type: (type as 'info' | 'success' | 'warning' | 'error') || 'info',
          title: title || 'Notification',
          message: message || '',
          timestamp: getMessageTimestamp(data) || new Date().toISOString(),
          read: false,
        })
      );
    });
    subscriptions.current.set('notification:new', notificationSubId);

    // Subscribe to system alerts
    const alertSubId = subscribe('system:alert', (data: NotificationMessage) => {
      logger.info('System alert:', { data });
      const messageData = getMessageData(data);
      const message = messageData.message as string | undefined;
      dispatch(
        addNotification({
          id: getMessageId(data) || `notification-${Date.now()}-${Math.random()}`,
          type: 'warning',
          title: 'System Alert',
          message: message || '',
          timestamp: getMessageTimestamp(data) || new Date().toISOString(),
          read: false,
        })
      );
    });
    subscriptions.current.set('system:alert', alertSubId);

    // Subscribe to connection status changes
    const statusSubId = subscribe('connection:status', (data: ConnectionStatusMessage) => {
      const messageData = getMessageData(data);
      const status = messageData.status as string | undefined;
      if (status && ['connected', 'connecting', 'disconnected', 'reconnecting', 'error'].includes(status)) {
        setConnectionStatus(status as typeof connectionStatus);
      }
    });
    subscriptions.current.set('connection:status', statusSubId);

    return () => {
      // Cleanup subscriptions
      subscriptions.current.forEach((subId, event) => {
        unsubscribe(event, subId);
      });
      subscriptions.current.clear();
      };
    }, [checkIsConnected, subscribe, unsubscribe, dispatch]);

  // Send reconciliation job start command
  const startReconciliationJob = useCallback(
    (jobId: string, projectId: string) => {
      emit('reconciliation:start', {
        jobId,
        projectId,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send reconciliation job stop command
  const stopReconciliationJob = useCallback(
    (jobId: string) => {
      emit('reconciliation:stop', {
        jobId,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Update user presence
  const updateUserPresence = useCallback(
    (
      status: 'online' | 'away' | 'busy' | 'offline',
      currentPage?: string,
      currentProject?: string
    ) => {
      emit('user:presence', {
        status,
        currentPage,
        currentProject,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Join project room for collaboration
  const joinProjectRoom = useCallback(
    (projectId: string) => {
      emit('project:join', {
        projectId,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Leave project room
  const leaveProjectRoom = useCallback(
    (projectId: string) => {
      emit('project:leave', {
        projectId,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send collaboration update
  const sendCollaborationUpdate = useCallback(
    (projectId: string, fieldId: string, value: unknown) => {
      emit('collaboration:update', {
        projectId,
        fieldId,
        value,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send cursor position update
  const updateCursorPosition = useCallback(
    (projectId: string, x: number, y: number) => {
      emit('collaboration:cursor', {
        projectId,
        x,
        y,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send selection update
  const updateSelection = useCallback(
    (projectId: string, start: number, end: number) => {
      emit('collaboration:selection', {
        projectId,
        start,
        end,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send comment
  const sendComment = useCallback(
    (projectId: string, message: string, targetId?: string) => {
      emit('collaboration:comment', {
        projectId,
        message,
        targetId,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send file upload progress
  const sendFileUploadProgress = useCallback(
    (fileId: string, progress: number, status: string) => {
      emit('file:upload:progress', {
        fileId,
        progress,
        status,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send file processing update
  const sendFileProcessingUpdate = useCallback(
    (fileId: string, status: string, result?: unknown) => {
      emit('file:processing:update', {
        fileId,
        status,
        result,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send analytics update
  const sendAnalyticsUpdate = useCallback(
    (metric: string, value: unknown, metadata?: Record<string, unknown>) => {
      emit('analytics:update', {
        metric,
        value,
        metadata,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send error report
  const sendErrorReport = useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      emit('error:report', {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        context,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send performance metrics
  const sendPerformanceMetrics = useCallback(
    (metrics: Record<string, unknown>) => {
      emit('performance:metrics', {
        metrics,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send user activity
  const sendUserActivity = useCallback(
    (action: string, resource: string, resourceId?: string, metadata?: Record<string, unknown>) => {
      emit('user:activity', {
        action,
        resource,
        resourceId,
        metadata,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  // Send heartbeat
  const sendHeartbeat = useCallback(() => {
    emit('heartbeat', {
      timestamp: new Date().toISOString(),
    });
  }, [emit]);

  // Send custom event
  const sendCustomEvent = useCallback(
    (event: string, data: Record<string, unknown>) => {
      emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    },
    [emit]
  );

  return {
    connectionStatus,
    _lastMessage,
    activeUsers,
    isConnected: status.connected,
    subscribe,
    unsubscribe,
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
    sendCustomEvent,
  };
};

// Hook for real-time reconciliation updates
export const useRealtimeReconciliation = (jobId?: string) => {
  const { subscribe, unsubscribe } = useWebSocketContext();
  const [jobStatus, setJobStatus] = useState<Record<string, unknown> | null>(null);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const progressSubId = subscribe(
      'reconciliation:progress',
      (data: ReconciliationProgressMessage) => {
        const messageData = getMessageData(data);
        const dataJobId = messageData.jobId as string | undefined;
        if (dataJobId === jobId) {
          setProgress((messageData.progress as number | undefined) || 0);
          setIsRunning((messageData.status as string | undefined) === 'running');
          setJobStatus(data as unknown as Record<string, unknown>);
        }
      }
    );

    const completionSubId = subscribe(
      'reconciliation:completed',
      (data: ReconciliationCompletedMessage) => {
        const messageData = getMessageData(data);
        const dataJobId = messageData.jobId as string | undefined;
        if (dataJobId === jobId) {
          setIsRunning(false);
          setJobStatus(data as unknown as Record<string, unknown>);
        }
      }
    );

    const errorSubId = subscribe('reconciliation:error', (data: ReconciliationErrorMessage) => {
      const messageData = getMessageData(data);
      const dataJobId = messageData.jobId as string | undefined;
      if (dataJobId === jobId) {
        setIsRunning(false);
        const messageData = getMessageData(data);
        const errorValue = messageData.error as string | Error | undefined;
        setError(errorValue instanceof Error ? errorValue.message : (errorValue as string | undefined));
      }
    });

    return () => {
      unsubscribe('reconciliation:progress', progressSubId);
      unsubscribe('reconciliation:completed', completionSubId);
      unsubscribe('reconciliation:error', errorSubId);
    };
  }, [jobId, subscribe, unsubscribe]);

  return {
    jobStatus,
    progress,
    isRunning,
    error,
  };
};

// Hook for real-time collaboration
export const useRealtimeCollaboration = (projectId?: string) => {
  const { subscribe, unsubscribe, emit, isConnected, updatePresence } = useWebSocketContext();
  const [collaborators, setCollaborators] = useState<UserPresenceMessage[]>([]);
  const [comments, setComments] = useState<CollaborationCommentMessage[]>([]);
  const [cursors, setCursors] = useState<Map<string, UserPresenceMessage>>(new Map());
  const [selections, setSelections] = useState<Map<string, UserPresenceMessage>>(new Map());

  useEffect(() => {
    if (!projectId) return;

    const collaboratorsSubId = subscribe(
      'collaboration:users',
      (data: CollaborationUsersMessage) => {
        const messageData = getMessageData(data);
        const dataProjectId = messageData.projectId as string | undefined;
        if (dataProjectId === projectId) {
          setCollaborators((messageData.users as UserPresenceMessage[]) || []);
        }
      }
    );

    const commentsSubId = subscribe(
      'collaboration:comment',
      (data: CollaborationCommentMessage) => {
        const messageData = getMessageData(data);
      const dataProjectId = messageData.projectId as string | undefined;
        if (dataProjectId === projectId) {
          setComments((prev) => [...prev, data]);
        }
      }
    );

    const cursorSubId = subscribe('collaboration:cursor', (data: UserPresenceMessage) => {
      const messageData = getMessageData(data);
      const dataProjectId = messageData.projectId as string | undefined;
      const userId = messageData.userId as string | undefined;
      if (dataProjectId === projectId && userId) {
        setCursors((prev) => {
          const newCursors = new Map(prev);
          newCursors.set(userId, data);
          return newCursors;
        });
      }
    });

    const selectionSubId = subscribe('collaboration:selection', (data: UserPresenceMessage) => {
      const messageData = getMessageData(data);
      const dataProjectId = messageData.projectId as string | undefined;
      const userId = messageData.userId as string | undefined;
      if (dataProjectId === projectId && userId) {
        setSelections((prev) => {
          const newSelections = new Map(prev);
          newSelections.set(userId, data);
          return newSelections;
        });
      }
    });

    return () => {
      unsubscribe('collaboration:users', collaboratorsSubId);
      unsubscribe('collaboration:comment', commentsSubId);
      unsubscribe('collaboration:cursor', cursorSubId);
      unsubscribe('collaboration:selection', selectionSubId);
    };
  }, [projectId, subscribe, unsubscribe]);

  const sendComment = useCallback(
    (userId: string, userName: string, message: string, targetId?: string) => {
      emit('collaboration:comment', {
        projectId,
        userId,
        userName,
        message,
        targetId,
        timestamp: new Date().toISOString(),
      });
    },
    [emit, projectId]
  );

  const updateCursor = useCallback(
    (x: number, y: number) => {
      emit('collaboration:cursor', {
        projectId,
        x,
        y,
        timestamp: new Date().toISOString(),
      });
    },
    [emit, projectId]
  );

  const updateSelection = useCallback(
    (start: number, end: number) => {
      emit('collaboration:selection', {
        projectId,
        start,
        end,
        timestamp: new Date().toISOString(),
      });
    },
    [emit, projectId]
  );

  return {
    isConnected: isConnected(),
    activeUsers: collaborators,
    liveComments: comments,
    sendComment,
    updatePresence,
    collaborators,
    comments,
    cursors,
    selections,
    updateCursor,
    updateSelection,
  };
};

export default useWebSocketIntegration;
