import { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@/services/logger';
import { useWebSocketContext } from '../services/WebSocketProvider';
import { useAppDispatch, addNotification, reconciliationJobsActions } from '../store/unifiedStore';
import type {
  ReconciliationProgressMessage,
  ReconciliationCompletedMessage,
  ReconciliationErrorMessage,
  UserPresenceMessage,
  ProjectUpdateMessage,
  NotificationMessage,
  ConnectionStatusMessage,
  CollaborationUsersMessage,
  CollaborationCommentMessage,
  WebSocketMessage,
} from '../../../types';

// WebSocket integration hook for real-time updates
export const useWebSocketIntegration = () => {
  const {
    isConnected,
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

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!isConnected()) return;

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
        dispatch(
          addNotification({
            type: 'info',
            title: 'Reconciliation Progress',
            message: `Job ${data.jobId} is ${data.progress}% complete`,
            timestamp: new Date(),
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
        dispatch(reconciliationJobsActions.completeJob(data.jobId));

        // Show completion notification
        dispatch(
          addNotification({
            type: 'success',
            title: 'Reconciliation Completed',
            message: `Job ${data.jobId} has been completed successfully`,
            timestamp: new Date(),
            read: false,
          })
        );
      }
    );
    subscriptions.current.set('reconciliation:completed', completionSubId);

    const errorSubId = subscribe('reconciliation:error', (data: ReconciliationErrorMessage) => {
      logger.error('Reconciliation error:', data);
      // Fail job in unified store
      dispatch(
        reconciliationJobsActions.failJob({
          jobId: data.jobId,
          error: data.error,
        })
      );

      // Show error notification
      dispatch(
        addNotification({
          type: 'error',
          title: 'Reconciliation Error',
          message: `Job ${data.jobId} failed: ${data.error}`,
          timestamp: new Date(),
          read: false,
        })
      );
    });
    subscriptions.current.set('reconciliation:error', errorSubId);

    // Subscribe to user presence updates
    const presenceSubId = subscribe('user:presence', (data: UserPresenceMessage) => {
      logger.info('User presence update:', { data });
      setActiveUsers((prev) => {
        const updated = prev.filter((user) => user.userId !== data.userId);
        if (data.isOnline) {
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
      dispatch(
        addNotification({
          type: data.type,
          title: data.title,
          message: data.message,
          timestamp: new Date(),
          read: false,
        })
      );
    });
    subscriptions.current.set('notification:new', notificationSubId);

    // Subscribe to system alerts
    const alertSubId = subscribe('system:alert', (data: NotificationMessage) => {
      logger.info('System alert:', { data });
      dispatch(
        addNotification({
          type: 'warning',
          title: 'System Alert',
          message: data.message,
          timestamp: new Date(),
          read: false,
        })
      );
    });
    subscriptions.current.set('system:alert', alertSubId);

    // Subscribe to connection status changes
    const statusSubId = subscribe('connection:status', (data: ConnectionStatusMessage) => {
      setConnectionStatus(data.status);
    });
    subscriptions.current.set('connection:status', statusSubId);

    return () => {
      // Cleanup subscriptions
      subscriptions.current.forEach((subId, event) => {
        unsubscribe(event, subId);
      });
      subscriptions.current.clear();
    };
  }, [isConnected, subscribe, unsubscribe, dispatch]);

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
    isConnected: isConnected(),
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
  const [jobStatus, setJobStatus] = useState<ReconciliationProgressMessage | null>(null);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const progressSubId = subscribe(
      'reconciliation:progress',
      (data: ReconciliationProgressMessage) => {
        if (data.jobId === jobId) {
          setProgress(data.progress);
          setIsRunning(data.status === 'running');
          setJobStatus(data);
        }
      }
    );

    const completionSubId = subscribe(
      'reconciliation:completed',
      (data: ReconciliationCompletedMessage) => {
        if (data.jobId === jobId) {
          setIsRunning(false);
          setJobStatus(data);
        }
      }
    );

    const errorSubId = subscribe('reconciliation:error', (data: ReconciliationErrorMessage) => {
      if (data.jobId === jobId) {
        setIsRunning(false);
        setError(data.error);
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
        if (data.projectId === projectId) {
          setCollaborators(data.users);
        }
      }
    );

    const commentsSubId = subscribe(
      'collaboration:comment',
      (data: CollaborationCommentMessage) => {
        if (data.projectId === projectId) {
          setComments((prev) => [...prev, data]);
        }
      }
    );

    const cursorSubId = subscribe('collaboration:cursor', (data: UserPresenceMessage) => {
      if (data.projectId === projectId) {
        setCursors((prev) => {
          const newCursors = new Map(prev);
          newCursors.set(data.userId, data);
          return newCursors;
        });
      }
    });

    const selectionSubId = subscribe('collaboration:selection', (data: UserPresenceMessage) => {
      if (data.projectId === projectId) {
        setSelections((prev) => {
          const newSelections = new Map(prev);
          newSelections.set(data.userId, data);
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
