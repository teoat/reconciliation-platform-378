/**
 * Help Content Service
 * 
 * Manages help content referenced by features in the feature registry.
 * Supports markdown and rich content for contextual guidance.
 */

import { logger } from './logger';

// ============================================================================
// TYPES
// ============================================================================

export interface HelpContent {
  id: string;
  title: string;
  content: string;
  format: 'markdown' | 'html' | 'plain';
  category?: string;
  tags?: string[];
  relatedFeatures?: string[];
  lastUpdated?: Date;
}

interface HelpContentCache {
  content: HelpContent;
  timestamp: number;
  expiresAt: number;
}

// ============================================================================
// HELP CONTENT SERVICE
// ============================================================================

class HelpContentService {
  private static instance: HelpContentService;
  private contentCache: Map<string, HelpContentCache> = new Map();
  private readonly cacheTimeout = 60 * 60 * 1000; // 1 hour
  private contentStore: Map<string, HelpContent> = new Map();

  private constructor() {
    this.initializeDefaultContent();
  }

  static getInstance(): HelpContentService {
    if (!HelpContentService.instance) {
      HelpContentService.instance = new HelpContentService();
    }
    return HelpContentService.instance;
  }

  /**
   * Initialize default help content
   */
  private initializeDefaultContent(): void {
    // Default help content for common features
    const defaultContent: HelpContent[] = [
      {
        id: 'data-ingestion:file-upload',
        title: 'File Upload Guide',
        content: `# File Upload Guide

## Supported Formats
- CSV files with headers
- Excel files (.xlsx, .xls)
- JSON files

## Best Practices
1. Ensure files have headers in the first row
2. Use consistent column names
3. Check data quality before uploading
4. Large files may take time to process`,
        format: 'markdown',
        category: 'data-ingestion',
        tags: ['upload', 'files', 'data'],
        relatedFeatures: ['data-ingestion:file-upload'],
      },
      {
        id: 'reconciliation:matching',
        title: 'Reconciliation Matching Guide',
        content: `# Reconciliation Matching Guide

## Matching Strategies
1. Start with higher tolerance levels
2. Gradually reduce tolerance for better matches
3. Review unmatched records carefully
4. Use multiple matching criteria

## Tips
- Configure matching rules before running
- Review match scores
- Adjust rules based on results`,
        format: 'markdown',
        category: 'reconciliation',
        tags: ['matching', 'reconciliation', 'rules'],
        relatedFeatures: ['reconciliation:matching'],
      },
    ];

    defaultContent.forEach(content => {
      this.contentStore.set(content.id, content);
    });
  }

  /**
   * Get help content by ID
   */
  async getHelpContent(contentId: string): Promise<HelpContent | null> {
    // Check cache first
    const cached = this.contentCache.get(contentId);
    if (cached && Date.now() < cached.expiresAt) {
      logger.debug('Using cached help content', { contentId });
      return cached.content;
    }

    // Check local store
    const content = this.contentStore.get(contentId);
    if (content) {
      // Cache it
      this.contentCache.set(contentId, {
        content,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.cacheTimeout,
      });
      return content;
    }

    // Try to fetch from backend (if API exists)
    try {
      // TODO: Implement API call when backend endpoint is available
      // const response = await fetch(`/api/help-content/${contentId}`);
      // if (response.ok) {
      //   const content = await response.json();
      //   this.contentStore.set(contentId, content);
      //   return content;
      // }
    } catch (error) {
      logger.error('Failed to fetch help content from backend', { contentId, error });
    }

    logger.warn('Help content not found', { contentId });
    return null;
  }

  /**
   * Get multiple help content items
   */
  async getHelpContentBatch(contentIds: string[]): Promise<Map<string, HelpContent>> {
    const results = new Map<string, HelpContent>();
    
    await Promise.all(
      contentIds.map(async (id) => {
        const content = await this.getHelpContent(id);
        if (content) {
          results.set(id, content);
        }
      })
    );

    return results;
  }

  /**
   * Register help content
   */
  registerHelpContent(content: HelpContent): void {
    this.contentStore.set(content.id, {
      ...content,
      lastUpdated: new Date(),
    });
    
    // Invalidate cache
    this.contentCache.delete(content.id);
    
    logger.debug('Help content registered', { contentId: content.id });
  }

  /**
   * Search help content
   */
  searchHelpContent(query: string, category?: string): HelpContent[] {
    const lowerQuery = query.toLowerCase();
    const results: HelpContent[] = [];

    for (const content of this.contentStore.values()) {
      // Filter by category if specified
      if (category && content.category !== category) {
        continue;
      }

      // Search in title, content, and tags
      const matches =
        content.title.toLowerCase().includes(lowerQuery) ||
        content.content.toLowerCase().includes(lowerQuery) ||
        content.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));

      if (matches) {
        results.push(content);
      }
    }

    return results;
  }

  /**
   * Get help content by feature ID
   */
  async getHelpContentForFeature(featureId: string): Promise<HelpContent[]> {
    const results: HelpContent[] = [];

    for (const content of this.contentStore.values()) {
      if (content.relatedFeatures?.includes(featureId)) {
        results.push(content);
      }
    }

    return results;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.contentCache.clear();
    logger.debug('Help content cache cleared');
  }

  /**
   * Get all help content
   */
  getAllHelpContent(): HelpContent[] {
    return Array.from(this.contentStore.values());
  }
}

// Export singleton instance
export const helpContentService = HelpContentService.getInstance();

// Export class for testing
export { HelpContentService };
