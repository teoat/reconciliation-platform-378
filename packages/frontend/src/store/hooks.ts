import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from './store'
import {
  authActions,
  projectsActions,
  dataSourcesActions,
  reconciliationRecordsActions,
  reconciliationMatchesActions,
  reconciliationJobsActions,
  notificationsActions,
  uiActions,
  fetchProjects,
  createProject
} from './store'
import type { User, Project, DataSource, ReconciliationRecord, ReconciliationMatch, ReconciliationJob, Notification } from './store'

// ============================================================================
// AUTH HOOKS
// ============================================================================

export const useAuthActions = () => {
  const dispatch = useAppDispatch()

  return {
    loginStart: useCallback(() => dispatch(authActions.loginStart()), [dispatch]),
    loginSuccess: useCallback((user: User) => dispatch(authActions.loginSuccess(user)), [dispatch]),
    loginFailure: useCallback((error: string) => dispatch(authActions.loginFailure(error)), [dispatch]),
    logout: useCallback(() => dispatch(authActions.logout()), [dispatch]),
    updateUser: useCallback((userData: Partial<User>) => dispatch(authActions.updateUser(userData)), [dispatch]),
    clearError: useCallback(() => dispatch(authActions.clearError()), [dispatch])
  }
}

export const useAuth = () => {
  const auth = useAppSelector(state => state.auth)
  const actions = useAuthActions()
  
  return {
    ...auth,
    ...actions
  }
}

// ============================================================================
// PROJECTS HOOKS
// ============================================================================

export const useProjectsActions = () => {
  const dispatch = useAppDispatch()

  return {
    fetchProjectsStart: useCallback(() => dispatch(projectsActions.fetchProjectsStart()), [dispatch]),
    fetchProjectsSuccess: useCallback((data: { projects: Project[]; pagination: any }) => 
      dispatch(projectsActions.fetchProjectsSuccess(data)), [dispatch]),
    fetchProjectsFailure: useCallback((error: string) => 
      dispatch(projectsActions.fetchProjectsFailure(error)), [dispatch]),
    createProject: useCallback((project: Project) => 
      dispatch(projectsActions.createProject(project)), [dispatch]),
    updateProject: useCallback((project: Project) => 
      dispatch(projectsActions.updateProject(project)), [dispatch]),
    deleteProject: useCallback((projectId: string) => 
      dispatch(projectsActions.deleteProject(projectId)), [dispatch]),
    fetchProjectsAsync: useCallback((params?: any) => 
      dispatch(fetchProjects(params)), [dispatch]),
    createProjectAsync: useCallback((projectData: any) => 
      dispatch(createProject(projectData)), [dispatch])
  }
}

export const useProjects = () => {
  const projects = useAppSelector(state => state.projects)
  const actions = useProjectsActions()
  
  return {
    ...projects,
    ...actions
  }
}

// ============================================================================
// DATA SOURCES HOOKS
// ============================================================================

export const useDataSourcesActions = () => {
  const dispatch = useAppDispatch()

  return {
    fetchDataSourcesStart: useCallback(() => 
      dispatch(dataSourcesActions.fetchDataSourcesStart()), [dispatch]),
    fetchDataSourcesSuccess: useCallback((dataSources: DataSource[]) => 
      dispatch(dataSourcesActions.fetchDataSourcesSuccess(dataSources)), [dispatch]),
    fetchDataSourcesFailure: useCallback((error: string) => 
      dispatch(dataSourcesActions.fetchDataSourcesFailure(error)), [dispatch]),
    uploadFileStart: useCallback((data: { fileId: string; fileName: string }) => 
      dispatch(dataSourcesActions.uploadFileStart(data)), [dispatch]),
    uploadFileProgress: useCallback((data: { fileId: string; progress: number }) => 
      dispatch(dataSourcesActions.uploadFileProgress(data)), [dispatch]),
    uploadFileSuccess: useCallback((dataSource: DataSource) => 
      dispatch(dataSourcesActions.uploadFileSuccess(dataSource)), [dispatch]),
    uploadFileFailure: useCallback((data: { fileId: string; error: string }) => 
      dispatch(dataSourcesActions.uploadFileFailure(data)), [dispatch]),
    processFileStart: useCallback((dataSourceId: string) => 
      dispatch(dataSourcesActions.processFileStart(dataSourceId)), [dispatch]),
    processFileSuccess: useCallback((dataSource: DataSource) => 
      dispatch(dataSourcesActions.processFileSuccess(dataSource)), [dispatch]),
    processFileFailure: useCallback((data: { dataSourceId: string; error: string }) => 
      dispatch(dataSourcesActions.processFileFailure(data)), [dispatch])
  }
}

export const useDataSources = () => {
  const dataSources = useAppSelector(state => state.dataSources)
  const actions = useDataSourcesActions()
  
  return {
    ...dataSources,
    ...actions
  }
}

// ============================================================================
// RECONCILIATION RECORDS HOOKS
// ============================================================================

export const useReconciliationRecordsActions = () => {
  const dispatch = useAppDispatch()

  return {
    fetchRecordsStart: useCallback(() => 
      dispatch(reconciliationRecordsActions.fetchRecordsStart()), [dispatch]),
    fetchRecordsSuccess: useCallback((data: { records: ReconciliationRecord[]; pagination: any }) => 
      dispatch(reconciliationRecordsActions.fetchRecordsSuccess(data)), [dispatch]),
    fetchRecordsFailure: useCallback((error: string) => 
      dispatch(reconciliationRecordsActions.fetchRecordsFailure(error)), [dispatch]),
    updateRecord: useCallback((record: ReconciliationRecord) => 
      dispatch(reconciliationRecordsActions.updateRecord(record)), [dispatch])
  }
}

export const useReconciliationRecords = () => {
  const records = useAppSelector(state => state.reconciliationRecords)
  const actions = useReconciliationRecordsActions()
  
  return {
    ...records,
    ...actions
  }
}

// ============================================================================
// RECONCILIATION MATCHES HOOKS
// ============================================================================

export const useReconciliationMatchesActions = () => {
  const dispatch = useAppDispatch()

  return {
    fetchMatchesStart: useCallback(() => 
      dispatch(reconciliationMatchesActions.fetchMatchesStart()), [dispatch]),
    fetchMatchesSuccess: useCallback((data: { matches: ReconciliationMatch[]; pagination: any }) => 
      dispatch(reconciliationMatchesActions.fetchMatchesSuccess(data)), [dispatch]),
    fetchMatchesFailure: useCallback((error: string) => 
      dispatch(reconciliationMatchesActions.fetchMatchesFailure(error)), [dispatch]),
    createMatch: useCallback((match: ReconciliationMatch) => 
      dispatch(reconciliationMatchesActions.createMatch(match)), [dispatch]),
    updateMatch: useCallback((match: ReconciliationMatch) => 
      dispatch(reconciliationMatchesActions.updateMatch(match)), [dispatch]),
    approveMatch: useCallback((matchId: string) => 
      dispatch(reconciliationMatchesActions.approveMatch(matchId)), [dispatch]),
    rejectMatch: useCallback((matchId: string) => 
      dispatch(reconciliationMatchesActions.rejectMatch(matchId)), [dispatch])
  }
}

export const useReconciliationMatches = () => {
  const matches = useAppSelector(state => state.reconciliationMatches)
  const actions = useReconciliationMatchesActions()
  
  return {
    ...matches,
    ...actions
  }
}

// ============================================================================
// RECONCILIATION JOBS HOOKS
// ============================================================================

export const useReconciliationJobsActions = () => {
  const dispatch = useAppDispatch()

  return {
    fetchJobsStart: useCallback(() => 
      dispatch(reconciliationJobsActions.fetchJobsStart()), [dispatch]),
    fetchJobsSuccess: useCallback((jobs: ReconciliationJob[]) => 
      dispatch(reconciliationJobsActions.fetchJobsSuccess(jobs)), [dispatch]),
    fetchJobsFailure: useCallback((error: string) => 
      dispatch(reconciliationJobsActions.fetchJobsFailure(error)), [dispatch]),
    createJob: useCallback((job: ReconciliationJob) => 
      dispatch(reconciliationJobsActions.createJob(job)), [dispatch]),
    updateJob: useCallback((job: ReconciliationJob) => 
      dispatch(reconciliationJobsActions.updateJob(job)), [dispatch]),
    startJob: useCallback((jobId: string) => 
      dispatch(reconciliationJobsActions.startJob(jobId)), [dispatch]),
    completeJob: useCallback((jobId: string) => 
      dispatch(reconciliationJobsActions.completeJob(jobId)), [dispatch]),
    failJob: useCallback((data: { jobId: string; error: string }) => 
      dispatch(reconciliationJobsActions.failJob(data)), [dispatch])
  }
}

export const useReconciliationJobs = () => {
  const jobs = useAppSelector(state => state.reconciliationJobs)
  const actions = useReconciliationJobsActions()
  
  return {
    ...jobs,
    ...actions
  }
}

// ============================================================================
// NOTIFICATIONS HOOKS
// ============================================================================

export const useNotificationsActions = () => {
  const dispatch = useAppDispatch()

  return {
    addNotification: useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => 
      dispatch(notificationsActions.addNotification(notification)), [dispatch]),
    markAsRead: useCallback((notificationId: string) => 
      dispatch(notificationsActions.markAsRead(notificationId)), [dispatch]),
    markAllAsRead: useCallback(() => 
      dispatch(notificationsActions.markAllAsRead()), [dispatch]),
    removeNotification: useCallback((notificationId: string) => 
      dispatch(notificationsActions.removeNotification(notificationId)), [dispatch]),
    clearAllNotifications: useCallback(() => 
      dispatch(notificationsActions.clearAllNotifications()), [dispatch])
  }
}

export const useNotifications = () => {
  const notifications = useAppSelector(state => state.notifications)
  const actions = useNotificationsActions()
  
  return {
    ...notifications,
    ...actions
  }
}

// ============================================================================
// UI HOOKS
// ============================================================================

export const useUIActions = () => {
  const dispatch = useAppDispatch()

  return {
    toggleSidebar: useCallback(() => dispatch(uiActions.toggleSidebar()), [dispatch]),
    setSidebarOpen: useCallback((open: boolean) => dispatch(uiActions.setSidebarOpen(open)), [dispatch]),
    setTheme: useCallback((theme: 'light' | 'dark') => dispatch(uiActions.setTheme(theme)), [dispatch]),
    setGlobalLoading: useCallback((loading: boolean) => dispatch(uiActions.setGlobalLoading(loading)), [dispatch]),
    setComponentLoading: useCallback((data: { component: string; loading: boolean }) => 
      dispatch(uiActions.setComponentLoading(data)), [dispatch]),
    openModal: useCallback((modalId: string) => dispatch(uiActions.openModal(modalId)), [dispatch]),
    closeModal: useCallback((modalId: string) => dispatch(uiActions.closeModal(modalId)), [dispatch]),
    setFilter: useCallback((data: { key: string; value: any }) => 
      dispatch(uiActions.setFilter(data)), [dispatch]),
    clearFilter: useCallback((key: string) => dispatch(uiActions.clearFilter(key)), [dispatch]),
    clearAllFilters: useCallback(() => dispatch(uiActions.clearAllFilters()), [dispatch])
  }
}

export const useUI = () => {
  const ui = useAppSelector(state => state.ui)
  const actions = useUIActions()
  
  return {
    ...ui,
    ...actions
  }
}

// ============================================================================
// COMBINED HOOKS
// ============================================================================

export const useApp = () => {
  const auth = useAuth()
  const projects = useProjects()
  const dataSources = useDataSources()
  const reconciliationRecords = useReconciliationRecords()
  const reconciliationMatches = useReconciliationMatches()
  const reconciliationJobs = useReconciliationJobs()
  const notifications = useNotifications()
  const ui = useUI()

  return {
    auth,
    projects,
    dataSources,
    reconciliationRecords,
    reconciliationMatches,
    reconciliationJobs,
    notifications,
    ui
  }
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useLoading = (component?: string) => {
  const globalLoading = useAppSelector(state => state.ui.loading.global)
  const componentLoading = useAppSelector(state => 
    component ? state.ui.loading.components[component] || false : false
  )
  
  return component ? componentLoading : globalLoading
}

export const useModal = (modalId: string) => {
  const isOpen = useAppSelector(state => state.ui.modals[modalId] || false)
  const { openModal, closeModal } = useUIActions()
  
  return {
    isOpen,
    open: () => openModal(modalId),
    close: () => closeModal(modalId)
  }
}

export const useFilter = (key: string) => {
  const value = useAppSelector(state => state.ui.filters[key])
  const { setFilter, clearFilter } = useUIActions()
  
  return {
    value,
    set: (newValue: any) => setFilter({ key, value: newValue }),
    clear: () => clearFilter(key)
  }
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

export const useNotificationHelpers = () => {
  const { addNotification } = useNotificationsActions()
  
  return {
    showSuccess: useCallback((title: string, message: string, action?: { label: string; url: string }) => {
      addNotification({
        type: 'success',
        title,
        message,
        action
      })
    }, [addNotification]),
    
    showError: useCallback((title: string, message: string, action?: { label: string; url: string }) => {
      addNotification({
        type: 'error',
        title,
        message,
        action
      })
    }, [addNotification]),
    
    showWarning: useCallback((title: string, message: string, action?: { label: string; url: string }) => {
      addNotification({
        type: 'warning',
        title,
        message,
        action
      })
    }, [addNotification]),
    
    showInfo: useCallback((title: string, message: string, action?: { label: string; url: string }) => {
      addNotification({
        type: 'info',
        title,
        message,
        action
      })
    }, [addNotification])
  }
}