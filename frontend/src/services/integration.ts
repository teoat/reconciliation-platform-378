// Integration and Export Services
import type { Project } from '@/types/backend-aligned';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeMetadata: boolean;
  includeComments: boolean;
  includeHistory: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: ProjectFilters;
}

export interface ProjectFilters {
  status?: string[];
  category?: string[];
  department?: string[];
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'calendar' | 'email' | 'slack' | 'teams' | 'api';
  enabled: boolean;
  settings: Record<string, unknown>;
  lastSync?: string;
}

export interface ExportResult {
  success: boolean;
  fileUrl?: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  errors: string[];
  lastSync: string;
}

export class ProjectExportService {
  static async exportProjects(projects: Project[], options: ExportOptions): Promise<ExportResult> {
    try {
      // Simulate export process
      const filteredProjects = this.filterProjects(projects, options.filters);
      const exportData = this.formatData(filteredProjects, options);

      const fileName = `projects_export_${new Date().toISOString().split('T')[0]}.${options.format}`;
      const fileSize = JSON.stringify(exportData).length;

      // In a real implementation, this would generate actual files
      return {
        success: true,
        fileName,
        fileSize,
        recordCount: filteredProjects.length,
      };
    } catch (error) {
      return {
        success: false,
        fileName: '',
        fileSize: 0,
        recordCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private static filterProjects(projects: Project[], filters?: ProjectFilters): Project[] {
    if (!filters) return projects;

    return projects.filter((project) => {
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(project.status)) return false;
      }
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(project.category)) return false;
      }
      if (filters.department && filters.department.length > 0) {
        if (!filters.department.includes(project.department)) return false;
      }
      return true;
    });
  }

  private static formatData(projects: Project[], options: ExportOptions) {
    return projects.map((project) => {
      const baseData = {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        category: project.category,
        priority: project.priority,
        department: project.department,
        createdDate: project.created_at,
        createdBy: project.createdBy,
        lastModified: project.lastModified,
      };

      if (options.includeMetadata) {
        Object.assign(baseData, {
          progress: project.progress.completionPercentage,
          recordCount: project.recordCount,
          matchRate: project.matchRate,
          budget: project.budget,
          actualCost: project.actualCost,
        });
      }

      if (options.includeComments) {
        Object.assign(baseData, {
          comments: (
            project as unknown as {
              comments?: Array<{ userId: string; content: string; timestamp: string }>;
            }
          ).comments?.map((c) => ({
            user: c.userId,
            content: c.content,
            timestamp: c.timestamp,
          })),
        });
      }

      return baseData;
    });
  }
}

export class IntegrationService {
  private static integrations: IntegrationConfig[] = [
    {
      id: 'calendar',
      name: 'Google Calendar',
      type: 'calendar',
      enabled: false,
      settings: {
        apiKey: '',
        calendarId: '',
      },
    },
    {
      id: 'email',
      name: 'Email Notifications',
      type: 'email',
      enabled: true,
      settings: {
        smtpServer: '',
        smtpPort: 587,
        username: '',
        password: '',
      },
    },
    {
      id: 'slack',
      name: 'Slack Integration',
      type: 'slack',
      enabled: false,
      settings: {
        webhookUrl: '',
        channel: '#reconciliation',
      },
    },
  ];

  static getIntegrations(): IntegrationConfig[] {
    return this.integrations;
  }

  static updateIntegration(id: string, settings: Record<string, unknown>): boolean {
    const integration = this.integrations.find((i) => i.id === id);
    if (integration) {
      integration.settings = { ...integration.settings, ...settings };
      integration.lastSync = new Date().toISOString();
      return true;
    }
    return false;
  }

  static toggleIntegration(id: string): boolean {
    const integration = this.integrations.find((i) => i.id === id);
    if (integration) {
      integration.enabled = !integration.enabled;
      return true;
    }
    return false;
  }

  static async syncWithCalendar(projects: Project[]): Promise<SyncResult> {
    // Simulate calendar sync
    const calendarIntegration = this.integrations.find((i) => i.type === 'calendar' && i.enabled);
    if (!calendarIntegration) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['Calendar integration not enabled'],
        lastSync: new Date().toISOString(),
      };
    }

    // Simulate sync process
    const syncedItems = projects.filter((p) => p.status === 'active').length;

    return {
      success: true,
      syncedItems,
      errors: [],
      lastSync: new Date().toISOString(),
    };
  }

  static async sendSlackNotification(_message: string): Promise<SyncResult> {
    const slackIntegration = this.integrations.find((i) => i.type === 'slack' && i.enabled);
    if (!slackIntegration) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['Slack integration not enabled'],
        lastSync: new Date().toISOString(),
      };
    }

    // Simulate Slack notification
    return {
      success: true,
      syncedItems: 1,
      errors: [],
      lastSync: new Date().toISOString(),
    };
  }

  static async sendEmailNotification(
    _to: string,
    _subject: string,
    _content: string
  ): Promise<SyncResult> {
    const emailIntegration = this.integrations.find((i) => i.type === 'email' && i.enabled);
    if (!emailIntegration) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['Email integration not enabled'],
        lastSync: new Date().toISOString(),
      };
    }

    // Simulate email sending
    return {
      success: true,
      syncedItems: 1,
      errors: [],
      lastSync: new Date().toISOString(),
    };
  }
}

// NOTE: APIService mock implementation removed
// Use the real API service from frontend/src/services/api/mod.ts instead
// This was a mock service for testing and is no longer needed
