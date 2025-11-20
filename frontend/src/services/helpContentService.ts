/**
 * Help Content Service
 *
 * Provides centralized help content management:
 * - Help content creation and storage
 * - Content search functionality
 * - Integration with ContextualHelp
 * - Content expansion for top features
 */

import { logger } from './logger';

export type HelpContentType = 'article' | 'video' | 'tutorial' | 'faq' | 'quick-tip';
export type HelpContentCategory =
  | 'getting-started'
  | 'projects'
  | 'data-sources'
  | 'reconciliation'
  | 'matching'
  | 'results'
  | 'export'
  | 'settings'
  | 'troubleshooting';

export interface InteractiveExample {
  id: string;
  title: string;
  description: string;
  code?: string;
  language?: 'typescript' | 'javascript' | 'json' | 'bash' | 'sql';
  demoUrl?: string;
  sandbox?: boolean; // If true, allows interactive editing
}

export interface HelpContent {
  id: string;
  title: string;
  description: string;
  content: string;
  type: HelpContentType;
  category: HelpContentCategory;
  tags: string[];
  relatedFeatures?: string[];
  videoUrl?: string;
  interactiveExample?: InteractiveExample;
  lastUpdated: Date;
  views?: number;
  helpful?: number;
  notHelpful?: number;
}

export interface HelpSearchResult {
  content: HelpContent;
  relevance: number;
  matchedFields: string[];
}

export interface HelpContentServiceConfig {
  enableSearch?: boolean;
  enableAnalytics?: boolean;
  maxResults?: number;
}

class HelpContentService {
  private content: Map<string, HelpContent> = new Map();
  private config: Required<HelpContentServiceConfig>;

  constructor(config: HelpContentServiceConfig = {}) {
    this.config = {
      enableSearch: config.enableSearch !== false,
      enableAnalytics: config.enableAnalytics !== false,
      maxResults: config.maxResults || 10,
    };

    // Initialize with default content
    this.initializeDefaultContent();
  }

  /**
   * Initialize default help content
   */
  private initializeDefaultContent(): void {
    const defaultContent: HelpContent[] = [
      {
        id: 'getting-started-overview',
        title: 'Getting Started with Reconciliation',
        description: 'Learn the basics of the reconciliation platform',
        content:
          'Welcome to the reconciliation platform! This guide will help you get started with creating projects, uploading data, and running reconciliation jobs.',
        type: 'article',
        category: 'getting-started',
        tags: ['getting-started', 'overview', 'basics'],
        lastUpdated: new Date(),
      },
      {
        id: 'create-project',
        title: 'How to Create a Project',
        description: 'Step-by-step guide to creating your first reconciliation project',
        content:
          'To create a project: 1. Click "Create Project" 2. Enter project name and description 3. Configure settings 4. Save and start uploading data.',
        type: 'tutorial',
        category: 'projects',
        tags: ['projects', 'create', 'setup'],
        relatedFeatures: ['project-creation', 'project-management'],
        lastUpdated: new Date(),
      },
      {
        id: 'upload-data',
        title: 'Uploading Data Sources',
        description: 'Guide to uploading and connecting data sources',
        content:
          'You can upload CSV, Excel, or JSON files, or connect to external APIs. Supported formats include CSV with headers, Excel (.xlsx), and JSON arrays.',
        type: 'article',
        category: 'data-sources',
        tags: ['upload', 'data-sources', 'files'],
        relatedFeatures: ['file-upload', 'api-integration'],
        lastUpdated: new Date(),
      },
      {
        id: 'run-reconciliation',
        title: 'Running Reconciliation Jobs',
        description: 'How to configure and run reconciliation jobs',
        content:
          'Configure matching rules, set confidence thresholds, and run reconciliation jobs. Monitor progress in real-time and review results.',
        type: 'tutorial',
        category: 'reconciliation',
        tags: ['reconciliation', 'jobs', 'matching'],
        relatedFeatures: ['reconciliation-jobs', 'matching-rules'],
        lastUpdated: new Date(),
      },
      {
        id: 'configure-matching',
        title: 'Configuring Matching Rules',
        description: 'Best practices for setting up matching rules',
        content:
          'Matching rules determine how records are compared. Configure field mappings, algorithms, and weights for accurate matching.',
        type: 'article',
        category: 'matching',
        tags: ['matching', 'rules', 'configuration'],
        relatedFeatures: ['matching-rules', 'confidence-thresholds'],
        lastUpdated: new Date(),
      },
      {
        id: 'review-results',
        title: 'Reviewing Reconciliation Results',
        description: 'How to review and export reconciliation results',
        content:
          'Review matched and unmatched records, resolve discrepancies, and export results in CSV, Excel, or PDF format.',
        type: 'tutorial',
        category: 'results',
        tags: ['results', 'review', 'export'],
        relatedFeatures: ['result-review', 'export'],
        lastUpdated: new Date(),
      },
      {
        id: 'common-errors',
        title: 'Common Errors and Solutions',
        description: 'Troubleshooting guide for common issues',
        content:
          'Learn about common errors like upload failures, matching issues, and how to resolve them.',
        type: 'faq',
        category: 'troubleshooting',
        tags: ['errors', 'troubleshooting', 'solutions'],
        lastUpdated: new Date(),
      },
      // Enhanced project management
      {
        id: 'project-management',
        title: 'Managing Projects',
        description: 'Complete guide to project management features',
        content:
          'Projects are the central organizing unit. You can create, edit, archive, and delete projects. Each project has its own data sources, matching rules, and reconciliation jobs. Use project settings to configure access controls, notifications, and data retention policies.',
        type: 'article',
        category: 'projects',
        tags: ['projects', 'management', 'settings'],
        relatedFeatures: ['project-management', 'project-settings'],
        lastUpdated: new Date(),
      },
      // Enhanced data source configuration
      {
        id: 'data-source-configuration',
        title: 'Configuring Data Sources',
        description: 'Detailed guide to data source setup and configuration',
        content:
          'Data sources can be files (CSV, Excel, JSON) or API connections. Configure field mappings, data types, and validation rules. Set up automatic refresh schedules and data quality checks. Use the preview feature to verify data before processing.',
        type: 'tutorial',
        category: 'data-sources',
        tags: ['data-sources', 'configuration', 'mapping'],
        relatedFeatures: ['data-source-config', 'field-mapping'],
        lastUpdated: new Date(),
      },
      // Enhanced file upload
      {
        id: 'file-upload-enhanced',
        title: 'Advanced File Upload',
        description: 'Upload large files, handle errors, and manage uploads',
        content:
          'Upload files up to 100MB. Supported formats: CSV, Excel (.xlsx, .xls), JSON. The system automatically detects headers, data types, and encoding. Use the upload progress indicator to track large file uploads. Failed uploads can be retried automatically.',
        type: 'tutorial',
        category: 'data-sources',
        tags: ['upload', 'files', 'large-files'],
        relatedFeatures: ['file-upload', 'upload-progress'],
        lastUpdated: new Date(),
      },
      // Field mapping
      {
        id: 'field-mapping',
        title: 'Field Mapping Guide',
        description: 'How to map fields between data sources',
        content:
          'Field mapping connects fields from different data sources for comparison. Map fields by name, position, or custom rules. Use data transformations to normalize values before matching. Preview mappings before applying to ensure accuracy.',
        type: 'tutorial',
        category: 'matching',
        tags: ['field-mapping', 'mapping', 'transformation'],
        relatedFeatures: ['field-mapping', 'data-transformation'],
        lastUpdated: new Date(),
      },
      // Matching rules configuration
      {
        id: 'matching-rules-configuration',
        title: 'Advanced Matching Rules',
        description: 'Configure complex matching rules and algorithms',
        content:
          'Create matching rules using exact match, fuzzy match, or custom algorithms. Set confidence thresholds, field weights, and matching priorities. Use rule groups to combine multiple conditions. Test rules before applying to production data.',
        type: 'tutorial',
        category: 'matching',
        tags: ['matching-rules', 'algorithms', 'confidence'],
        relatedFeatures: ['matching-rules', 'fuzzy-matching'],
        lastUpdated: new Date(),
      },
      // Reconciliation execution
      {
        id: 'reconciliation-execution',
        title: 'Executing Reconciliation Jobs',
        description: 'Run and monitor reconciliation jobs',
        content:
          'Start reconciliation jobs from the project dashboard. Monitor progress in real-time with detailed metrics. Jobs run asynchronously and can be paused, resumed, or cancelled. View logs and error reports for troubleshooting.',
        type: 'tutorial',
        category: 'reconciliation',
        tags: ['reconciliation', 'jobs', 'execution'],
        relatedFeatures: ['reconciliation-jobs', 'job-monitoring'],
        lastUpdated: new Date(),
      },
      // Match review and approval
      {
        id: 'match-review-approval',
        title: 'Reviewing and Approving Matches',
        description: 'Review matched records and approve or reject matches',
        content:
          'Review matches with confidence scores below your threshold. Use the side-by-side comparison view to verify matches. Approve correct matches, reject incorrect ones, or manually match records. Bulk actions available for efficient review.',
        type: 'tutorial',
        category: 'results',
        tags: ['review', 'approval', 'matches'],
        relatedFeatures: ['match-review', 'approval-workflow'],
        lastUpdated: new Date(),
      },
      // Discrepancy resolution
      {
        id: 'discrepancy-resolution',
        title: 'Resolving Discrepancies',
        description: 'Identify and resolve data discrepancies',
        content:
          'Discrepancies are differences between matched records. Review discrepancies in the results view. Add notes, assign to team members, and track resolution status. Export discrepancy reports for external review.',
        type: 'tutorial',
        category: 'results',
        tags: ['discrepancies', 'resolution', 'review'],
        relatedFeatures: ['discrepancy-resolution', 'notes'],
        lastUpdated: new Date(),
      },
      // Visualization options
      {
        id: 'visualization-options',
        title: 'Data Visualization',
        description: 'Visualize reconciliation results and analytics',
        content:
          'View reconciliation results in charts and graphs. Use the dashboard to see match rates, confidence distributions, and trend analysis. Export visualizations as images or PDFs for reports.',
        type: 'article',
        category: 'results',
        tags: ['visualization', 'charts', 'analytics'],
        relatedFeatures: ['visualization', 'dashboard'],
        lastUpdated: new Date(),
      },
      // Export functionality
      {
        id: 'export-functionality',
        title: 'Exporting Results',
        description: 'Export reconciliation results in various formats',
        content:
          'Export results as CSV, Excel, or PDF. Filter and customize export columns. Schedule automatic exports. Export includes matched records, unmatched records, and discrepancy reports.',
        type: 'tutorial',
        category: 'export',
        tags: ['export', 'csv', 'excel', 'pdf'],
        relatedFeatures: ['export', 'scheduled-exports'],
        lastUpdated: new Date(),
      },
      // Settings management
      {
        id: 'settings-management',
        title: 'Managing Settings',
        description: 'Configure application and user settings',
        content:
          'Access settings from your profile menu. Configure notifications, preferences, and account settings. Set default values for new projects. Manage API keys and integrations.',
        type: 'article',
        category: 'settings',
        tags: ['settings', 'preferences', 'configuration'],
        relatedFeatures: ['settings', 'user-preferences'],
        lastUpdated: new Date(),
      },
      // User management
      {
        id: 'user-management',
        title: 'User Management',
        description: 'Manage users, roles, and permissions',
        content:
          'Admins can invite users, assign roles (Admin, Analyst, Viewer), and manage permissions. Set project-level access controls. View user activity and manage team members.',
        type: 'article',
        category: 'settings',
        tags: ['users', 'roles', 'permissions'],
        relatedFeatures: ['user-management', 'access-control'],
        lastUpdated: new Date(),
      },
      // Audit logging
      {
        id: 'audit-logging',
        title: 'Audit Logs',
        description: 'View and manage audit logs',
        content:
          'Audit logs track all system activities including data changes, user actions, and system events. Filter logs by user, action type, date range, or project. Export logs for compliance reporting.',
        type: 'article',
        category: 'settings',
        tags: ['audit', 'logs', 'compliance'],
        relatedFeatures: ['audit-logs', 'compliance'],
        lastUpdated: new Date(),
      },
      // API integration
      {
        id: 'api-integration',
        title: 'API Integration',
        description: 'Integrate with external systems via API',
        content:
          'Use the REST API to integrate reconciliation into your workflows. Authenticate with API keys. Access projects, run jobs, and retrieve results programmatically. API documentation available in the developer section.',
        type: 'tutorial',
        category: 'data-sources',
        tags: ['api', 'integration', 'rest'],
        relatedFeatures: ['api', 'integration'],
        videoUrl: 'https://example.com/videos/api-integration',
        interactiveExample: {
          id: 'api-integration-example',
          title: 'API Integration Example',
          description: 'Example API call to create a reconciliation job',
          code: `// Create a reconciliation job via API
const response = await fetch('/api/reconciliation-jobs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    projectId: 'project-123',
    dataSourceIds: ['source-1', 'source-2'],
    matchingRules: {
      confidenceThreshold: 0.8,
      rules: [
        { field: 'accountNumber', algorithm: 'exact' },
        { field: 'amount', algorithm: 'fuzzy', threshold: 0.95 },
      ],
    },
  }),
});

const job = await response.json();
console.log('Job created:', job.id);`,
          language: 'typescript',
          sandbox: true,
        },
        lastUpdated: new Date(),
      },
      // Webhook configuration
      {
        id: 'webhook-configuration',
        title: 'Webhook Configuration',
        description: 'Set up webhooks for event notifications',
        content:
          'Configure webhooks to receive notifications when jobs complete, errors occur, or data is updated. Set up webhook endpoints, choose events, and test configurations. Webhooks use HTTPS for secure delivery.',
        type: 'tutorial',
        category: 'settings',
        tags: ['webhooks', 'notifications', 'events'],
        relatedFeatures: ['webhooks', 'notifications'],
        lastUpdated: new Date(),
      },
      // Scheduled jobs
      {
        id: 'scheduled-jobs',
        title: 'Scheduled Reconciliation Jobs',
        description: 'Schedule automatic reconciliation jobs',
        content:
          'Schedule jobs to run automatically on a schedule (daily, weekly, monthly). Set up schedules from the project settings. Jobs run in the background and send notifications on completion.',
        type: 'tutorial',
        category: 'reconciliation',
        tags: ['scheduling', 'automation', 'jobs'],
        relatedFeatures: ['scheduled-jobs', 'automation'],
        lastUpdated: new Date(),
      },
      // Report generation
      {
        id: 'report-generation',
        title: 'Generating Reports',
        description: 'Create and customize reconciliation reports',
        content:
          'Generate comprehensive reports with match statistics, discrepancy analysis, and trend data. Customize report templates. Schedule automatic report generation and delivery.',
        type: 'tutorial',
        category: 'results',
        tags: ['reports', 'generation', 'templates'],
        relatedFeatures: ['reports', 'report-templates'],
        lastUpdated: new Date(),
      },
      // Data quality checks
      {
        id: 'data-quality-checks',
        title: 'Data Quality Checks',
        description: 'Validate and improve data quality',
        content:
          'Run data quality checks before reconciliation. Detect duplicates, missing values, format issues, and outliers. Get quality scores and recommendations for improvement.',
        type: 'article',
        category: 'data-sources',
        tags: ['data-quality', 'validation', 'checks'],
        relatedFeatures: ['data-quality', 'validation'],
        lastUpdated: new Date(),
      },
      // Error handling
      {
        id: 'error-handling',
        title: 'Error Handling and Recovery',
        description: 'Handle errors and recover from failures',
        content:
          'The system automatically retries failed operations. View error logs and details. Common errors include file format issues, connection failures, and validation errors. Use error recovery tools to resume interrupted jobs.',
        type: 'faq',
        category: 'troubleshooting',
        tags: ['errors', 'handling', 'recovery'],
        relatedFeatures: ['error-handling', 'recovery'],
        lastUpdated: new Date(),
      },
      // Performance optimization
      {
        id: 'performance-optimization',
        title: 'Performance Optimization',
        description: 'Optimize reconciliation performance',
        content:
          'Improve performance by: using indexes on key fields, reducing data volume with filters, optimizing matching rules, and using batch processing. Monitor performance metrics in the dashboard.',
        type: 'article',
        category: 'troubleshooting',
        tags: ['performance', 'optimization', 'speed'],
        relatedFeatures: ['performance', 'optimization'],
        lastUpdated: new Date(),
      },
    ];

    defaultContent.forEach((content) => this.addContent(content));
  }

  /**
   * Add or update help content
   */
  addContent(content: HelpContent): void {
    this.content.set(content.id, content);
    logger.debug('Help content added', { id: content.id, title: content.title });
  }

  /**
   * Get content by ID
   */
  getContent(id: string): HelpContent | undefined {
    const content = this.content.get(id);
    if (content && this.config.enableAnalytics) {
      content.views = (content.views || 0) + 1;
    }
    return content;
  }

  /**
   * Get content by category
   */
  getContentByCategory(category: HelpContentCategory): HelpContent[] {
    return Array.from(this.content.values()).filter((content) => content.category === category);
  }

  /**
   * Get content by feature
   */
  getContentByFeature(featureId: string): HelpContent[] {
    return Array.from(this.content.values()).filter((content) =>
      content.relatedFeatures?.includes(featureId)
    );
  }

  /**
   * Search help content
   */
  search(query: string): HelpSearchResult[] {
    if (!this.config.enableSearch) {
      return [];
    }

    const searchTerms = query.toLowerCase().split(/\s+/);
    const results: HelpSearchResult[] = [];

    this.content.forEach((content) => {
      let relevance = 0;
      const matchedFields: string[] = [];

      // Search in title (highest weight)
      const titleMatches = searchTerms.filter((term) => content.title.toLowerCase().includes(term));
      if (titleMatches.length > 0) {
        relevance += titleMatches.length * 10;
        matchedFields.push('title');
      }

      // Search in description
      const descMatches = searchTerms.filter((term) =>
        content.description.toLowerCase().includes(term)
      );
      if (descMatches.length > 0) {
        relevance += descMatches.length * 5;
        matchedFields.push('description');
      }

      // Search in content
      const contentMatches = searchTerms.filter((term) =>
        content.content.toLowerCase().includes(term)
      );
      if (contentMatches.length > 0) {
        relevance += contentMatches.length * 2;
        matchedFields.push('content');
      }

      // Search in tags
      const tagMatches = searchTerms.filter((term) =>
        content.tags.some((tag) => tag.toLowerCase().includes(term))
      );
      if (tagMatches.length > 0) {
        relevance += tagMatches.length * 3;
        matchedFields.push('tags');
      }

      if (relevance > 0) {
        results.push({
          content,
          relevance,
          matchedFields,
        });
      }
    });

    // Sort by relevance (highest first)
    results.sort((a, b) => b.relevance - a.relevance);

    // Return top results
    return results.slice(0, this.config.maxResults);
  }

  /**
   * Track content view
   */
  trackView(id: string): void {
    const content = this.content.get(id);
    if (content) {
      content.views = (content.views || 0) + 1;
      logger.debug('Help content view tracked', { id });
    }
  }

  /**
   * Get related content
   */
  getRelated(id: string, limit: number = 3): HelpContent[] {
    const content = this.content.get(id);
    if (!content) return [];

    // Find related content by:
    // 1. Same category
    // 2. Shared tags
    // 3. Same type
    const related = Array.from(this.content.values())
      .filter((c) => c.id !== id)
      .map((c) => {
        let score = 0;
        if (c.category === content.category) score += 3;
        const sharedTags = c.tags.filter((tag) => content.tags.includes(tag));
        score += sharedTags.length;
        if (c.type === content.type) score += 1;
        return { content: c, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.content);

    return related;
  }

  /**
   * Track content helpfulness
   */
  trackHelpfulness(id: string, helpful: boolean): void {
    const content = this.content.get(id);
    if (content) {
      if (helpful) {
        content.helpful = (content.helpful || 0) + 1;
      } else {
        content.notHelpful = (content.notHelpful || 0) + 1;
      }
      logger.debug('Helpfulness tracked', { id, helpful });
    }
  }

  /**
   * Get analytics data
   */
  getAnalytics(): {
    totalContent: number;
    totalViews: number;
    mostViewed: HelpContent[];
    mostHelpful: HelpContent[];
    contentByCategory: Record<HelpContentCategory, number>;
  } {
    const contentArray = Array.from(this.content.values());
    const totalViews = contentArray.reduce((sum, c) => sum + (c.views || 0), 0);

    const mostViewed = [...contentArray]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    const mostHelpful = [...contentArray]
      .filter((c) => (c.helpful || 0) > 0)
      .sort((a, b) => (b.helpful || 0) - (a.helpful || 0))
      .slice(0, 5);

    const contentByCategory: Record<HelpContentCategory, number> = {
      'getting-started': 0,
      projects: 0,
      'data-sources': 0,
      reconciliation: 0,
      matching: 0,
      results: 0,
      export: 0,
      settings: 0,
      troubleshooting: 0,
    };

    contentArray.forEach((c) => {
      contentByCategory[c.category]++;
    });

    return {
      totalContent: contentArray.length,
      totalViews,
      mostViewed,
      mostHelpful,
      contentByCategory,
    };
  }
}

// Singleton instance
export const helpContentService = new HelpContentService();

// Export default instance
export default helpContentService;
