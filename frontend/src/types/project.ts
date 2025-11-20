// Project-related type definitions

/**
 * Enhanced Project type with rich UI features.
 *
 * This type extends basic project data with UI-specific features like:
 * - Project analytics and progress tracking
 * - Alerts and notifications
 * - Activity history
 * - Templates and configuration
 *
 * Use this type when:
 * - Working with UI components that need rich project data
 * - Need project analytics, progress, alerts, templates
 * - Working with project management dashboard features
 * - Displaying project details with enhanced information
 *
 * For backend API integration, use '@/types/backend-aligned::Project' instead.
 * For simplified service layer usage, see '@/types/service::Project' instead.
 */
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
