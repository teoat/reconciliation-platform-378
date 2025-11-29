// ============================================================================
// UNIFIED STATE MANAGEMENT - SINGLE SOURCE OF TRUTH
// ============================================================================
// This file configures and exports the Redux store
// All slices are organized in store/slices/
// All types are organized in store/types/

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import {
  authReducer,
  projectsReducer,
  dataIngestionReducer,
  reconciliationReducer,
  analyticsReducer,
  uiReducer,
} from './slices';

// ============================================================================
// ROOT REDUCER
// ============================================================================

export const rootReducer = combineReducers({
  auth: authReducer,
  projects: projectsReducer,
  dataIngestion: dataIngestionReducer,
  reconciliation: reconciliationReducer,
  analytics: analyticsReducer,
  ui: uiReducer,
});

// ============================================================================
// PERSIST CONFIGURATION
// ============================================================================

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui', 'projects'], // Only persist these slices
  blacklist: ['dataIngestion', 'reconciliation', 'analytics'], // Don't persist these slices
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['_persist'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export const persistor = persistStore(store);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ============================================================================
// ACTION EXPORTS
// ============================================================================

import {
  authActions,
  projectsActions,
  dataSourcesActions,
  reconciliationRecordsActions,
  reconciliationMatchesActions,
  reconciliationJobsActions,
  notificationsActions,
  uiActions,
  analyticsActions,
} from './slices';

// Re-export actions
export {
  authActions,
  projectsActions,
  dataSourcesActions,
  reconciliationRecordsActions,
  reconciliationMatchesActions,
  reconciliationJobsActions,
  notificationsActions,
  uiActions,
  analyticsActions,
};

// Individual action exports for convenience
export const {
  setUser,
  setTokens,
  setLoading: setAuthLoading,
  setError: setAuthError,
  clearError: clearAuthError,
  logout,
  setSessionExpiry,
} = authActions;

export const {
  setSelectedProject,
  setSearchQuery,
  setFilterStatus,
  setLoading: setProjectsLoading,
  setError: setProjectsError,
  clearError: clearProjectsError,
} = projectsActions;

export const { setUploadProgress, clearError: clearDataIngestionError } = dataSourcesActions;

export const {
  setConfig,
  setMatchingProgress,
  clearError: clearReconciliationError,
} = reconciliationRecordsActions;

export const { setLoading: setAnalyticsLoading, setError: setAnalyticsError } = analyticsActions;

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  addNotification,
  removeNotification,
  clearAllNotifications,
  openModal,
  closeModal,
  closeAllModals,
  setLoadingState,
  addError,
  dismissError,
  removeError,
  setBreadcrumbs,
} = uiActions;

// ============================================================================
// ASYNC THUNK EXPORTS
// ============================================================================

export {
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
} from './asyncThunkUtils';

// ============================================================================
// TYPE EXPORTS FOR COMPATIBILITY
// ============================================================================

export type {
  AuthState,
  ProjectsState,
  DataIngestionState,
  ReconciliationState,
  AnalyticsState,
  UIState,
  AppState,
  ReconciliationMatch,
  DataSource,
  User,
  Project,
  ReconciliationJob,
  Notification,
  ReconciliationRecord,
} from './types';

// ============================================================================
// SELECTORS
// ============================================================================

export const selectAuth = (state: RootState) => state.auth;
export const selectProjects = (state: RootState) => state.projects;
export const selectDataIngestion = (state: RootState) => state.dataIngestion;
export const selectReconciliation = (state: RootState) => state.reconciliation;
export const selectAnalytics = (state: RootState) => state.analytics;
export const selectUI = (state: RootState) => state.ui;

export default store;
