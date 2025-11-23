/**
 * Help Content Service
 * 
 * Manages help content, search, and categorization for contextual help system.
 */

export interface HelpContent {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relatedArticles?: string[];
  videoUrl?: string;
  codeExamples?: string[];
  lastUpdated: string;
  views?: number;
  helpful?: number;
  notHelpful?: number;
}

export interface HelpSearchResult {
  content: HelpContent;
  relevanceScore: number;
  matchedTerms: string[];
}

class HelpContentService {
  private content: Map<string, HelpContent> = new Map();
  private searchHistory: string[] = [];

  /**
   * Initialize with default help content
   */
  initialize(): void {
    // This would typically load from API or local storage
    // For now, we'll create a basic structure
    this.loadDefaultContent();
  }

  /**
   * Load default help content
   */
  private loadDefaultContent(): void {
    // Placeholder content - in production, this would come from API
    const defaultContent: HelpContent[] = [
      {
        id: 'project-creation',
        title: 'Creating Your First Project',
        content: 'Learn how to create and configure a new reconciliation project.',
        category: 'projects',
        tags: ['project', 'create', 'setup', 'getting-started'],
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'file-upload',
        title: 'Uploading Data Files',
        content: 'Upload CSV, Excel, or other data files for reconciliation.',
        category: 'data-sources',
        tags: ['upload', 'file', 'data', 'import'],
        lastUpdated: new Date().toISOString(),
      },
    ];

    defaultContent.forEach((content) => {
      this.content.set(content.id, content);
    });
  }

  /**
   * Get help content by ID
   */
  getContent(id: string): HelpContent | undefined {
    return this.content.get(id);
  }

  /**
   * Get help content by category
   */
  getContentByCategory(category: string): HelpContent[] {
    return Array.from(this.content.values()).filter(
      (content) => content.category === category
    );
  }

  /**
   * Search help content
   */
  search(query: string): HelpSearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/);
    const results: HelpSearchResult[] = [];

    // Add to search history
    this.searchHistory.push(query);
    if (this.searchHistory.length > 10) {
      this.searchHistory.shift();
    }

    // Search through all content
    this.content.forEach((content) => {
      const matchedTerms: string[] = [];
      let relevanceScore = 0;

      // Check title (highest weight)
      const titleLower = content.title.toLowerCase();
      if (titleLower.includes(lowerQuery)) {
        relevanceScore += 10;
        matchedTerms.push('title');
      } else {
        terms.forEach((term) => {
          if (titleLower.includes(term)) {
            relevanceScore += 5;
            matchedTerms.push('title');
          }
        });
      }

      // Check content
      const contentLower = content.content.toLowerCase();
      terms.forEach((term) => {
        const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
        relevanceScore += matches;
        if (matches > 0) {
          matchedTerms.push('content');
        }
      });

      // Check tags (medium weight)
      content.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(lowerQuery)) {
          relevanceScore += 3;
          matchedTerms.push('tag');
        } else {
          terms.forEach((term) => {
            if (tag.toLowerCase().includes(term)) {
              relevanceScore += 2;
              matchedTerms.push('tag');
            }
          });
        }
      });

      if (relevanceScore > 0) {
        results.push({
          content,
          relevanceScore,
          matchedTerms: Array.from(new Set(matchedTerms)),
        });
      }
    });

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results;
  }

  /**
   * Get related articles
   */
  getRelatedArticles(contentId: string, limit: number = 3): HelpContent[] {
    const content = this.content.get(contentId);
    if (!content) {
      return [];
    }

    // If explicit related articles are defined, use those
    if (content.relatedArticles && content.relatedArticles.length > 0) {
      return content.relatedArticles
        .map((id) => this.content.get(id))
        .filter((c): c is HelpContent => c !== undefined)
        .slice(0, limit);
    }

    // Otherwise, find related by category and tags
    const related: HelpContent[] = [];
    const seenIds = new Set([contentId]);

    // Same category
    this.getContentByCategory(content.category).forEach((item) => {
      if (!seenIds.has(item.id)) {
        related.push(item);
        seenIds.add(item.id);
      }
    });

    // Shared tags
    this.content.forEach((item) => {
      if (seenIds.has(item.id)) return;

      const sharedTags = item.tags.filter((tag) =>
        content.tags.includes(tag)
      );
      if (sharedTags.length > 0) {
        related.push(item);
        seenIds.add(item.id);
      }
    });

    return related.slice(0, limit);
  }

  /**
   * Get search history
   */
  getSearchHistory(): string[] {
    return [...this.searchHistory].reverse();
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Track content view
   */
  trackView(contentId: string): void {
    const content = this.content.get(contentId);
    if (content) {
      content.views = (content.views || 0) + 1;
      this.content.set(contentId, content);
    }
  }

  /**
   * Mark content as helpful/not helpful
   */
  markHelpful(contentId: string, helpful: boolean): void {
    const content = this.content.get(contentId);
    if (content) {
      if (helpful) {
        content.helpful = (content.helpful || 0) + 1;
      } else {
        content.notHelpful = (content.notHelpful || 0) + 1;
      }
      this.content.set(contentId, content);
    }
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.content.forEach((content) => {
      categories.add(content.category);
    });
    return Array.from(categories).sort();
  }
}

// Export singleton instance
export const helpContentService = new HelpContentService();

// Initialize on import
helpContentService.initialize();
