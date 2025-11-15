// Consolidated State Management with Redux Toolkit
// Single source of truth for all application state

import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'
import type { User, Project, UploadedFile, ProcessedData, ReconciliationRecord, Notification } from '../types'

// ============================================================================
// AUTHENTICATION SLICE
// ============================================================================

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialAuthState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Login failed')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { email: string; password: string; name: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Registration failed')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
      
      if (!response.ok) {
        return rejectWithValue('Token refresh failed')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.data.user
        state.token = action.payload.data.token
        state.refreshToken = action.payload.data.refreshToken
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.data.user
        state.token = action.payload.data.token
        state.refreshToken = action.payload.data.refreshToken
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.user = action.payload.data.user
        state.token = action.payload.data.token
        state.isAuthenticated = true
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
  }
})

// ============================================================================
// PROJECT SLICE
// ============================================================================

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const initialProjectState: ProjectState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  }
}

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params: { page?: number; limit?: number; status?: string; type?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString())
      })
      
      const response = await fetch(`/api/projects?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to fetch projects')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData: { name: string; description?: string; type?: string; settings?: any }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(projectData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to create project')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }: { id: string; data: Partial<Project> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to update project')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to delete project')
      }
      
      return { id }
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

const projectSlice = createSlice({
  name: 'projects',
  initialState: initialProjectState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false
        state.projects = action.payload.data
        state.pagination = action.payload.metadata.pagination
        state.error = null
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Create Project
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload.data)
        state.pagination.total += 1
      })
      // Update Project
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.data.id)
        if (index !== -1) {
          state.projects[index] = action.payload.data
        }
        if (state.currentProject?.id === action.payload.data.id) {
          state.currentProject = action.payload.data
        }
      })
      // Delete Project
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload.id)
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = null
        }
        state.pagination.total -= 1
      })
  }
})

// ============================================================================
// DATA INGESTION SLICE
// ============================================================================

interface DataIngestionState {
  uploadedFiles: UploadedFile[]
  processedData: ProcessedData[]
  isLoading: boolean
  error: string | null
  uploadProgress: number
}

const initialDataIngestionState: DataIngestionState = {
  uploadedFiles: [],
  processedData: [],
  isLoading: false,
  error: null,
  uploadProgress: 0
}

export const uploadFile = createAsyncThunk(
  'dataIngestion/uploadFile',
  async ({ projectId, file }: { projectId: string; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`/api/ingestion/upload?projectId=${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Upload failed')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const fetchUploadedFiles = createAsyncThunk(
  'dataIngestion/fetchFiles',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/ingestion/files?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to fetch files')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

const dataIngestionSlice = createSlice({
  name: 'dataIngestion',
  initialState: initialDataIngestionState,
  reducers: {
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Upload File
      .addCase(uploadFile.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.uploadProgress = 0
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.isLoading = false
        state.uploadedFiles.unshift(action.payload.data)
        state.uploadProgress = 100
        state.error = null
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.uploadProgress = 0
      })
      // Fetch Files
      .addCase(fetchUploadedFiles.fulfilled, (state, action) => {
        state.uploadedFiles = action.payload.data
      })
  }
})

// ============================================================================
// RECONCILIATION SLICE
// ============================================================================

interface ReconciliationState {
  records: ReconciliationRecord[]
  isLoading: boolean
  error: string | null
  matchingProgress: number
  matchingResults: {
    matched: number
    total: number
    confidence: number
  } | null
}

const initialReconciliationState: ReconciliationState = {
  records: [],
  isLoading: false,
  error: null,
  matchingProgress: 0,
  matchingResults: null
}

export const fetchReconciliationRecords = createAsyncThunk(
  'reconciliation/fetchRecords',
  async (params: { projectId: string; page?: number; limit?: number; status?: string; confidence?: number }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString())
      })
      
      const response = await fetch(`/api/reconciliation/records?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Failed to fetch records')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const runMatching = createAsyncThunk(
  'reconciliation/runMatching',
  async ({ projectId, rules }: { projectId: string; rules: any[] }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/reconciliation/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ projectId, rules })
      })
      
      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Matching failed')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

const reconciliationSlice = createSlice({
  name: 'reconciliation',
  initialState: initialReconciliationState,
  reducers: {
    setMatchingProgress: (state, action: PayloadAction<number>) => {
      state.matchingProgress = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Records
      .addCase(fetchReconciliationRecords.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchReconciliationRecords.fulfilled, (state, action) => {
        state.isLoading = false
        state.records = action.payload.data
        state.error = null
      })
      .addCase(fetchReconciliationRecords.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Run Matching
      .addCase(runMatching.pending, (state) => {
        state.isLoading = true
        state.matchingProgress = 0
        state.error = null
      })
      .addCase(runMatching.fulfilled, (state, action) => {
        state.isLoading = false
        state.matchingProgress = 100
        state.matchingResults = action.payload.data
        state.error = null
      })
      .addCase(runMatching.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.matchingProgress = 0
      })
  }
})

// ============================================================================
// UI SLICE
// ============================================================================

interface UIState {
  currentPage: string
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notifications: Notification[]
  loading: {
    global: boolean
    page: boolean
    component: Record<string, boolean>
  }
}

const initialUIState: UIState = {
  currentPage: '/projects',
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
  loading: {
    global: false,
    page: false,
    component: {}
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    setLoading: (state, action: PayloadAction<{ type: 'global' | 'page' | 'component'; key?: string; loading: boolean }>) => {
      const { type, key, loading } = action.payload
      if (type === 'component' && key) {
        state.loading.component[key] = loading
      } else if (type === 'global') {
        state.loading.global = loading
      } else if (type === 'page') {
        state.loading.page = loading
      }
    }
  }
})

// ============================================================================
// ROOT REDUCER
// ============================================================================

const rootReducer = combineReducers({
  auth: authSlice.reducer,
  projects: projectSlice.reducer,
  dataIngestion: dataIngestionSlice.reducer,
  reconciliation: reconciliationSlice.reducer,
  ui: uiSlice.reducer
})

// ============================================================================
// PERSIST CONFIGURATION
// ============================================================================

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui', 'projects'], // Only persist these slices
  blacklist: ['dataIngestion', 'reconciliation'] // Don't persist these slices
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['_persist']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
})

export const persistor = persistStore(store)

// ============================================================================
// EXPORTS
// ============================================================================

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Action creators
export const { logout, clearError: clearAuthError, setUser } = authSlice.actions
export const { setCurrentProject, clearError: clearProjectError } = projectSlice.actions
export const { setUploadProgress, clearError: clearDataIngestionError } = dataIngestionSlice.actions
export const { setMatchingProgress, clearError: clearReconciliationError } = reconciliationSlice.actions
export const { setCurrentPage, toggleSidebar, setTheme, addNotification, removeNotification, setLoading } = uiSlice.actions

// Async thunks are exported above with their declarations

// Selectors
export const selectAuth = (state: RootState) => state.auth
export const selectProjects = (state: RootState) => state.projects
export const selectDataIngestion = (state: RootState) => state.dataIngestion
export const selectReconciliation = (state: RootState) => state.reconciliation
export const selectUI = (state: RootState) => state.ui

export default store