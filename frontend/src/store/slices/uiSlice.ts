// ============================================================================
// UI SLICE
// ============================================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UIState } from '../types';
import type { Notification as BackendNotification } from '../../types/backend-aligned';

const initialUIState: UIState = {
  sidebarOpen: true,
  theme: 'system',
  notifications: [],
  modals: {
    createProject: false,
    exportData: false,
    settings: false,
    deleteConfirmation: false,
    batchOperation: false,
  },
  loadingStates: {
    global: false,
    projects: false,
    reconciliation: false,
    ingestion: false,
    analytics: false,
  },
  errors: [],
  breadcrumbs: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<BackendNotification>) => {
      state.notifications.unshift(action.payload);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
    setLoadingState: (
      state,
      action: PayloadAction<{ key: keyof UIState['loadingStates']; loading: boolean }>
    ) => {
      state.loadingStates[action.payload.key] = action.payload.loading;
    },
    addError: (
      state,
      action: PayloadAction<{
        message: string;
        timestamp: string;
        id?: string;
        dismissed?: boolean;
      }>
    ) => {
      state.errors.push(action.payload);
    },
    dismissError: (state, action: PayloadAction<string>) => {
      const error = state.errors.find((e) => (e as { id?: string }).id === action.payload);
      if (error) {
        (error as { dismissed?: boolean }).dismissed = true;
      }
    },
    removeError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter((e) => (e as { id?: string }).id !== action.payload);
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path: string }>>) => {
      state.breadcrumbs = action.payload;
    },
  },
});

export const notificationsActions = uiSlice.actions; // Alias for compatibility
export const uiActions = uiSlice.actions;
export default uiSlice.reducer;

