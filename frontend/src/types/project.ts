// Project-related type definitions

export interface EnhancedProject {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  department?: string;
  budget?: number;
  recordCount: number;
  matchRate: number;
  tags: string[];
  alerts: ProjectAlert[];
  progress: ProjectProgress;
  lastActivity: ProjectActivity;
  fiscalPeriod?: string;
  complianceRequirements?: string[];
  template?: ProjectTemplate;
  estimatedDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectAlert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProjectProgress {
  completionPercentage: number;
  currentStep: string;
  totalSteps: number;
  estimatedCompletion?: Date;
}

export interface ProjectActivity {
  user: string;
  action: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  config: Record<string, unknown>;
  isDefault?: boolean;
  createdAt: Date;
  color?: string;
  icon?: string;
  complexity?: string;
  estimatedDuration?: string;
}

export interface ProjectAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  averageMatchRate: number;
  totalRecords: number;
  totalMatches: number;
  performanceMetrics: {
    averageProcessingTime: number;
    throughputPerHour: number;
    errorRate: number;
  };
  trends: {
    projectsOverTime: Array<{ date: string; count: number }>;
    matchRateOverTime: Array<{ date: string; rate: number }>;
  };
  departmentStats: Array<{
    department: string;
    projectCount: number;
    averageMatchRate: number;
  }>;
}

export interface ProjectFilters {
  status: string[];
  priority: string[];
  category: string[];
  department: string[];
  tags: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  budgetRange: {
    min?: number;
    max?: number;
  };
  matchRateRange: {
    min?: number;
    max?: number;
  };
  searchQuery: string;
}
