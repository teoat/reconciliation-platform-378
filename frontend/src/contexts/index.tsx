// Centralized context providers for the application
import React, { createContext, useContext, useReducer, ReactNode } from 'react'

import type { Project } from '@/types/backend'
import type { ReconciliationRecord, MatchingRule } from '@/services/dataManagement/types'
import type { WorkflowState } from '@/services/atomic-workflow/types'
import type { Chart, DashboardData } from '@/types/analytics'
import type { ProcessedRecord } from '@/services/dataManagement/types'



// Project Context
interface ProjectState {
  currentProject: Project | null
  projects: Project[]
  loading: boolean
}

type ProjectAction =
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_LOADING'; payload: boolean }

interface ProjectContextType extends ProjectState {
  setCurrentProject: (project: Project | null) => void
  setProjects: (projects: Project[]) => void
  setLoading: (loading: boolean) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, {
    currentProject: null,
    projects: [],
    loading: false
  })

  const setCurrentProject = (project: Project | null) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project })
  }

  const setProjects = (projects: Project[]) => {
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

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
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
  files: File[]
  processedData: ProcessedRecord[]
  loading: boolean
}

type DataIngestionAction =
  | { type: 'SET_FILES'; payload: File[] }
  | { type: 'SET_PROCESSED_DATA'; payload: ProcessedRecord[] }
  | { type: 'SET_LOADING'; payload: boolean }

interface DataIngestionContextType extends DataIngestionState {
  setFiles: (files: File[]) => void
  setProcessedData: (data: ProcessedRecord[]) => void
  setLoading: (loading: boolean) => void
}

const DataIngestionContext = createContext<DataIngestionContextType | undefined>(undefined)

export const DataIngestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataIngestionReducer, {
    files: [],
    processedData: [],
    loading: false
  })

  const setFiles = (files: File[]) => {
    dispatch({ type: 'SET_FILES', payload: files })
  }

  const setProcessedData = (data: ProcessedRecord[]) => {
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

function dataIngestionReducer(state: DataIngestionState, action: DataIngestionAction): DataIngestionState {
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
  records: ReconciliationRecord[]
  matchingRules: MatchingRule[]
  loading: boolean
}

type ReconciliationAction =
  | { type: 'SET_RECORDS'; payload: ReconciliationRecord[] }
  | { type: 'SET_MATCHING_RULES'; payload: MatchingRule[] }
  | { type: 'SET_LOADING'; payload: boolean }

interface ReconciliationContextType extends ReconciliationState {
  setRecords: (records: ReconciliationRecord[]) => void
  setMatchingRules: (rules: MatchingRule[]) => void
  setLoading: (loading: boolean) => void
}

const ReconciliationContext = createContext<ReconciliationContextType | undefined>(undefined)

export const ReconciliationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reconciliationReducer, {
    records: [],
    matchingRules: [],
    loading: false
  })

  const setRecords = (records: ReconciliationRecord[]) => {
    dispatch({ type: 'SET_RECORDS', payload: records })
  }

  const setMatchingRules = (rules: MatchingRule[]) => {
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

function reconciliationReducer(state: ReconciliationState, action: ReconciliationAction): ReconciliationState {
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
interface AdjudicationDecision {
  id: string
  caseId: string
  decision: string
  rationale: string
  decidedBy: string
  decidedAt: string
}

interface AdjudicationState {
  workflows: WorkflowState[]
  decisions: AdjudicationDecision[]
  loading: boolean
}

type AdjudicationAction =
  | { type: 'SET_WORKFLOWS'; payload: WorkflowState[] }
  | { type: 'SET_DECISIONS'; payload: AdjudicationDecision[] }
  | { type: 'SET_LOADING'; payload: boolean }

interface AdjudicationContextType extends AdjudicationState {
  setWorkflows: (workflows: WorkflowState[]) => void
  setDecisions: (decisions: AdjudicationDecision[]) => void
  setLoading: (loading: boolean) => void
}

const AdjudicationContext = createContext<AdjudicationContextType | undefined>(undefined)

export const AdjudicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(adjudicationReducer, {
    workflows: [],
    decisions: [],
    loading: false
  })

  const setWorkflows = (workflows: WorkflowState[]) => {
    dispatch({ type: 'SET_WORKFLOWS', payload: workflows })
  }

  const setDecisions = (decisions: AdjudicationDecision[]) => {
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

function adjudicationReducer(state: AdjudicationState, action: AdjudicationAction): AdjudicationState {
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
  charts: Chart[]
  dashboards: DashboardData[]
  loading: boolean
}

type VisualizationAction =
  | { type: 'SET_CHARTS'; payload: Chart[] }
  | { type: 'SET_DASHBOARDS'; payload: DashboardData[] }
  | { type: 'SET_LOADING'; payload: boolean }

interface VisualizationContextType extends VisualizationState {
  setCharts: (charts: Chart[]) => void
  setDashboards: (dashboards: DashboardData[]) => void
  setLoading: (loading: boolean) => void
}

const VisualizationContext = createContext<VisualizationContextType | undefined>(undefined)

export const VisualizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(visualizationReducer, {
    charts: [],
    dashboards: [],
    loading: false
  })

  const setCharts = (charts: Chart[]) => {
    dispatch({ type: 'SET_CHARTS', payload: charts })
  }

  const setDashboards = (dashboards: DashboardData[]) => {
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

function visualizationReducer(state: VisualizationState, action: VisualizationAction): VisualizationState {
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
interface ApiIntegration {
  id: string
  name: string
  url: string
  method: string
  enabled: boolean
}

interface WebhookIntegration {
  id: string
  name: string
  url: string
  events: string[]
  enabled: boolean
}

interface IntegrationState {
  apis: ApiIntegration[]
  webhooks: WebhookIntegration[]
  loading: boolean
}

type IntegrationAction =
  | { type: 'SET_APIS'; payload: ApiIntegration[] }
  | { type: 'SET_WEBHOOKS'; payload: WebhookIntegration[] }
  | { type: 'SET_LOADING'; payload: boolean }

interface IntegrationContextType extends IntegrationState {
  setApis: (apis: ApiIntegration[]) => void
  setWebhooks: (webhooks: WebhookIntegration[]) => void
  setLoading: (loading: boolean) => void
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined)

export const IntegrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(integrationReducer, {
    apis: [],
    webhooks: [],
    loading: false
  })

  const setApis = (apis: ApiIntegration[]) => {
    dispatch({ type: 'SET_APIS', payload: apis })
  }

  const setWebhooks = (webhooks: WebhookIntegration[]) => {
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

function integrationReducer(state: IntegrationState, action: IntegrationAction): IntegrationState {
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