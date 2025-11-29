// ============================================================================
// UNIFIED STORE HOOKS
// ============================================================================

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector, selectUI } from './unifiedStore';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadFile,
  fetchUploadedFiles,
  fetchReconciliationRecords,
  runMatching,
  fetchDashboardData,
  authActions,
  projectsActions,
  dataSourcesActions,
  reconciliationRecordsActions,
  notificationsActions,
  uiActions,
} from './unifiedStore';
import type { User } from '../types/backend-aligned';
import type { Project } from '../types/backend-aligned';
import type { Notification } from '../types/backend-aligned';

// ============================================================================
// AUTH HOOKS
// ============================================================================

export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  return {
    ...auth,
    login: useCallback(
      (credentials: { email: string; password: string }) => dispatch(loginUser(credentials)),
      [dispatch]
    ),
    register: useCallback(
      (userData: { email: string; password: string; name: string }) =>
        dispatch(registerUser(userData)),
      [dispatch]
    ),
    logout: useCallback(() => dispatch(logoutUser(undefined)), [dispatch]),
    getCurrentUser: useCallback(() => dispatch(getCurrentUser(undefined)), [dispatch]),
    setUser: useCallback((user: User | null) => dispatch(authActions.setUser(user)), [dispatch]),
    clearError: useCallback(() => dispatch(authActions.clearError()), [dispatch]),
  };
};

// ============================================================================
// PROJECTS HOOKS
// ============================================================================

export const useProjects = () => {
  const projects = useAppSelector((state) => state.projects);
  const dispatch = useAppDispatch();

  return {
    ...projects,
    fetchProjects: useCallback(
      (params?: { page?: number; per_page?: number; search?: string; status?: string }) =>
        dispatch(fetchProjects(params)),
      [dispatch]
    ),
    createProject: useCallback(
      (projectData: {
        name: string;
        description?: string;
        settings?: Record<string, unknown>;
        status?: string;
      }) => dispatch(createProject(projectData)),
      [dispatch]
    ),
    updateProject: useCallback(
      (params: {
        id: string;
        data: Partial<{
          name?: string;
          description?: string;
          settings?: Record<string, unknown>;
          status?: string;
          is_active?: boolean;
        }>;
      }) => dispatch(updateProject(params)),
      [dispatch]
    ),
    deleteProject: useCallback((id: string) => dispatch(deleteProject(id)), [dispatch]),
    setSelectedProject: useCallback(
      (project: Project | null) => dispatch(projectsActions.setSelectedProject(project)),
      [dispatch]
    ),
    setSearchQuery: useCallback(
      (query: string) => dispatch(projectsActions.setSearchQuery(query)),
      [dispatch]
    ),
    setFilterStatus: useCallback(
      (status: string | null) => dispatch(projectsActions.setFilterStatus(status)),
      [dispatch]
    ),
  };
};

// ============================================================================
// DATA INGESTION HOOKS
// ============================================================================

export const useDataIngestion = () => {
  const dataIngestion = useAppSelector((state) => state.dataIngestion);
  const dispatch = useAppDispatch();

  return {
    ...dataIngestion,
    uploadFile: useCallback(
      (params: {
        projectId: string;
        file: File;
        metadata?: { name: string; source_type: string };
      }) => dispatch(uploadFile(params)),
      [dispatch]
    ),
    fetchUploadedFiles: useCallback(
      (projectId: string) => dispatch(fetchUploadedFiles({ projectId })),
      [dispatch]
    ),
    setUploadProgress: useCallback(
      (progress: number) => dispatch(dataSourcesActions.setUploadProgress(progress)),
      [dispatch]
    ),
  };
};

// ============================================================================
// RECONCILIATION HOOKS
// ============================================================================

export const useReconciliation = () => {
  const reconciliation = useAppSelector((state) => state.reconciliation);
  const dispatch = useAppDispatch();

  return {
    ...reconciliation,
    fetchRecords: useCallback(
      (projectId: string) => dispatch(fetchReconciliationRecords({ projectId })),
      [dispatch]
    ),
    runMatching: useCallback(
      (params: {
        projectId: string;
        rules: Array<{ field_a: string; field_b: string; rule_type: string; weight: number }>;
      }) => dispatch(runMatching(params)),
      [dispatch]
    ),
    setConfig: useCallback(
      (
        config: Partial<{
          matchingRules: string[];
          tolerance: number;
          autoMatch: boolean;
          priority: 'high' | 'medium' | 'low';
          batchSize: number;
          timeout: number;
        }>
      ) => dispatch(reconciliationRecordsActions.setConfig(config)),
      [dispatch]
    ),
    setMatchingProgress: useCallback(
      (progress: number) => dispatch(reconciliationRecordsActions.setMatchingProgress(progress)),
      [dispatch]
    ),
  };
};

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

export const useAnalytics = () => {
  const analytics = useAppSelector((state) => state.analytics);
  const dispatch = useAppDispatch();

  return {
    ...analytics,
    fetchDashboardData: useCallback(() => dispatch(fetchDashboardData(undefined)), [dispatch]),
  };
};

// ============================================================================
// UI HOOKS
// ============================================================================

export const useUI = () => {
  const ui = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();

  return {
    ...ui,
    toggleSidebar: useCallback(() => dispatch(uiActions.toggleSidebar()), [dispatch]),
    setSidebarOpen: useCallback(
      (open: boolean) => dispatch(uiActions.setSidebarOpen(open)),
      [dispatch]
    ),
    setTheme: useCallback(
      (theme: 'light' | 'dark' | 'system') => dispatch(uiActions.setTheme(theme)),
      [dispatch]
    ),
    addNotification: useCallback(
      (notification: Notification) => dispatch(uiActions.addNotification(notification)),
      [dispatch]
    ),
    removeNotification: useCallback(
      (id: string) => dispatch(uiActions.removeNotification(id)),
      [dispatch]
    ),
    clearAllNotifications: useCallback(
      () => dispatch(uiActions.clearAllNotifications()),
      [dispatch]
    ),
    openModal: useCallback(
      (
        modal: 'createProject' | 'exportData' | 'settings' | 'deleteConfirmation' | 'batchOperation'
      ) => dispatch(uiActions.openModal(modal)),
      [dispatch]
    ),
    closeModal: useCallback(
      (
        modal: 'createProject' | 'exportData' | 'settings' | 'deleteConfirmation' | 'batchOperation'
      ) => dispatch(uiActions.closeModal(modal)),
      [dispatch]
    ),
    setLoadingState: useCallback(
      (params: {
        key: 'global' | 'projects' | 'reconciliation' | 'ingestion' | 'analytics';
        loading: boolean;
      }) => dispatch(uiActions.setLoadingState(params)),
      [dispatch]
    ),
  };
};

// ============================================================================
// COMBINED HOOKS
// ============================================================================

export const useApp = () => {
  const auth = useAuth();
  const projects = useProjects();
  const dataIngestion = useDataIngestion();
  const reconciliation = useReconciliation();
  const analytics = useAnalytics();
  const ui = useUI();

  return {
    auth,
    projects,
    dataIngestion,
    reconciliation,
    analytics,
    ui,
  };
};

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const uiState = useAppSelector(selectUI);
  const notifications = uiState.notifications || [];

  const markAsRead = useCallback(
    (id: string) => {
      const notification = notifications.find((n) => n.id === id);
      if (notification) {
        dispatch(
          notificationsActions.addNotification({
            ...notification,
            read: true,
          })
        );
      }
    },
    [dispatch, notifications]
  );

  const markAllAsRead = useCallback(() => {
    notifications.forEach((notification) => {
      if (!notification.read) {
        dispatch(
          notificationsActions.addNotification({
            ...notification,
            read: true,
          })
        );
      }
    });
  }, [dispatch, notifications]);

  const removeNotification = useCallback(
    (id: string) => {
      dispatch(notificationsActions.removeNotification(id));
    },
    [dispatch]
  );

  return {
    items: notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
};

export const useNotificationHelpers = () => {
  const dispatch = useAppDispatch();

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      dispatch(
        notificationsActions.addNotification({
          ...notification,
          id,
          timestamp: new Date().toISOString(),
          read: false,
        })
      );
    },
    [dispatch]
  );

  const removeNotification = useCallback(
    (id: string) => {
      dispatch(notificationsActions.removeNotification(id));
    },
    [dispatch]
  );

  const clearAllNotifications = useCallback(() => {
    dispatch(notificationsActions.clearAllNotifications());
  }, [dispatch]);

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      addNotification({
        type: 'success',
        title,
        message: message || title,
      });
    },
    [addNotification]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      addNotification({
        type: 'error',
        title,
        message: message || title,
      });
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      addNotification({
        type: 'info',
        title,
        message: message || title,
      });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      addNotification({
        type: 'warning',
        title,
        message: message || title,
      });
    },
    [addNotification]
  );

  return {
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};
