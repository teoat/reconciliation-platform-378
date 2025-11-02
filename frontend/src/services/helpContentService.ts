/**
 * Help Content Service
 * 
 * Centralized service for managing help content, search, and related articles.
 */

import { logger } from './logger';

export interface HelpTip {
  id: string;
  title: string;
  content: string;
  category?: 'tip' | 'guide' | 'example';
  order?: number;
}

export interface HelpLink {
  title: string;
  url: string;
  type?: 'article' | 'video' | 'external';
}

export interface HelpContent {
  id: string;
  feature: string;
  title: string;
  content: string;
  category: string;
  keywords: string[];
  related: string[];
  tips?: HelpTip[];
  links?: HelpLink[];
  videoUrl?: string;
  examples?: string[];
  updatedAt?: Date;
  views?: number;
  helpful?: number;
  notHelpful?: number;
}

class HelpContentService {
  private static instance: HelpContentService;
  private helpContent: Map<string, HelpContent> = new Map();
  private searchIndex: Map<string, string[]> = new Map(); // keyword -> contentIds

  private constructor() {
    this.initializeHelpContent();
    this.buildSearchIndex();
  }

  static getInstance(): HelpContentService {
    if (!HelpContentService.instance) {
      HelpContentService.instance = new HelpContentService();
    }
    return HelpContentService.instance;
  }

  /**
   * Initialize help content for all features
   */
  private initializeHelpContent(): void {
    // 1. Project Management
    this.helpContent.set('project-creation', {
      id: 'project-creation',
      feature: 'project_management',
      title: 'Creating a Project',
      content: 'To create a new reconciliation project, click the "Create Project" button. Fill in the project name, description, and select a template if desired. Projects help you organize your reconciliation workflows.',
      category: 'project_management',
      keywords: ['project', 'create', 'new', 'setup', 'template'],
      related: ['project-settings', 'project-templates', 'project-collaboration'],
      tips: [
        {
          id: 'tip-1',
          title: 'Use Templates',
          content: 'Start with a template to speed up project creation. Templates include pre-configured settings.',
          category: 'tip',
        },
        {
          id: 'tip-2',
          title: 'Naming Convention',
          content: 'Use clear, descriptive names for your projects. Include dates or identifiers for easy organization.',
          category: 'tip',
        },
      ],
      links: [
        { title: 'Project Templates Guide', url: '/help/project-templates', type: 'article' },
        { title: 'Project Management Video', url: '/videos/project-management', type: 'video' },
      ],
      videoUrl: '/videos/project-creation',
    });

    // 2. Project Settings
    this.helpContent.set('project-settings', {
      id: 'project-settings',
      feature: 'project_management',
      title: 'Project Settings',
      content: 'Configure project settings including matching rules, tolerance levels, and notification preferences. Settings can be changed at any time.',
      category: 'project_management',
      keywords: ['settings', 'configuration', 'rules', 'tolerance', 'notifications'],
      related: ['project-creation', 'matching-rules', 'notification-settings'],
      tips: [
        {
          id: 'tip-1',
          title: 'Default Settings',
          content: 'Start with default settings and adjust based on your data patterns.',
          category: 'tip',
        },
      ],
    });

    // 3. Data Source Configuration
    this.helpContent.set('data-source-config', {
      id: 'data-source-config',
      feature: 'data_ingestion',
      title: 'Configuring Data Sources',
      content: 'Add data sources by uploading files or connecting to external systems. Supported formats include CSV, Excel, JSON, and API connections.',
      category: 'data_ingestion',
      keywords: ['data source', 'upload', 'file', 'api', 'connection'],
      related: ['file-upload', 'field-mapping', 'api-integration'],
      tips: [
        {
          id: 'tip-1',
          title: 'File Formats',
          content: 'CSV files should have headers in the first row. Excel files support multiple sheets.',
          category: 'guide',
        },
        {
          id: 'tip-2',
          title: 'Large Files',
          content: 'For files larger than 10MB, consider using API connections instead of direct uploads.',
          category: 'tip',
        },
      ],
      links: [
        { title: 'File Format Guide', url: '/help/file-formats', type: 'article' },
        { title: 'API Integration Guide', url: '/help/api-integration', type: 'article' },
      ],
    });

    // 4. File Upload
    this.helpContent.set('file-upload', {
      id: 'file-upload',
      feature: 'data_ingestion',
      title: 'Uploading Files',
      content: 'Drag and drop files or click to browse. The system automatically detects the format and validates the data structure.',
      category: 'data_ingestion',
      keywords: ['upload', 'file', 'drag', 'drop', 'browse', 'csv', 'excel'],
      related: ['data-source-config', 'field-mapping', 'data-validation'],
      tips: [
        {
          id: 'tip-1',
          title: 'Drag and Drop',
          content: 'Drag multiple files at once for faster uploads.',
          category: 'tip',
        },
        {
          id: 'tip-2',
          title: 'File Validation',
          content: 'Check file format and data quality before uploading to avoid errors.',
          category: 'guide',
        },
      ],
    });

    // 5. Field Mapping
    this.helpContent.set('field-mapping', {
      id: 'field-mapping',
      feature: 'data_ingestion',
      title: 'Field Mapping',
      content: 'Map your data fields to system fields. Use AI suggestions for automatic mapping or manually map fields for precise control.',
      category: 'data_ingestion',
      keywords: ['mapping', 'fields', 'columns', 'ai', 'automatic', 'manual'],
      related: ['file-upload', 'data-source-config', 'matching-rules'],
      tips: [
        {
          id: 'tip-1',
          title: 'AI Suggestions',
          content: 'Let AI suggest field mappings based on column names and data patterns.',
          category: 'tip',
        },
        {
          id: 'tip-2',
          title: 'Manual Override',
          content: 'Review and adjust AI suggestions to match your requirements.',
          category: 'tip',
        },
      ],
    });

    // 6. Matching Rules Configuration
    this.helpContent.set('matching-rules', {
      id: 'matching-rules',
      feature: 'reconciliation',
      title: 'Configuring Matching Rules',
      content: 'Define matching rules to identify related records between data sources. Rules can be exact matches, fuzzy matches, or custom logic.',
      category: 'reconciliation',
      keywords: ['matching', 'rules', 'match', 'criteria', 'fuzzy', 'exact'],
      related: ['reconciliation-execution', 'match-review', 'confidence-scores'],
      tips: [
        {
          id: 'tip-1',
          title: 'Start Simple',
          content: 'Begin with exact matches on key fields, then add fuzzy matching for variations.',
          category: 'guide',
        },
        {
          id: 'tip-2',
          title: 'Test Rules',
          content: 'Test matching rules with sample data before running full reconciliation.',
          category: 'tip',
        },
      ],
    });

    // 7. Reconciliation Execution
    this.helpContent.set('reconciliation-execution', {
      id: 'reconciliation-execution',
      feature: 'reconciliation',
      title: 'Running Reconciliation',
      content: 'Execute reconciliation jobs to match records between data sources. Monitor progress in real-time and review results.',
      category: 'reconciliation',
      keywords: ['reconciliation', 'run', 'execute', 'job', 'matching', 'progress'],
      related: ['matching-rules', 'match-review', 'reconciliation-results'],
      tips: [
        {
          id: 'tip-1',
          title: 'Large Datasets',
          content: 'For large datasets, reconciliation may take several minutes. Progress is shown in real-time.',
          category: 'tip',
        },
        {
          id: 'tip-2',
          title: 'Background Processing',
          content: 'You can continue working while reconciliation runs in the background.',
          category: 'tip',
        },
      ],
    });

    // 8. Match Review and Approval
    this.helpContent.set('match-review', {
      id: 'match-review',
      feature: 'reconciliation',
      title: 'Reviewing Matches',
      content: 'Review automatically matched records and approve or reject matches. Adjust match scores and handle discrepancies.',
      category: 'reconciliation',
      keywords: ['review', 'matches', 'approve', 'reject', 'scores', 'confidence'],
      related: ['reconciliation-execution', 'discrepancy-resolution', 'match-approval'],
      tips: [
        {
          id: 'tip-1',
          title: 'Match Scores',
          content: 'Focus on matches with lower confidence scores for review.',
          category: 'tip',
        },
        {
          id: 'tip-2',
          title: 'Bulk Actions',
          content: 'Use bulk approve/reject for multiple matches with similar confidence levels.',
          category: 'tip',
        },
      ],
    });

    // 9. Discrepancy Resolution
    this.helpContent.set('discrepancy-resolution', {
      id: 'discrepancy-resolution',
      feature: 'adjudication',
      title: 'Resolving Discrepancies',
      content: 'Handle unmatched records and discrepancies by reviewing data, adjusting rules, or manual reconciliation.',
      category: 'adjudication',
      keywords: ['discrepancy', 'unmatched', 'resolve', 'adjudication', 'differences'],
      related: ['match-review', 'reconciliation-execution', 'manual-reconciliation'],
      tips: [
        {
          id: 'tip-1',
          title: 'Data Quality',
          content: 'Many discrepancies stem from data quality issues. Check data completeness and format.',
          category: 'guide',
        },
        {
          id: 'tip-2',
          title: 'Manual Review',
          content: 'Use manual reconciliation for complex cases that automated matching cannot handle.',
          category: 'tip',
        },
      ],
    });

    // 10. Visualization Options
    this.helpContent.set('visualization', {
      id: 'visualization',
      feature: 'visualization',
      title: 'Viewing Results',
      content: 'Visualize reconciliation results with charts, graphs, and reports. Export data for further analysis.',
      category: 'visualization',
      keywords: ['visualization', 'charts', 'graphs', 'reports', 'export', 'analysis'],
      related: ['reconciliation-results', 'export-functionality', 'reporting'],
      tips: [
        {
          id: 'tip-1',
          title: 'Interactive Charts',
          content: 'Click on chart elements to filter and drill down into specific data.',
          category: 'tip',
        },
        {
          id: 'tip-2',
          title: 'Custom Reports',
          content: 'Create custom reports with specific metrics and date ranges.',
          category: 'tip',
        },
      ],
    });

    // 11. Export Functionality
    this.helpContent.set('export-functionality', {
      id: 'export-functionality',
      feature: 'export',
      title: 'Exporting Results',
      content: 'Export reconciliation results in various formats: CSV, Excel, PDF, or JSON. Scheduled exports are also supported.',
      category: 'export',
      keywords: ['export', 'download', 'csv', 'excel', 'pdf', 'json', 'scheduled'],
      related: ['visualization', 'reconciliation-results', 'scheduled-jobs'],
      tips: [
        {
          id: 'tip-1',
          title: 'Format Selection',
          content: 'CSV for data analysis, Excel for formatted reports, PDF for documentation.',
          category: 'tip',
        },
        {
          id: 'tip-2',
          title: 'Scheduled Exports',
          content: 'Set up scheduled exports for regular reporting needs.',
          category: 'tip',
        },
      ],
    });

    // 12. Settings Management
    this.helpContent.set('settings-management', {
      id: 'settings-management',
      feature: 'settings',
      title: 'System Settings',
      content: 'Configure system-wide settings including integrations, API keys, webhooks, and user preferences.',
      category: 'settings',
      keywords: ['settings', 'configuration', 'api', 'webhooks', 'integrations', 'preferences'],
      related: ['api-integration', 'webhook-configuration', 'user-preferences'],
      tips: [
        {
          id: 'tip-1',
          title: 'API Keys',
          content: 'Keep API keys secure and rotate them regularly for security.',
          category: 'guide',
        },
      ],
    });

    // 13. User Management
    this.helpContent.set('user-management', {
      id: 'user-management',
      feature: 'user_management',
      title: 'Managing Users',
      content: 'Invite team members, assign roles, and manage permissions. Collaboration improves reconciliation accuracy.',
      category: 'user_management',
      keywords: ['users', 'team', 'roles', 'permissions', 'collaboration', 'invite'],
      related: ['project-collaboration', 'role-permissions', 'team-settings'],
      tips: [
        {
          id: 'tip-1',
          title: 'Role Assignment',
          content: 'Assign appropriate roles based on user responsibilities: Admin, Analyst, or Viewer.',
          category: 'guide',
        },
      ],
    });

    // 14. API Integration
    this.helpContent.set('api-integration', {
      id: 'api-integration',
      feature: 'integration',
      title: 'API Integration',
      content: 'Connect external systems via REST API. Use API keys for authentication and configure endpoints for data synchronization.',
      category: 'integration',
      keywords: ['api', 'integration', 'rest', 'endpoints', 'authentication', 'keys'],
      related: ['data-source-config', 'webhook-configuration', 'settings-management'],
      links: [
        { title: 'API Documentation', url: '/api/docs', type: 'external' },
      ],
    });

    // 15. Webhook Configuration
    this.helpContent.set('webhook-configuration', {
      id: 'webhook-configuration',
      feature: 'integration',
      title: 'Configuring Webhooks',
      content: 'Set up webhooks to receive real-time notifications about reconciliation events. Webhooks can trigger external workflows.',
      category: 'integration',
      keywords: ['webhook', 'notifications', 'events', 'triggers', 'real-time'],
      related: ['api-integration', 'notification-settings', 'settings-management'],
    });

    // 16. Scheduled Jobs
    this.helpContent.set('scheduled-jobs', {
      id: 'scheduled-jobs',
      feature: 'automation',
      title: 'Scheduled Jobs',
      content: 'Schedule reconciliation jobs to run automatically at specified times. Set up recurring jobs for regular reconciliation needs.',
      category: 'automation',
      keywords: ['schedule', 'automation', 'recurring', 'jobs', 'cron'],
      related: ['reconciliation-execution', 'export-functionality', 'notification-settings'],
    });

    // 17. Report Generation
    this.helpContent.set('report-generation', {
      id: 'report-generation',
      feature: 'reporting',
      title: 'Generating Reports',
      content: 'Create detailed reconciliation reports with metrics, charts, and summaries. Customize report templates for your needs.',
      category: 'reporting',
      keywords: ['reports', 'generation', 'metrics', 'charts', 'summaries', 'templates'],
      related: ['visualization', 'export-functionality', 'reconciliation-results'],
    });

    // 18. Data Quality Checks
    this.helpContent.set('data-quality-checks', {
      id: 'data-quality-checks',
      feature: 'data_quality',
      title: 'Data Quality Validation',
      content: 'Validate data quality before reconciliation. Check for completeness, duplicates, and format issues.',
      category: 'data_quality',
      keywords: ['data quality', 'validation', 'completeness', 'duplicates', 'format'],
      related: ['file-upload', 'field-mapping', 'data-validation'],
    });

    // 19. Error Handling
    this.helpContent.set('error-handling', {
      id: 'error-handling',
      feature: 'troubleshooting',
      title: 'Handling Errors',
      content: 'Common errors and their solutions. Learn how to resolve upload failures, matching errors, and system issues.',
      category: 'troubleshooting',
      keywords: ['error', 'troubleshooting', 'debug', 'fix', 'solution'],
      related: ['data-quality-checks', 'file-upload', 'reconciliation-execution'],
      tips: [
        {
          id: 'tip-1',
          title: 'Error Messages',
          content: 'Read error messages carefully. They often indicate the specific issue and solution.',
          category: 'guide',
        },
        {
          id: 'tip-2',
          title: 'Contact Support',
          content: 'If errors persist, check the help center or contact support with error details.',
          category: 'tip',
        },
      ],
    });

    // 20. Performance Optimization
    this.helpContent.set('performance-optimization', {
      id: 'performance-optimization',
      feature: 'optimization',
      title: 'Optimizing Performance',
      content: 'Tips for improving reconciliation speed and efficiency. Optimize matching rules and data processing.',
      category: 'optimization',
      keywords: ['performance', 'optimization', 'speed', 'efficiency', 'rules'],
      related: ['matching-rules', 'reconciliation-execution', 'data-quality-checks'],
      tips: [
        {
          id: 'tip-1',
          title: 'Rule Optimization',
          content: 'Simplify matching rules to improve processing speed.',
          category: 'tip',
        },
        {
          id: 'tip-2',
          title: 'Data Preparation',
          content: 'Clean and prepare data before reconciliation to reduce processing time.',
          category: 'tip',
        },
      ],
    });

    logger.info('Help content initialized', { count: this.helpContent.size });
  }

  /**
   * Build search index
   */
  private buildSearchIndex(): void {
    this.helpContent.forEach((content, id) => {
      const allKeywords = [
        ...content.keywords,
        ...content.title.toLowerCase().split(' '),
        ...content.content.toLowerCase().split(' '),
        content.feature.toLowerCase(),
        content.category.toLowerCase(),
      ];

      allKeywords.forEach((keyword) => {
        const normalized = keyword.toLowerCase().trim();
        if (normalized.length > 2) {
          const existing = this.searchIndex.get(normalized) || [];
          if (!existing.includes(id)) {
            existing.push(id);
            this.searchIndex.set(normalized, existing);
          }
        }
      });
    });
  }

  /**
   * Get help content by ID
   */
  getContent(id: string): HelpContent | null {
    return this.helpContent.get(id) || null;
  }

  /**
   * Get help content by feature
   */
  getContentByFeature(feature: string): HelpContent[] {
    return Array.from(this.helpContent.values()).filter(
      (content) => content.feature === feature
    );
  }

  /**
   * Search help content
   */
  search(query: string, limit: number = 10): HelpContent[] {
    if (!query || query.length < 2) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const queryWords = normalizedQuery.split(' ').filter((w) => w.length > 2);
    
    const scoreMap = new Map<string, number>();
    
    queryWords.forEach((word) => {
      const matches = this.searchIndex.get(word) || [];
      matches.forEach((contentId) => {
        const currentScore = scoreMap.get(contentId) || 0;
        scoreMap.set(contentId, currentScore + 1);
      });
    });

    // Sort by score and relevance
    const sorted = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => this.helpContent.get(id))
      .filter((content): content is HelpContent => content !== undefined);

    return sorted;
  }

  /**
   * Get related articles
   */
  getRelated(id: string, limit: number = 5): HelpContent[] {
    const content = this.helpContent.get(id);
    if (!content || !content.related) {
      return [];
    }

    return content.related
      .slice(0, limit)
      .map((relatedId) => this.helpContent.get(relatedId))
      .filter((c): c is HelpContent => c !== undefined);
  }

  /**
   * Track content view
   */
  trackView(id: string): void {
    const content = this.helpContent.get(id);
    if (content) {
      content.views = (content.views || 0) + 1;
      logger.debug('Help content viewed', { id, views: content.views });
    }
  }

  /**
   * Track helpful feedback
   */
  trackFeedback(id: string, helpful: boolean): void {
    const content = this.helpContent.get(id);
    if (content) {
      if (helpful) {
        content.helpful = (content.helpful || 0) + 1;
      } else {
        content.notHelpful = (content.notHelpful || 0) + 1;
      }
      logger.debug('Help content feedback', { id, helpful });
    }
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.helpContent.forEach((content) => {
      categories.add(content.category);
    });
    return Array.from(categories).sort();
  }

  /**
   * Get popular content
   */
  getPopular(limit: number = 10): HelpContent[] {
    return Array.from(this.helpContent.values())
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit);
  }
}

export const helpContentService = HelpContentService.getInstance();

