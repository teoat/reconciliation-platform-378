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
    return Array.from(this.content.values()).filter(
      (content) => content.relatedFeatures?.includes(featureId)
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
      const titleMatches = searchTerms.filter((term) =>
        content.title.toLowerCase().includes(term)
      );
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
