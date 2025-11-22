// ============================================================================
// UNIFIED STATE MANAGEMENT - SINGLE SOURCE OF TRUTH
// ============================================================================

import { configureStore } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { PayloadAction } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
// Removed redux-persist for now - not in dependencies
// import { persistStore, persistReducer } from 'redux-persist'
// import storage from 'redux-persist/lib/storage'
import { apiClient } from '../services/apiClient';
import type {
  BackendUser,
  BackendProject,
  BackendReconciliationJob,
  BackendReconciliationRecord,
} from '../services/apiClient/types';
import { getErrorMessageFromApiError } from '../utils/errorExtraction';

// Removed unused type imports

// ============================================================================
// UNIFIED STATE INTERFACES
// ============================================================================

export interface AppState {
  auth: AuthState;
  projects: ProjectsState;
  reconciliation: ReconciliationState;
  ingestion: IngestionState;
  ui: UIState;
  analytics: AnalyticsState;
  settings: SettingsState;
}

export interface AuthState {
  user: BackendUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLogin: string | null;
  sessionExpiry: string | null;
}

export interface ProjectsState {
  projects: BackendProject[];
  selectedProject: BackendProject | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  searchQuery: string;
  filterStatus: string | null;
}

export interface ReconciliationState {
  records: BackendReconciliationRecord[];
  config: ReconciliationConfig;
  stats: ReconciliationStats;
  isLoading: boolean;
  error: string | null;
  lastProcessed: string | null;
  batchOperations: BatchOperation[];
}

export interface IngestionState {
  jobs: BackendReconciliationJob[];
  currentJob: BackendReconciliationJob | null;
  uploadedFiles: UploadedFile[];
  isLoading: boolean;
  error: string | null;
  lastUpload: string | null;
}

export interface AnalyticsState {
  dashboardData: DashboardData | null;
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Notification[];
  modals: ModalState;
  loadingStates: LoadingStates;
  errors: ErrorState[];
  breadcrumbs: Breadcrumb[];
}

export interface SettingsState {
  preferences: UserPreferences;
  notifications: NotificationSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface ReconciliationConfig {
  matchingRules: string[];
  tolerance: number;
  autoMatch: boolean;
  priority: 'high' | 'medium' | 'low';
  batchSize: number;
  timeout: number;
}

export interface ReconciliationStats {
  total: number;
  matched: number;
  unmatched: number;
  discrepancy: number;
  pending: number;
  processingTime: number;
  lastUpdated: string;
}

export interface BatchOperation {
  id: string;
  type: 'match' | 'unmatch' | 'resolve' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recordIds: string[];
  progress: number;
  createdAt: string;
  completedAt?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  uploadedAt: string;
  processedAt?: string;
}

export interface DashboardData {
  overview: {
    totalProjects: number;
    activeReconciliations: number;
    pendingDiscrepancies: number;
    matchRate: number;
  };
  charts: {
    reconciliationTrends: Array<Record<string, unknown>>;
    projectPerformance: Array<Record<string, unknown>>;
    errorRates: Array<Record<string, unknown>>;
  };
  recentActivity: ActivityItem[];
}

export interface Report {
  id: string;
  name: string;
  type: 'reconciliation' | 'discrepancy' | 'performance';
  status: 'generating' | 'completed' | 'failed';
  generatedAt: string;
  downloadUrl?: string;
}

export interface ActivityItem {
  id: string;
  type: 'project_created' | 'reconciliation_completed' | 'discrepancy_resolved';
  message: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  type: 'primary' | 'secondary';
}

export interface ModalState {
  createProject: boolean;
  exportData: boolean;
  settings: boolean;
  deleteConfirmation: boolean;
  batchOperation: boolean;
}

export interface LoadingStates {
  global: boolean;
  projects: boolean;
  reconciliation: boolean;
  ingestion: boolean;
  analytics: boolean;
}

export interface ErrorState {
  id: string;
  type: 'network' | 'validation' | 'permission' | 'system';
  message: string;
  timestamp: string;
  dismissed: boolean;
  retryable: boolean;
}

export interface Breadcrumb {
  label: string;
  path: string;
  active: boolean;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  autoSave: boolean;
  darkMode: boolean;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  reconciliationComplete: boolean;
  discrepancyFound: boolean;
  systemMaintenance: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  loginNotifications: boolean;
}

export interface IntegrationSettings {
  webhooks: WebhookConfig[];
  apiKeys: ApiKeyConfig[];
  dataSources: DataSourceConfig[];
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
}

export interface ApiKeyConfig {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  expiresAt?: string;
}

export interface DataSourceConfig {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file';
  connectionString?: string;
  credentials?: Record<string, unknown>;
  active: boolean;
}

// ============================================================================
// INITIAL STATES
// ============================================================================

const initialAuthState: AuthState = {
  user: null,
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
  lastFetched: null,
  searchQuery: '',
  filterStatus: null,
};

const initialReconciliationState: ReconciliationState = {
  records: [],
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
  lastProcessed: null,
  batchOperations: [],
};

const initialIngestionState: IngestionState = {
  jobs: [],
  currentJob: null,
  uploadedFiles: [],
  isLoading: false,
  error: null,
  lastUpload: null,
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

const initialSettingsState: SettingsState = {
  preferences: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
    autoSave: true,
    darkMode: false,
  },
  notifications: {
    email: true,
    push: true,
    inApp: true,
    reconciliationComplete: true,
    discrepancyFound: true,
    systemMaintenance: false,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 3600,
    passwordExpiry: 90,
    loginNotifications: true,
  },
  integrations: {
    webhooks: [],
    apiKeys: [],
    dataSources: [],
  },
};

// ============================================================================
// AUTH SLICE
// ============================================================================

export const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setUser: (state, action: PayloadAction<BackendUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.lastLogin = action.payload ? new Date().toISOString() : null;
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
      state.isAuthenticated = false;
      state.error = null;
      state.lastLogin = null;
      state.sessionExpiry = null;
    },
    setSessionExpiry: (state, action: PayloadAction<string>) => {
      state.sessionExpiry = action.payload;
    },
  },
});

// ============================================================================
// PROJECTS SLICE
// ============================================================================

export const projectsSlice = createSlice({
  name: 'projects',
  initialState: initialProjectsState,
  reducers: {
    setProjects: (state, action: PayloadAction<BackendProject[]>) => {
      state.projects = action.payload;
      state.lastFetched = new Date().toISOString();
    },
    addProject: (state, action: PayloadAction<BackendProject>) => {
      state.projects.push(action.payload);
    },
    updateProject: (state, action: PayloadAction<BackendProject>) => {
      const index = state.projects.findIndex((p: BackendProject) => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter((p: BackendProject) => p.id !== action.payload);
      if (state.selectedProject?.id === action.payload) {
        state.selectedProject = null;
      }
    },
    setSelectedProject: (state, action: PayloadAction<BackendProject | null>) => {
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
  },
});

// ============================================================================
// RECONCILIATION SLICE
// ============================================================================

export const reconciliationSlice = createSlice({
  name: 'reconciliation',
  initialState: initialReconciliationState,
  reducers: {
    setRecords: (state, action: PayloadAction<BackendReconciliationRecord[]>) => {
      state.records = action.payload;
      state.stats = {
        total: action.payload.length,
        matched: 0, // BackendReconciliationRecord doesn't have status
        unmatched: 0,
        discrepancy: 0,
        pending: 0,
        processingTime: state.stats.processingTime,
        lastUpdated: new Date().toISOString(),
      };
    },
    updateRecord: (state, action: PayloadAction<BackendReconciliationRecord>) => {
      const index = state.records.findIndex(
        (r: BackendReconciliationRecord) => r.id === action.payload.id
      );
      if (index !== -1) {
        state.records[index] = action.payload;
        // Update stats - BackendReconciliationRecord doesn't have status
        state.stats = {
          total: state.records.length,
          matched: 0,
          unmatched: 0,
          discrepancy: 0,
          pending: 0,
          processingTime: state.stats.processingTime,
          lastUpdated: new Date().toISOString(),
        };
      }
    },
    setConfig: (state, action: PayloadAction<Partial<ReconciliationConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    addBatchOperation: (state, action: PayloadAction<BatchOperation>) => {
      state.batchOperations.push(action.payload);
    },
    updateBatchOperation: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<BatchOperation> }>
    ) => {
      const index = state.batchOperations.findIndex((op) => op.id === action.payload.id);
      if (index !== -1) {
        state.batchOperations[index] = {
          ...state.batchOperations[index],
          ...action.payload.updates,
        };
      }
    },
    removeBatchOperation: (state, action: PayloadAction<string>) => {
      state.batchOperations = state.batchOperations.filter((op) => op.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// ============================================================================
// INGESTION SLICE
// ============================================================================

export const ingestionSlice = createSlice({
  name: 'ingestion',
  initialState: initialIngestionState,
  reducers: {
    setJobs: (state, action: PayloadAction<BackendReconciliationJob[]>) => {
      state.jobs = action.payload;
    },
    addJob: (state, action: PayloadAction<BackendReconciliationJob>) => {
      state.jobs.push(action.payload);
    },
    updateJob: (state, action: PayloadAction<BackendReconciliationJob>) => {
      const index = state.jobs.findIndex(
        (j: BackendReconciliationJob) => j.id === action.payload.id
      );
      if (index !== -1) {
        state.jobs[index] = action.payload;
      }
    },
    setCurrentJob: (state, action: PayloadAction<BackendReconciliationJob | null>) => {
      state.currentJob = action.payload;
    },
    addUploadedFile: (state, action: PayloadAction<UploadedFile>) => {
      state.uploadedFiles.push(action.payload);
      state.lastUpload = new Date().toISOString();
    },
    updateUploadedFile: (state, action: PayloadAction<UploadedFile>) => {
      const index = state.uploadedFiles.findIndex((f) => f.id === action.payload.id);
      if (index !== -1) {
        state.uploadedFiles[index] = action.payload;
      }
    },
    removeUploadedFile: (state, action: PayloadAction<string>) => {
      state.uploadedFiles = state.uploadedFiles.filter((f) => f.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// ============================================================================
// ANALYTICS SLICE
// ============================================================================

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: initialAnalyticsState,
  reducers: {
    setDashboardData: (state, action: PayloadAction<DashboardData>) => {
      state.dashboardData = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    addReport: (state, action: PayloadAction<Report>) => {
      state.reports.push(action.payload);
    },
    updateReport: (state, action: PayloadAction<Report>) => {
      const index = state.reports.findIndex((r: Report) => r.id === action.payload.id);
      if (index !== -1) {
        state.reports[index] = action.payload;
      }
    },
    removeReport: (state, action: PayloadAction<string>) => {
      state.reports = state.reports.filter((r: Report) => r.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// ============================================================================
// UI SLICE
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
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>
    ) => {
      const notification: Notification = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false,
      };
      state.notifications.unshift(notification);
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action: PayloadAction<keyof ModalState>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof ModalState>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        state.modals[key as keyof ModalState] = false;
      });
    },
    setLoadingState: (
      state,
      action: PayloadAction<{ key: keyof LoadingStates; loading: boolean }>
    ) => {
      state.loadingStates[action.payload.key] = action.payload.loading;
    },
    addError: (
      state,
      action: PayloadAction<Omit<ErrorState, 'id' | 'timestamp' | 'dismissed'>>
    ) => {
      const error: ErrorState = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        dismissed: false,
      };
      state.errors.push(error);
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
    setBreadcrumbs: (state, action: PayloadAction<Breadcrumb[]>) => {
      state.breadcrumbs = action.payload;
    },
  },
});

// ============================================================================
// SETTINGS SLICE
// ============================================================================

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettingsState,
  reducers: {
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateSecuritySettings: (state, action: PayloadAction<Partial<SecuritySettings>>) => {
      state.security = { ...state.security, ...action.payload };
    },
    addWebhook: (state, action: PayloadAction<WebhookConfig>) => {
      state.integrations.webhooks.push(action.payload);
    },
    updateWebhook: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<WebhookConfig> }>
    ) => {
      const index = state.integrations.webhooks.findIndex((w) => w.id === action.payload.id);
      if (index !== -1) {
        state.integrations.webhooks[index] = {
          ...state.integrations.webhooks[index],
          ...action.payload.updates,
        };
      }
    },
    removeWebhook: (state, action: PayloadAction<string>) => {
      state.integrations.webhooks = state.integrations.webhooks.filter(
        (w) => w.id !== action.payload
      );
    },
    addApiKey: (state, action: PayloadAction<ApiKeyConfig>) => {
      state.integrations.apiKeys.push(action.payload);
    },
    updateApiKey: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ApiKeyConfig> }>
    ) => {
      const index = state.integrations.apiKeys.findIndex((k) => k.id === action.payload.id);
      if (index !== -1) {
        state.integrations.apiKeys[index] = {
          ...state.integrations.apiKeys[index],
          ...action.payload.updates,
        };
      }
    },
    removeApiKey: (state, action: PayloadAction<string>) => {
      state.integrations.apiKeys = state.integrations.apiKeys.filter(
        (k) => k.id !== action.payload
      );
    },
    addDataSource: (state, action: PayloadAction<DataSourceConfig>) => {
      state.integrations.dataSources.push(action.payload);
    },
    updateDataSource: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<DataSourceConfig> }>
    ) => {
      const index = state.integrations.dataSources.findIndex((d) => d.id === action.payload.id);
      if (index !== -1) {
        state.integrations.dataSources[index] = {
          ...state.integrations.dataSources[index],
          ...action.payload.updates,
        };
      }
    },
    removeDataSource: (state, action: PayloadAction<string>) => {
      state.integrations.dataSources = state.integrations.dataSources.filter(
        (d) => d.id !== action.payload
      );
    },
  },
});

// ============================================================================
// ASYNC THUNKS
// ============================================================================

// Auth thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.login(credentials);
      if (response.error) {
        return rejectWithValue(getErrorMessageFromApiError(response.error));
      }
      if (!response.data) {
        return rejectWithValue('No data received from login');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.error) {
        return rejectWithValue(getErrorMessageFromApiError(response.error));
      }
      if (!response.data) {
        return rejectWithValue('No user data received');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get user');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try {
    await apiClient.logout();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
  }
});

// Projects thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getProjects();
      if (response.error) {
        return rejectWithValue(getErrorMessageFromApiError(response.error));
      }
      return response.data?.items || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch projects');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.createProject(projectData);
      if (response.error) {
        return rejectWithValue(getErrorMessageFromApiError(response.error));
      }
      if (!response.data) {
        return rejectWithValue('No project data received');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.deleteProject(projectId);
      if (response.error) {
        return rejectWithValue(getErrorMessageFromApiError(response.error));
      }
      return projectId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete project');
    }
  }
);

// Reconciliation thunks
export const fetchReconciliationRecords = createAsyncThunk(
  'reconciliation/fetchRecords',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.getReconciliationRecords(projectId, 1, 20);
      if (response.error) {
        return rejectWithValue(getErrorMessageFromApiError(response.error));
      }
      return response.data?.items || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch records');
    }
  }
);

// Note: These methods don't exist in the API client yet
// Commented out to prevent compilation errors
/*
export const startReconciliation = createAsyncThunk(
  'reconciliation/start',
  async (config: ReconciliationConfig, { rejectWithValue }) => {
    try {
      const response = await apiClient.startReconciliation(config)
      if (response.error) {
        return rejectWithValue(getErrorMessageFromApiError(response.error))
      }
      return response.data?.records || []
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start reconciliation')
    }
  }
)

export const createManualMatch = createAsyncThunk(
  'reconciliation/createManualMatch',
  async ({ recordId, matchId }: { recordId: string; matchId: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.createManualMatch(recordId, matchId)
      if (response.error) {
        return rejectWithValue(getErrorMessageFromApiError(response.error))
      }
      return { recordId, matchId }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create manual match')
    }
  }
)
*/

// Analytics thunks
export const fetchDashboardData = createAsyncThunk(
  'analytics/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getDashboardData();
      if (response.error) {
        return rejectWithValue(getErrorMessageFromApiError(response.error));
      }
      if (!response.data) {
        return rejectWithValue('No dashboard data received');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch dashboard data'
      );
    }
  }
);

// ============================================================================
// EXPORT ACTIONS
// ============================================================================

export const {
  setUser,
  setLoading: setAuthLoading,
  setError: setAuthError,
  clearError: clearAuthError,
  logout,
  setSessionExpiry,
} = authSlice.actions;

export const {
  setProjects,
  addProject,
  updateProject,
  removeProject,
  setSelectedProject,
  setSearchQuery,
  setFilterStatus,
  setLoading: setProjectsLoading,
  setError: setProjectsError,
} = projectsSlice.actions;

export const {
  setRecords,
  updateRecord,
  setConfig,
  addBatchOperation,
  updateBatchOperation,
  removeBatchOperation,
  setLoading: setReconciliationLoading,
  setError: setReconciliationError,
} = reconciliationSlice.actions;

export const {
  setJobs,
  addJob,
  updateJob,
  setCurrentJob,
  addUploadedFile,
  updateUploadedFile,
  removeUploadedFile,
  setLoading: setIngestionLoading,
  setError: setIngestionError,
} = ingestionSlice.actions;

export const {
  setDashboardData,
  addReport,
  updateReport,
  removeReport,
  setLoading: setAnalyticsLoading,
  setError: setAnalyticsError,
} = analyticsSlice.actions;

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  addNotification,
  markNotificationAsRead,
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

export const {
  updatePreferences,
  updateNotificationSettings,
  updateSecuritySettings,
  addWebhook,
  updateWebhook,
  removeWebhook,
  addApiKey,
  updateApiKey,
  removeApiKey,
  addDataSource,
  updateDataSource,
  removeDataSource,
} = settingsSlice.actions;

// ============================================================================
// EXPORT REDUCERS
// ============================================================================

export const authReducer = authSlice.reducer;
export const projectsReducer = projectsSlice.reducer;
export const reconciliationReducer = reconciliationSlice.reducer;
export const ingestionReducer = ingestionSlice.reducer;
export const analyticsReducer = analyticsSlice.reducer;
export const uiReducer = uiSlice.reducer;
export const settingsReducer = settingsSlice.reducer;

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

export const store = configureStore({
  reducer: combineReducers({
    auth: authSlice.reducer,
    projects: projectsSlice.reducer,
    reconciliation: reconciliationSlice.reducer,
    ingestion: ingestionSlice.reducer,
    analytics: analyticsSlice.reducer,
    ui: uiSlice.reducer,
    settings: settingsSlice.reducer,
  }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
