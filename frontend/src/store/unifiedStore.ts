// ============================================================================
// UNIFIED STATE MANAGEMENT - SINGLE SOURCE OF TRUTH
// ============================================================================

import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
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
  createGetThunk,
  createPostThunk,
  createPutThunk,
  createDeleteThunk,
  createFileUploadThunk,
  createPaginatedListThunk,
} from './asyncThunkUtils';
import type { User } from '../types/backend-aligned';
import type { Project } from '../types/backend-aligned';
import type { UploadedFile } from '../types/backend-aligned';
import type { ReconciliationRecord } from '../types/index';
import type { ReconciliationJob } from '../types/backend-aligned';
import type { DashboardData } from '../types/backend-aligned';
import type { Notification } from '../types/backend-aligned';

// ============================================================================
// UNIFIED STATE INTERFACES
// ============================================================================

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLogin: string | null;
  sessionExpiry: string | null;
}

export interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchQuery: string;
  filterStatus: string | null;
}

export interface DataIngestionState {
  uploadedFiles: UploadedFile[];
  processedData: ReconciliationRecord[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
}

export interface ReconciliationState {
  records: ReconciliationRecord[];
  jobs: ReconciliationJob[];
  config: {
    matchingRules: string[];
    tolerance: number;
    autoMatch: boolean;
    priority: 'high' | 'medium' | 'low';
    batchSize: number;
    timeout: number;
  };
  stats: {
    total: number;
    matched: number;
    unmatched: number;
    discrepancy: number;
    pending: number;
    processingTime: number;
    lastUpdated: string;
  };
  isLoading: boolean;
  error: string | null;
  matchingProgress: number;
  matchingResults: Record<string, unknown> | null;
}

export interface AnalyticsState {
  dashboardData: DashboardData | null;
  reports: Array<Record<string, unknown>>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  modals: {
    createProject: boolean;
    exportData: boolean;
    settings: boolean;
    deleteConfirmation: boolean;
    batchOperation: boolean;
  };
  loadingStates: {
    global: boolean;
    projects: boolean;
    reconciliation: boolean;
    ingestion: boolean;
    analytics: boolean;
  };
  errors: Array<{ message: string; timestamp: string }>;
  breadcrumbs: Array<{ label: string; path: string }>;
}

export interface AppState {
  auth: AuthState;
  projects: ProjectsState;
  dataIngestion: DataIngestionState;
  reconciliation: ReconciliationState;
  analytics: AnalyticsState;
  ui: UIState;
}

// ============================================================================
// INITIAL STATES
// ============================================================================

const initialAuthState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastLogin: null,
  sessionExpiry: null,
};

const initialProjectsState: ProjectsState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  searchQuery: '',
  filterStatus: null,
};

const initialDataIngestionState: DataIngestionState = {
  uploadedFiles: [],
  processedData: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,
};

const initialReconciliationState: ReconciliationState = {
  records: [],
  jobs: [],
  config: {
    matchingRules: ['amount', 'date', 'description'],
    tolerance: 0.01,
    autoMatch: true,
    priority: 'high',
    batchSize: 100,
    timeout: 30000,
  },
  stats: {
    total: 0,
    matched: 0,
    unmatched: 0,
    discrepancy: 0,
    pending: 0,
    processingTime: 0,
    lastUpdated: new Date().toISOString(),
  },
  isLoading: false,
  error: null,
  matchingProgress: 0,
  matchingResults: null,
};

const initialAnalyticsState: AnalyticsState = {
  dashboardData: null,
  reports: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

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

// ============================================================================
// AUTH SLICE - UNIFIED
// ============================================================================

export const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.lastLogin = action.payload ? new Date().toISOString() : null;
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken?: string }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || state.refreshToken;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.lastLogin = null;
      state.sessionExpiry = null;
    },
    setSessionExpiry: (state, action: PayloadAction<string>) => {
      state.sessionExpiry = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        state.lastLogin = new Date().toISOString();
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        state.lastLogin = new Date().toISOString();
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

// ============================================================================
// PROJECTS SLICE - UNIFIED
// ============================================================================

export const projectsSlice = createSlice({
  name: 'projects',
  initialState: initialProjectsState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<Project | null>) => {
      state.selectedProject = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<string | null>) => {
      state.filterStatus = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.data || action.payload.projects || [];
        state.pagination =
          action.payload.metadata?.pagination || action.payload.pagination || state.pagination;
        state.error = null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Project
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
        state.pagination.total += 1;
      })
      // Update Project
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      // Delete Project
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p.id !== action.payload);
        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }
        state.pagination.total -= 1;
      });
  },
});

// ============================================================================
// DATA INGESTION SLICE - UNIFIED
// ============================================================================

export const dataIngestionSlice = createSlice({
  name: 'dataIngestion',
  initialState: initialDataIngestionState,
  reducers: {
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Upload File
    builder
      .addCase(uploadFile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.uploadedFiles.unshift(action.payload);
        state.uploadProgress = 100;
        state.error = null;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.uploadProgress = 0;
      })
      // Fetch Files
      .addCase(fetchUploadedFiles.fulfilled, (state, action) => {
        state.uploadedFiles = action.payload;
      });
  },
});

// ============================================================================
// RECONCILIATION SLICE - UNIFIED
// ============================================================================

export const reconciliationSlice = createSlice({
  name: 'reconciliation',
  initialState: initialReconciliationState,
  reducers: {
    setConfig: (state, action: PayloadAction<Partial<ReconciliationState['config']>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    setMatchingProgress: (state, action: PayloadAction<number>) => {
      state.matchingProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Job management actions
    setJobs: (state, action: PayloadAction<ReconciliationJob[]>) => {
      state.jobs = action.payload;
    },
    addJob: (state, action: PayloadAction<ReconciliationJob>) => {
      state.jobs.push(action.payload);
    },
    updateJob: (state, action: PayloadAction<ReconciliationJob>) => {
      const index = state.jobs.findIndex((j) => j.id === action.payload.id);
      if (index !== -1) {
        state.jobs[index] = action.payload;
      }
    },
    completeJob: (state, action: PayloadAction<string>) => {
      const job = state.jobs.find((j) => j.id === action.payload);
      if (job) {
        job.status = 'completed';
        job.progress = 100;
        job.completed_at = new Date().toISOString();
      }
    },
    failJob: (state, action: PayloadAction<{ jobId: string; error: string }>) => {
      const job = state.jobs.find((j) => j.id === action.payload.jobId);
      if (job) {
        job.status = 'failed';
        job.error_message = action.payload.error;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Records
    builder
      .addCase(fetchReconciliationRecords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReconciliationRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload.data || action.payload.records || [];
        state.error = null;
      })
      .addCase(fetchReconciliationRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Run Matching
      .addCase(runMatching.pending, (state) => {
        state.isLoading = true;
        state.matchingProgress = 0;
        state.error = null;
      })
      .addCase(runMatching.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matchingProgress = 100;
        state.matchingResults = action.payload;
        state.error = null;
      })
      .addCase(runMatching.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.matchingProgress = 0;
      });
  },
});

// ============================================================================
// ANALYTICS SLICE - UNIFIED
// ============================================================================

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: initialAnalyticsState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Dashboard Data
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardData = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================================================
// UI SLICE - UNIFIED
// ============================================================================

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
    addNotification: (state, action: PayloadAction<Notification>) => {
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
    addError: (state, action: PayloadAction<{ message: string; timestamp: string }>) => {
      state.errors.push(action.payload);
    },
    dismissError: (state, action: PayloadAction<string>) => {
      const error = state.errors.find((e) => e.id === action.payload);
      if (error) {
        error.dismissed = true;
      }
    },
    removeError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter((e) => e.id !== action.payload);
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path: string }>>) => {
      state.breadcrumbs = action.payload;
    },
  },
});

// ============================================================================
// ROOT REDUCER
// ============================================================================

export const rootReducer = combineReducers({
  auth: authSlice.reducer,
  projects: projectsSlice.reducer,
  dataIngestion: dataIngestionSlice.reducer,
  reconciliation: reconciliationSlice.reducer,
  analytics: analyticsSlice.reducer,
  ui: uiSlice.reducer,
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
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// ============================================================================
// EXPORTS
// ============================================================================

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Action creators
export const {
  setUser,
  setTokens,
  setLoading: setAuthLoading,
  setError: setAuthError,
  clearError: clearAuthError,
  logout,
  setSessionExpiry,
} = authSlice.actions;

export const {
  setSelectedProject,
  setSearchQuery,
  setFilterStatus,
  setLoading: setProjectsLoading,
  setError: setProjectsError,
  clearError: clearProjectsError,
} = projectsSlice.actions;

export const { setUploadProgress, clearError: clearDataIngestionError } =
  dataIngestionSlice.actions;

export const {
  setConfig,
  setMatchingProgress,
  clearError: clearReconciliationError,
} = reconciliationSlice.actions;

export const { setLoading: setAnalyticsLoading, setError: setAnalyticsError } =
  analyticsSlice.actions;

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
} = uiSlice.actions;

// Async thunks
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

// Action objects for compatibility with existing hooks
export const authActions = authSlice.actions;
export const projectsActions = projectsSlice.actions;
export const dataSourcesActions = dataIngestionSlice.actions; // Note: renamed from dataSources to dataIngestion
export const reconciliationRecordsActions = reconciliationSlice.actions; // Note: unified reconciliation slice
export const reconciliationMatchesActions = reconciliationSlice.actions; // Note: unified reconciliation slice
export const reconciliationJobsActions = reconciliationSlice.actions; // Note: unified reconciliation slice
export const notificationsActions = uiSlice.actions; // Note: notifications are in ui slice
export const uiActions = uiSlice.actions;

// Type exports for compatibility
export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: Record<string, boolean>;
  preferences?: Record<string, unknown>;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  type?: string;
  ownerId?: string;
  settings?: Record<string, unknown>;
  data?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DataSource {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  sourceType: string;
  connectionConfig?: Record<string, unknown>;
  filePath?: string;
  fileSize?: number;
  fileHash?: string;
  recordCount?: number;
  schema?: Record<string, unknown>;
  status: string;
  uploadedAt?: string;
  processedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationRecord {
  id: string;
  projectId: string;
  ingestionJobId: string;
  externalId?: string;
  status: string;
  amount?: number;
  transactionDate?: string;
  description?: string;
  sourceData: string;
  matchingResults: string;
  confidence?: number;
  auditTrail: string;
  createdAt: string;
}

export interface ReconciliationMatch {
  id: string;
  projectId: string;
  recordAId: string;
  recordBId?: string;
  matchType: string;
  confidenceScore?: number;
  status: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationJob {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  settings?: Record<string, unknown>;
  confidenceThreshold?: number;
  progress?: number;
  totalRecords?: number;
  processedRecords?: number;
  matchedRecords?: number;
  unmatchedRecords?: number;
}
export type Notification = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actions?: Array<{ label: string; action: () => void; type: 'primary' | 'secondary' }>;
};

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectProjects = (state: RootState) => state.projects;
export const selectDataIngestion = (state: RootState) => state.dataIngestion;
export const selectReconciliation = (state: RootState) => state.reconciliation;
export const selectAnalytics = (state: RootState) => state.analytics;
export const selectUI = (state: RootState) => state.ui;

export default store;
