// Centralized context providers for the application
import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// Auth Context
interface AuthState {
  isAuthenticated: boolean
  user: any | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  login: (user: any) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: any = ({ children }: any) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    loading: false
  })

  const login = (user: any) => {
    dispatch({ type: 'LOGIN', payload: user })
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function authReducer(state: AuthState, action: any): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.payload, loading: false }
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

// Project Context
interface ProjectState {
  currentProject: any | null
  projects: any[]
  loading: boolean
}

interface ProjectContextType extends ProjectState {
  setCurrentProject: (project: any) => void
  setProjects: (projects: any[]) => void
  setLoading: (loading: boolean) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, {
    currentProject: null,
    projects: [],
    loading: false
  })

  const setCurrentProject = (project: any) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project })
  }

  const setProjects = (projects: any[]) => {
    dispatch({ type: 'SET_PROJECTS', payload: projects })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  return (
    <ProjectContext.Provider value={{ ...state, setCurrentProject, setProjects, setLoading }}>
      {children}
    </ProjectContext.Provider>
  )
}

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

function projectReducer(state: ProjectState, action: any): ProjectState {
  switch (action.type) {
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload }
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

// Data Ingestion Context
interface DataIngestionState {
  files: any[]
  processedData: any[]
  loading: boolean
}

interface DataIngestionContextType extends DataIngestionState {
  setFiles: (files: any[]) => void
  setProcessedData: (data: any[]) => void
  setLoading: (loading: boolean) => void
}

const DataIngestionContext = createContext<DataIngestionContextType | undefined>(undefined)

export const DataIngestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataIngestionReducer, {
    files: [],
    processedData: [],
    loading: false
  })

  const setFiles = (files: any[]) => {
    dispatch({ type: 'SET_FILES', payload: files })
  }

  const setProcessedData = (data: any[]) => {
    dispatch({ type: 'SET_PROCESSED_DATA', payload: data })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  return (
    <DataIngestionContext.Provider value={{ ...state, setFiles, setProcessedData, setLoading }}>
      {children}
    </DataIngestionContext.Provider>
  )
}

export const useDataIngestion = () => {
  const context = useContext(DataIngestionContext)
  if (context === undefined) {
    throw new Error('useDataIngestion must be used within a DataIngestionProvider')
  }
  return context
}

function dataIngestionReducer(state: DataIngestionState, action: any): DataIngestionState {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.payload }
    case 'SET_PROCESSED_DATA':
      return { ...state, processedData: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

// Reconciliation Context
interface ReconciliationState {
  records: any[]
  matchingRules: any[]
  loading: boolean
}

interface ReconciliationContextType extends ReconciliationState {
  setRecords: (records: any[]) => void
  setMatchingRules: (rules: any[]) => void
  setLoading: (loading: boolean) => void
}

const ReconciliationContext = createContext<ReconciliationContextType | undefined>(undefined)

export const ReconciliationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reconciliationReducer, {
    records: [],
    matchingRules: [],
    loading: false
  })

  const setRecords = (records: any[]) => {
    dispatch({ type: 'SET_RECORDS', payload: records })
  }

  const setMatchingRules = (rules: any[]) => {
    dispatch({ type: 'SET_MATCHING_RULES', payload: rules })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  return (
    <ReconciliationContext.Provider value={{ ...state, setRecords, setMatchingRules, setLoading }}>
      {children}
    </ReconciliationContext.Provider>
  )
}

export const useReconciliation = () => {
  const context = useContext(ReconciliationContext)
  if (context === undefined) {
    throw new Error('useReconciliation must be used within a ReconciliationProvider')
  }
  return context
}

function reconciliationReducer(state: ReconciliationState, action: any): ReconciliationState {
  switch (action.type) {
    case 'SET_RECORDS':
      return { ...state, records: action.payload }
    case 'SET_MATCHING_RULES':
      return { ...state, matchingRules: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

// Adjudication Context
interface AdjudicationState {
  workflows: any[]
  decisions: any[]
  loading: boolean
}

interface AdjudicationContextType extends AdjudicationState {
  setWorkflows: (workflows: any[]) => void
  setDecisions: (decisions: any[]) => void
  setLoading: (loading: boolean) => void
}

const AdjudicationContext = createContext<AdjudicationContextType | undefined>(undefined)

export const AdjudicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(adjudicationReducer, {
    workflows: [],
    decisions: [],
    loading: false
  })

  const setWorkflows = (workflows: any[]) => {
    dispatch({ type: 'SET_WORKFLOWS', payload: workflows })
  }

  const setDecisions = (decisions: any[]) => {
    dispatch({ type: 'SET_DECISIONS', payload: decisions })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  return (
    <AdjudicationContext.Provider value={{ ...state, setWorkflows, setDecisions, setLoading }}>
      {children}
    </AdjudicationContext.Provider>
  )
}

export const useAdjudication = () => {
  const context = useContext(AdjudicationContext)
  if (context === undefined) {
    throw new Error('useAdjudication must be used within an AdjudicationProvider')
  }
  return context
}

function adjudicationReducer(state: AdjudicationState, action: any): AdjudicationState {
  switch (action.type) {
    case 'SET_WORKFLOWS':
      return { ...state, workflows: action.payload }
    case 'SET_DECISIONS':
      return { ...state, decisions: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

// Visualization Context
interface VisualizationState {
  charts: any[]
  dashboards: any[]
  loading: boolean
}

interface VisualizationContextType extends VisualizationState {
  setCharts: (charts: any[]) => void
  setDashboards: (dashboards: any[]) => void
  setLoading: (loading: boolean) => void
}

const VisualizationContext = createContext<VisualizationContextType | undefined>(undefined)

export const VisualizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(visualizationReducer, {
    charts: [],
    dashboards: [],
    loading: false
  })

  const setCharts = (charts: any[]) => {
    dispatch({ type: 'SET_CHARTS', payload: charts })
  }

  const setDashboards = (dashboards: any[]) => {
    dispatch({ type: 'SET_DASHBOARDS', payload: dashboards })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  return (
    <VisualizationContext.Provider value={{ ...state, setCharts, setDashboards, setLoading }}>
      {children}
    </VisualizationContext.Provider>
  )
}

export const useVisualization = () => {
  const context = useContext(VisualizationContext)
  if (context === undefined) {
    throw new Error('useVisualization must be used within a VisualizationProvider')
  }
  return context
}

function visualizationReducer(state: VisualizationState, action: any): VisualizationState {
  switch (action.type) {
    case 'SET_CHARTS':
      return { ...state, charts: action.payload }
    case 'SET_DASHBOARDS':
      return { ...state, dashboards: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

// Integration Context
interface IntegrationState {
  apis: any[]
  webhooks: any[]
  loading: boolean
}

interface IntegrationContextType extends IntegrationState {
  setApis: (apis: any[]) => void
  setWebhooks: (webhooks: any[]) => void
  setLoading: (loading: boolean) => void
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined)

export const IntegrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(integrationReducer, {
    apis: [],
    webhooks: [],
    loading: false
  })

  const setApis = (apis: any[]) => {
    dispatch({ type: 'SET_APIS', payload: apis })
  }

  const setWebhooks = (webhooks: any[]) => {
    dispatch({ type: 'SET_WEBHOOKS', payload: webhooks })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  return (
    <IntegrationContext.Provider value={{ ...state, setApis, setWebhooks, setLoading }}>
      {children}
    </IntegrationContext.Provider>
  )
}

export const useIntegration = () => {
  const context = useContext(IntegrationContext)
  if (context === undefined) {
    throw new Error('useIntegration must be used within an IntegrationProvider')
  }
  return context
}

function integrationReducer(state: IntegrationState, action: any): IntegrationState {
  switch (action.type) {
    case 'SET_APIS':
      return { ...state, apis: action.payload }
    case 'SET_WEBHOOKS':
      return { ...state, webhooks: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}