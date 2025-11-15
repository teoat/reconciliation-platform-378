// Enhanced Project Management Types and Interfaces
export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: 'financial' | 'inventory' | 'customer' | 'payment' | 'hr' | 'custom'
  defaultSettings: {
    reconciliationRules: string[]
    dataSources: string[]
    matchingCriteria: string[]
    exportFormats: string[]
  }
  estimatedDuration: string
  complexity: 'simple' | 'medium' | 'complex'
  icon: string
  color: string
}

export interface ProjectProgress {
  currentStep: 'ingestion' | 'reconciliation' | 'adjudication' | 'summary'
  completionPercentage: number
  estimatedCompletionDate: string
  actualTimeSpent: number
  estimatedTimeRemaining: number
  milestones: Array<{
    name: string
    completed: boolean
    completedAt?: string
  }>
}

export interface ProjectPermissions {
  owner: string
  collaborators: Array<{
    userId: string
    role: 'viewer' | 'editor' | 'admin'
    permissions: string[]
  }>
  isPublic: boolean
  accessLevel: 'private' | 'team' | 'organization'
}

export interface ProjectComment {
  id: string
  userId: string
  content: string
  timestamp: string
  type: 'comment' | 'note' | 'update'
  mentions: string[]
}

export interface ProjectAnalytics {
  totalProjects: number
  activeProjects: number
  completedThisMonth: number
  averageCompletionTime: number
  successRate: number
  categoryDistribution: Record<string, number>
  teamPerformance: Array<{
    user: string
    projectsCompleted: number
    averageTime: number
  }>
}

export interface ProjectFilters {
  searchTerm: string
  status: ('draft' | 'active' | 'completed' | 'archived')[]
  category: string[]
  tags: string[]
  createdBy: string[]
  dateRange: {
    start: string
    end: string
  }
  priority: string[]
  department: string[]
}

export interface ProjectCloneOptions {
  includeData: boolean
  includeSettings: boolean
  includeHistory: boolean
  newName: string
  resetStatus: boolean
}

export interface ArchivedProject {
  id: string
  name: string
  description: string
  createdDate: string
  createdBy: string
  status: 'archived'
  lastModified: string
  archivedAt: string
  archivedBy: string
  archiveReason: string
  retentionPeriod: number
  category: string
  tags: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department: string
  fiscalPeriod: string
  complianceRequirements: string[]
  progress: ProjectProgress
  permissions: ProjectPermissions
  comments: ProjectComment[]
}

export interface EnhancedProject {
  id: string
  name: string
  description: string
  createdDate: string
  createdBy: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  lastModified: string
  category: 'financial' | 'inventory' | 'customer' | 'payment' | 'hr' | 'custom'
  tags: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department: string
  fiscalPeriod: string
  complianceRequirements: string[]
  progress: ProjectProgress
  permissions: ProjectPermissions
  comments: ProjectComment[]
  lastActivity: {
    user: string
    action: string
    timestamp: string
  }
  dataSources: string[]
  recordCount: number
  matchRate: number
  nextMilestone: string
  alerts: Array<{
    type: 'warning' | 'error' | 'info'
    message: string
  }>
  template?: ProjectTemplate
  estimatedDuration: string
  actualDuration?: string
  budget?: number
  actualCost?: number
}

export interface ProjectWorkflow {
  id: string
  name: string
  steps: Array<{
    name: string
    description: string
    required: boolean
    estimatedTime: number
    dependencies: string[]
  }>
  automationRules: string[]
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  viewMode: 'grid' | 'list' | 'table'
  itemsPerPage: number
  defaultFilters: ProjectFilters
  notifications: {
    email: boolean
    push: boolean
    projectUpdates: boolean
    deadlineReminders: boolean
  }
  dashboardLayout: string[]
}

export interface NotificationSettings {
  projectCreated: boolean
  projectUpdated: boolean
  projectCompleted: boolean
  deadlineApproaching: boolean
  commentAdded: boolean
  collaboratorAdded: boolean
}
