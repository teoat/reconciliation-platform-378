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
  authReducer, // Keep this import for the rootReducer
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
  setAuthTokens,
  clearAuth,
  set2FARequired,
  setUser2FAStatus,
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  generate2faSecret,
  verify2faCode,
  enable2fa,
  disable2fa,
  generateRecoveryCodes,
} from './slices/authSlice'; // Import directly from authSlice

import {
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
  setAuthTokens,
  clearAuth,
  set2FARequired,
  setUser2FAStatus,
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  generate2faSecret,
  verify2faCode,
  enable2fa,
  disable2fa,
  generateRecoveryCodes,
  projectsActions,
  dataSourcesActions,
  reconciliationRecordsActions,
  reconciliationMatchesActions,
  reconciliationJobsActions,
  notificationsActions,
  uiActions,
  analyticsActions,
};

// Remove individual action exports that are now directly imported or not needed
// For example, this section should be removed as actions are directly imported from slice
// export const {
//   setUser,
//   setTokens,
//   setLoading: setAuthLoading,
//   setError: setAuthError,
//   clearError: clearAuthError,
//   logout,
//   setSessionExpiry,
// } = authActions;

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

// These are now imported directly from authSlice, so remove from here if they were previously exported via asyncThunkUtils
// export {
//   loginUser,
//   registerUser,
//   getCurrentUser,
//   logoutUser,
//   fetchProjects,
//   createProject,
//   updateProject,
//   deleteProject,
//   uploadFile,
//   fetchUploadedFiles,
//   fetchReconciliationRecords,
//   runMatching,
//   fetchDashboardData,
// } from './asyncThunkUtils';

// Re-export other async thunks from asyncThunkUtils if they exist and are still needed
export { getCurrentUser, fetchProjects, createProject, updateProject, deleteProject, uploadFile, fetchUploadedFiles, fetchReconciliationRecords, runMatching, fetchDashboardData } from './asyncThunkUtils';

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
