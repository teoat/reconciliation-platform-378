/**
 * Help System Types
 */

export interface HelpContent {
  id: string;
  title: string;
  content: string;
  format: 'markdown' | 'html' | 'plain';
  category?: string;
  tags?: string[];
  relatedFeatures?: string[];
  lastUpdated?: Date;
  tips?: { id: string; content: string }[];
  videoUrl?: string;
  interactiveExample?: {
    title: string;
    description?: string;
    code?: string;
    demoUrl?: string;
  };
  links?: { id: string; url: string; label: string; type: 'internal' | 'external' }[];
}

export interface HelpAnalytics {
  contentId: string;
  title: string;
  views: number;
  searches: number;
  feedbackCount: number;
  averageRating: number;
  lastViewed?: Date;
  popularQueries: Array<{ query: string; count: number }>;
}

export interface HelpFeedback {
  id: string;
  contentId: string;
  userId: string;
  helpful: boolean;
  comment?: string;
  rating?: number;
  timestamp: Date;
  resolved?: boolean;
}

export interface HelpSearchQuery {
  query: string;
  timestamp: Date;
  resultsCount: number;
  clickedResult?: string;
}

export interface HelpContentFormData {
  title: string;
  content: string;
  format: 'markdown' | 'html' | 'plain';
  category?: string;
  tags?: string[];
  relatedFeatures?: string[];
  tips?: { id: string; content: string }[];
  videoUrl?: string;
  interactiveExample?: {
    title: string;
    description?: string;
    code?: string;
    demoUrl?: string;
  };
  links?: { id: string; url: string; label: string; type: 'internal' | 'external' }[];
}

