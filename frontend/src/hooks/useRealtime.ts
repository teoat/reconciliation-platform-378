// React Hooks for Real-time Features
import { logger } from '@/services/logger'
import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService, UserPresence, Comment, Notification, RealtimeUpdate } from '../services/realtimeService';

// Real-time Connection Hook
export const useRealtimeConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const connect = useCallback(async (token?: string) => {
    try {
      setConnectionStatus('connecting');
      await realtimeService.connect(token);
      setIsConnected(true);
      setConnectionStatus('connected');
    } catch (error) {
      logger.error('Realtime connection failed:', error);
      setIsConnected(false);
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    realtimeService.disconnect();
    setIsConnected(false);
    setIsAuthenticated(false);
    setConnectionStatus('disconnected');
  }, []);

  const authenticate = useCallback(async (token: string) => {
    await realtimeService.authenticate(token);
  }, []);

  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setIsAuthenticated(false);
      setConnectionStatus('disconnected');
    };

    const handleAuthenticated = () => {
      setIsAuthenticated(true);
    };

    const handleAuthError = () => {
      setIsAuthenticated(false);
    };

    realtimeService.on('connected', handleConnected);
    realtimeService.on('disconnected', handleDisconnected);
    realtimeService.on('authenticated', handleAuthenticated);
    realtimeService.on('auth_error', handleAuthError);

    return () => {
      realtimeService.off('connected', handleConnected);
      realtimeService.off('disconnected', handleDisconnected);
      realtimeService.off('authenticated', handleAuthenticated);
      realtimeService.off('auth_error', handleAuthError);
    };
  }, []);

  return {
    isConnected,
    isAuthenticated,
    connectionStatus,
    connect,
    disconnect,
    authenticate,
  };
};

// User Presence Hook
export const useUserPresence = (page: string) => {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  const startTracking = useCallback(() => {
    if (!isTracking) {
      realtimeService.joinPage(page);
      setIsTracking(true);
    }
  }, [page, isTracking]);

  const stopTracking = useCallback(() => {
    if (isTracking) {
      realtimeService.leavePage();
      setIsTracking(false);
    }
  }, [isTracking]);

  const updateCursorPosition = useCallback((x: number, y: number, element?: string) => {
    realtimeService.updateCursorPosition(x, y, element);
  }, []);

  useEffect(() => {
    const handleUserJoin = (data: any) => {
      if (data.page === page) {
        setActiveUsers(prev => {
          const existing = prev.find(u => u.user_id === data.user_id);
          if (existing) {
            return prev.map(u => 
              u.user_id === data.user_id 
                ? { ...u, last_seen: data.timestamp }
                : u
            );
          } else {
            return [...prev, {
              user_id: data.user_id,
              username: data.username,
              page: data.page,
              last_seen: data.timestamp,
            }];
          }
        });
      }
    };

    const handleUserLeave = (data: any) => {
      if (data.page === page) {
        setActiveUsers(prev => prev.filter(u => u.user_id !== data.user_id));
      }
    };

    const handleUserPresence = (data: any) => {
      if (data.page === page) {
        setActiveUsers(data.users || []);
      }
    };

    realtimeService.on('user_join', handleUserJoin);
    realtimeService.on('user_leave', handleUserLeave);
    realtimeService.on('user_presence', handleUserPresence);

    return () => {
      realtimeService.off('user_join', handleUserJoin);
      realtimeService.off('user_leave', handleUserLeave);
      realtimeService.off('user_presence', handleUserPresence);
    };
  }, [page]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    activeUsers: activeUsers.filter(u => u.page === page),
    isTracking,
    startTracking,
    stopTracking,
    updateCursorPosition,
  };
};

// Comments Hook
export const useComments = (page: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addComment = useCallback((message: string, position?: { x: number; y: number; element?: string }) => {
    realtimeService.addComment(message, position);
  }, []);

  const updateComment = useCallback((commentId: string, message: string) => {
    realtimeService.updateComment(commentId, message);
  }, []);

  const deleteComment = useCallback((commentId: string) => {
    realtimeService.deleteComment(commentId);
  }, []);

  useEffect(() => {
    const handleCommentAdd = (data: any) => {
      if (data.page === page) {
        setComments(prev => {
          const exists = prev.find(c => c.id === data.id);
          if (!exists) {
            return [...prev, data];
          }
          return prev;
        });
      }
    };

    const handleCommentUpdate = (data: any) => {
      setComments(prev => 
        prev.map(comment => 
          comment.id === data.id 
            ? { ...comment, message: data.message, updated_at: new Date().toISOString() }
            : comment
        )
      );
    };

    const handleCommentDelete = (data: any) => {
      setComments(prev => prev.filter(comment => comment.id !== data.id));
    };

    realtimeService.on('comment_add', handleCommentAdd);
    realtimeService.on('comment_update', handleCommentUpdate);
    realtimeService.on('comment_delete', handleCommentDelete);

    return () => {
      realtimeService.off('comment_add', handleCommentAdd);
      realtimeService.off('comment_update', handleCommentUpdate);
      realtimeService.off('comment_delete', handleCommentDelete);
    };
  }, [page]);

  return {
    comments: comments.filter(c => c.page === page),
    isLoading,
    addComment,
    updateComment,
    deleteComment,
  };
};

// Notifications Hook
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    const handleNotification = (data: any) => {
      setNotifications(prev => [data, ...prev]);
    };

    realtimeService.on('notification', handleNotification);

    return () => {
      realtimeService.off('notification', handleNotification);
    };
  }, []);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };
};

// Reconciliation Progress Hook
export const useReconciliationProgress = () => {
  const [activeJobs, setActiveJobs] = useState<Map<string, any>>(new Map());
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);

  const startReconciliation = useCallback((jobId: string, projectId: string) => {
    realtimeService.startReconciliation(jobId, projectId);
  }, []);

  useEffect(() => {
    const handleReconciliationStart = (data: any) => {
      setActiveJobs(prev => new Map(prev.set(data.job_id, {
        ...data,
        progress: 0,
        status: 'starting'
      })));
    };

    const handleReconciliationProgress = (data: any) => {
      setActiveJobs(prev => new Map(prev.set(data.job_id, {
        ...prev.get(data.job_id),
        ...data
      })));
    };

    const handleReconciliationComplete = (data: any) => {
      const job = activeJobs.get(data.job_id);
      if (job) {
        setCompletedJobs(prev => [{
          ...job,
          ...data,
          completed_at: new Date().toISOString()
        }, ...prev]);
        setActiveJobs(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.job_id);
          return newMap;
        });
      }
    };

    const handleReconciliationError = (data: any) => {
      setActiveJobs(prev => {
        const newMap = new Map(prev);
        const job = newMap.get(data.job_id);
        if (job) {
          newMap.set(data.job_id, {
            ...job,
            status: 'error',
            error: data.error
          });
        }
        return newMap;
      });
    };

    realtimeService.on('reconciliation_start', handleReconciliationStart);
    realtimeService.on('reconciliation_progress', handleReconciliationProgress);
    realtimeService.on('reconciliation_complete', handleReconciliationComplete);
    realtimeService.on('reconciliation_error', handleReconciliationError);

    return () => {
      realtimeService.off('reconciliation_start', handleReconciliationStart);
      realtimeService.off('reconciliation_progress', handleReconciliationProgress);
      realtimeService.off('reconciliation_complete', handleReconciliationComplete);
      realtimeService.off('reconciliation_error', handleReconciliationError);
    };
  }, [activeJobs]);

  return {
    activeJobs: Array.from(activeJobs.values()),
    completedJobs,
    startReconciliation,
  };
};

// File Upload Progress Hook
export const useFileUploadProgress = () => {
  const [activeUploads, setActiveUploads] = useState<Map<string, any>>(new Map());
  const [completedUploads, setCompletedUploads] = useState<any[]>([]);

  const startFileUpload = useCallback((fileId: string, filename: string) => {
    realtimeService.startFileUpload(fileId, filename);
  }, []);

  useEffect(() => {
    const handleFileUploadStart = (data: any) => {
      setActiveUploads(prev => new Map(prev.set(data.file_id, {
        ...data,
        progress: 0,
        status: 'uploading'
      })));
    };

    const handleFileUploadProgress = (data: any) => {
      setActiveUploads(prev => new Map(prev.set(data.file_id, {
        ...prev.get(data.file_id),
        ...data
      })));
    };

    const handleFileUploadComplete = (data: any) => {
      const upload = activeUploads.get(data.file_id);
      if (upload) {
        setCompletedUploads(prev => [{
          ...upload,
          ...data,
          completed_at: new Date().toISOString()
        }, ...prev]);
        setActiveUploads(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.file_id);
          return newMap;
        });
      }
    };

    const handleFileUploadError = (data: any) => {
      setActiveUploads(prev => {
        const newMap = new Map(prev);
        const upload = newMap.get(data.file_id);
        if (upload) {
          newMap.set(data.file_id, {
            ...upload,
            status: 'error',
            error: data.error
          });
        }
        return newMap;
      });
    };

    realtimeService.on('file_upload_start', handleFileUploadStart);
    realtimeService.on('file_upload_progress', handleFileUploadProgress);
    realtimeService.on('file_upload_complete', handleFileUploadComplete);
    realtimeService.on('file_upload_error', handleFileUploadError);

    return () => {
      realtimeService.off('file_upload_start', handleFileUploadStart);
      realtimeService.off('file_upload_progress', handleFileUploadProgress);
      realtimeService.off('file_upload_complete', handleFileUploadComplete);
      realtimeService.off('file_upload_error', handleFileUploadError);
    };
  }, [activeUploads]);

  return {
    activeUploads: Array.from(activeUploads.values()),
    completedUploads,
    startFileUpload,
  };
};

// Real-time Updates Hook
export const useRealtimeUpdates = () => {
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([]);

  useEffect(() => {
    const handleRealtimeUpdate = (data: any) => {
      setUpdates(prev => [data, ...prev.slice(0, 99)]); // Keep last 100 updates
    };

    realtimeService.on('realtime_update', handleRealtimeUpdate);

    return () => {
      realtimeService.off('realtime_update', handleRealtimeUpdate);
    };
  }, []);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
  }, []);

  return {
    updates,
    clearUpdates,
  };
};
