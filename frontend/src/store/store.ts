import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  last_login: string
  created_at: string
  permissions: string[]
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
  settings?: any
}

export interface DataSource {
  id: string
  project_id: string
  name: string
  source_type: string
  status: 'pending' | 'processing' | 'processed' | 'error'
  file_path?: string
  created_at: string
  processed_at?: string
  metadata?: any
}

export interface ReconciliationRecord {
  id: string
  project_id: string
  data_source_id: string
  record_data: any
  status: 'pending' | 'matched' | 'unmatched' | 'reviewed'
  created_at: string
  updated_at: string
}

export interface ReconciliationMatch {
  id: string
  project_id: string
  record_a_id: string
  record_b_id: string
  confidence_score: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface ReconciliationJob {
  id: string
  project_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  settings: any
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  action?: {
    label: string
    url: string
  }
}

export interface AppState {
  // Authentication
  auth: {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
  }
  
  // Projects
  projects: {
    items: Project[]
    isLoading: boolean
    error: string | null
    pagination: {
      page: number
      per_page: number
      total: number
      total_pages: number
    }
  }
  
  // Data Sources
  dataSources: {
    items: DataSource[]
    isLoading: boolean
    error: string | null
    uploadProgress: Record<string, number>
  }
  
  // Reconciliation Records
  reconciliationRecords: {
    items: ReconciliationRecord[]
    isLoading: boolean
    error: string | null
    pagination: {
      page: number
      per_page: number
      total: number
      total_pages: number
    }
  }
  
  // Reconciliation Matches
  reconciliationMatches: {
    items: ReconciliationMatch[]
    isLoading: boolean
    error: string | null
    pagination: {
      page: number
      per_page: number
      total: number
      total_pages: number
    }
  }
  
  // Reconciliation Jobs
  reconciliationJobs: {
    items: ReconciliationJob[]
    isLoading: boolean
    error: string | null
  }
  
  // Notifications
  notifications: {
    items: Notification[]
    unreadCount: number
  }
  
  // UI State
  ui: {
    sidebarOpen: boolean
    theme: 'light' | 'dark'
    loading: {
      global: boolean
      components: Record<string, boolean>
    }
    modals: Record<string, boolean>
    filters: Record<string, any>
  }
}

// ============================================================================
// AUTH SLICE
// ============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  } as AppState['auth'],
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.isLoading = false
      state.error = null
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = null
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

// ============================================================================
// PROJECTS SLICE
// ============================================================================

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      per_page: 10,
      total: 0,
      total_pages: 0
    }
  } as AppState['projects'],
  reducers: {
    fetchProjectsStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchProjectsSuccess: (state, action: PayloadAction<{
      projects: Project[]
      pagination: AppState['projects']['pagination']
    }>) => {
      state.items = action.payload.projects
      state.pagination = action.payload.pagination
      state.isLoading = false
      state.error = null
    },
    fetchProjectsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    createProject: (state, action: PayloadAction<Project>) => {
      state.items.unshift(action.payload)
      state.pagination.total += 1
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.items.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    deleteProject: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(p => p.id !== action.payload)
      state.pagination.total -= 1
    }
  }
})

// ============================================================================
// DATA SOURCES SLICE
// ============================================================================

const dataSourcesSlice = createSlice({
  name: 'dataSources',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
    uploadProgress: {}
  } as AppState['dataSources'],
  reducers: {
    fetchDataSourcesStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchDataSourcesSuccess: (state, action: PayloadAction<DataSource[]>) => {
      state.items = action.payload
      state.isLoading = false
      state.error = null
    },
    fetchDataSourcesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    uploadFileStart: (state, action: PayloadAction<{ fileId: string; fileName: string }>) => {
      state.uploadProgress[action.payload.fileId] = 0
    },
    uploadFileProgress: (state, action: PayloadAction<{ fileId: string; progress: number }>) => {
      state.uploadProgress[action.payload.fileId] = action.payload.progress
    },
    uploadFileSuccess: (state, action: PayloadAction<DataSource>) => {
      state.items.unshift(action.payload)
      delete state.uploadProgress[action.payload.id]
    },
    uploadFileFailure: (state, action: PayloadAction<{ fileId: string; error: string }>) => {
      delete state.uploadProgress[action.payload.fileId]
      state.error = action.payload.error
    },
    processFileStart: (state, action: PayloadAction<string>) => {
      const dataSource = state.items.find(ds => ds.id === action.payload)
      if (dataSource) {
        dataSource.status = 'processing'
      }
    },
    processFileSuccess: (state, action: PayloadAction<DataSource>) => {
      const index = state.items.findIndex(ds => ds.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    processFileFailure: (state, action: PayloadAction<{ dataSourceId: string; error: string }>) => {
      const dataSource = state.items.find(ds => ds.id === action.payload.dataSourceId)
      if (dataSource) {
        dataSource.status = 'error'
      }
      state.error = action.payload.error
    }
  }
})

// ============================================================================
// RECONCILIATION RECORDS SLICE
// ============================================================================

const reconciliationRecordsSlice = createSlice({
  name: 'reconciliationRecords',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      per_page: 10,
      total: 0,
      total_pages: 0
    }
  } as AppState['reconciliationRecords'],
  reducers: {
    fetchRecordsStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchRecordsSuccess: (state, action: PayloadAction<{
      records: ReconciliationRecord[]
      pagination: AppState['reconciliationRecords']['pagination']
    }>) => {
      state.items = action.payload.records
      state.pagination = action.payload.pagination
      state.isLoading = false
      state.error = null
    },
    fetchRecordsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    updateRecord: (state, action: PayloadAction<ReconciliationRecord>) => {
      const index = state.items.findIndex(r => r.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    }
  }
})

// ============================================================================
// RECONCILIATION MATCHES SLICE
// ============================================================================

const reconciliationMatchesSlice = createSlice({
  name: 'reconciliationMatches',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      per_page: 10,
      total: 0,
      total_pages: 0
    }
  } as AppState['reconciliationMatches'],
  reducers: {
    fetchMatchesStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchMatchesSuccess: (state, action: PayloadAction<{
      matches: ReconciliationMatch[]
      pagination: AppState['reconciliationMatches']['pagination']
    }>) => {
      state.items = action.payload.matches
      state.pagination = action.payload.pagination
      state.isLoading = false
      state.error = null
    },
    fetchMatchesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    createMatch: (state, action: PayloadAction<ReconciliationMatch>) => {
      state.items.unshift(action.payload)
      state.pagination.total += 1
    },
    updateMatch: (state, action: PayloadAction<ReconciliationMatch>) => {
      const index = state.items.findIndex(m => m.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    approveMatch: (state, action: PayloadAction<string>) => {
      const match = state.items.find(m => m.id === action.payload)
      if (match) {
        match.status = 'approved'
        match.reviewed_at = new Date().toISOString()
      }
    },
    rejectMatch: (state, action: PayloadAction<string>) => {
      const match = state.items.find(m => m.id === action.payload)
      if (match) {
        match.status = 'rejected'
        match.reviewed_at = new Date().toISOString()
      }
    }
  }
})

// ============================================================================
// RECONCILIATION JOBS SLICE
// ============================================================================

const reconciliationJobsSlice = createSlice({
  name: 'reconciliationJobs',
  initialState: {
    items: [],
    isLoading: false,
    error: null
  } as AppState['reconciliationJobs'],
  reducers: {
    fetchJobsStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchJobsSuccess: (state, action: PayloadAction<ReconciliationJob[]>) => {
      state.items = action.payload
      state.isLoading = false
      state.error = null
    },
    fetchJobsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    createJob: (state, action: PayloadAction<ReconciliationJob>) => {
      state.items.unshift(action.payload)
    },
    updateJob: (state, action: PayloadAction<ReconciliationJob>) => {
      const index = state.items.findIndex(j => j.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    },
    startJob: (state, action: PayloadAction<string>) => {
      const job = state.items.find(j => j.id === action.payload)
      if (job) {
        job.status = 'running'
        job.started_at = new Date().toISOString()
      }
    },
    completeJob: (state, action: PayloadAction<string>) => {
      const job = state.items.find(j => j.id === action.payload)
      if (job) {
        job.status = 'completed'
        job.progress = 100
        job.completed_at = new Date().toISOString()
      }
    },
    failJob: (state, action: PayloadAction<{ jobId: string; error: string }>) => {
      const job = state.items.find(j => j.id === action.payload.jobId)
      if (job) {
        job.status = 'failed'
        job.error_message = action.payload.error
      }
    }
  }
})

// ============================================================================
// NOTIFICATIONS SLICE
// ============================================================================

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0
  } as AppState['notifications'],
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false
      }
      state.items.unshift(notification)
      state.unreadCount += 1
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount -= 1
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(notification => {
        if (!notification.read) {
          notification.read = true
        }
      })
      state.unreadCount = 0
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        state.unreadCount -= 1
      }
      state.items = state.items.filter(n => n.id !== action.payload)
    },
    clearAllNotifications: (state) => {
      state.items = []
      state.unreadCount = 0
    }
  }
})

// ============================================================================
// UI SLICE
// ============================================================================

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    theme: 'light' as const,
    loading: {
      global: false,
      components: {}
    },
    modals: {},
    filters: {}
  } as AppState['ui'],
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload
    },
    setComponentLoading: (state, action: PayloadAction<{ component: string; loading: boolean }>) => {
      state.loading.components[action.payload.component] = action.payload.loading
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false
    },
    setFilter: (state, action: PayloadAction<{ key: string; value: any }>) => {
      state.filters[action.payload.key] = action.payload.value
    },
    clearFilter: (state, action: PayloadAction<string>) => {
      delete state.filters[action.payload]
    },
    clearAllFilters: (state) => {
      state.filters = {}
    }
  }
})

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    projects: projectsSlice.reducer,
    dataSources: dataSourcesSlice.reducer,
    reconciliationRecords: reconciliationRecordsSlice.reducer,
    reconciliationMatches: reconciliationMatchesSlice.reducer,
    reconciliationJobs: reconciliationJobsSlice.reducer,
    notifications: notificationsSlice.reducer,
    ui: uiSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
})

// ============================================================================
// EXPORT ACTIONS
// ============================================================================

export const authActions = authSlice.actions
export const projectsActions = projectsSlice.actions
export const dataSourcesActions = dataSourcesSlice.actions
export const reconciliationRecordsActions = reconciliationRecordsSlice.actions
export const reconciliationMatchesActions = reconciliationMatchesSlice.actions
export const reconciliationJobsActions = reconciliationJobsSlice.actions
export const notificationsActions = notificationsSlice.actions
export const uiActions = uiSlice.actions

// ============================================================================
// TYPED HOOKS
// ============================================================================

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// ============================================================================
// SELECTORS
// ============================================================================

export const selectAuth = (state: RootState) => state.auth
export const selectUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated

export const selectProjects = (state: RootState) => state.projects
export const selectProjectsList = (state: RootState) => state.projects.items

export const selectDataSources = (state: RootState) => state.dataSources
export const selectDataSourcesList = (state: RootState) => state.dataSources.items

export const selectReconciliationRecords = (state: RootState) => state.reconciliationRecords
export const selectReconciliationMatches = (state: RootState) => state.reconciliationMatches
export const selectReconciliationJobs = (state: RootState) => state.reconciliationJobs

export const selectNotifications = (state: RootState) => state.notifications
export const selectUnreadNotifications = (state: RootState) => state.notifications.unreadCount

export const selectUI = (state: RootState) => state.ui
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen
export const selectTheme = (state: RootState) => state.ui.theme
export const selectGlobalLoading = (state: RootState) => state.ui.loading.global
export const selectComponentLoading = (component: string) => (state: RootState) => 
  state.ui.loading.components[component] || false
export const selectModalOpen = (modal: string) => (state: RootState) => 
  state.ui.modals[modal] || false
export const selectFilter = (key: string) => (state: RootState) => 
  state.ui.filters[key]

// ============================================================================
// THUNKS (Async Actions)
// ============================================================================

import { createAsyncThunk } from '@reduxjs/toolkit'

// Example thunk for fetching projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params: { page?: number; per_page?: number; search?: string } = {}) => {
    // This would be replaced with actual API calls
    const response = await fetch('/api/projects', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects')
    }
    
    return response.json()
  }
)

// Example thunk for creating a project
export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(projectData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create project')
    }
    
    return response.json()
  }
)

export default store