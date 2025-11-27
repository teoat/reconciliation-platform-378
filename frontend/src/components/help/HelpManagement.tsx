/**
 * Help Management Component
 * 
 * Main component for managing help content, analytics, and feedback
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, BarChart3, MessageSquare } from 'lucide-react';
import { helpContentService } from '../../services/helpContentService';
import type { HelpContent } from '../../services/helpContentService';
import {
  HelpContentList,
  HelpAnalyticsDashboard,
  HelpFeedbackList,
  HelpFeedbackForm,
} from './components';
import type { HelpContentFormData, HelpAnalytics, HelpFeedback, HelpSearchQuery } from './types';

type TabId = 'content' | 'analytics' | 'feedback';

export const HelpManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('content');
  const [contents, setContents] = useState<HelpContent[]>([]);
  const [analytics, setAnalytics] = useState<HelpAnalytics[]>([]);
  const [feedback, setFeedback] = useState<HelpFeedback[]>([]);
  const [searchQueries, setSearchQueries] = useState<HelpSearchQuery[]>([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>('');

  useEffect(() => {
    loadContents();
    loadAnalytics();
    loadFeedback();
    loadSearchQueries();
  }, []);

  const loadContents = () => {
    // Load all help content from service
    const allContent = helpContentService.getAllContent();
    setContents(allContent);
  };

  const loadAnalytics = () => {
    // Mock analytics data - in real implementation, fetch from API
    const mockAnalytics: HelpAnalytics[] = contents.map((content) => ({
      contentId: content.id,
      title: content.title,
      views: Math.floor(Math.random() * 1000),
      searches: Math.floor(Math.random() * 100),
      feedbackCount: Math.floor(Math.random() * 50),
      averageRating: Math.random() * 5,
      lastViewed: new Date(),
      popularQueries: [],
    }));
    setAnalytics(mockAnalytics);
  };

  const loadFeedback = () => {
    // Mock feedback data - in real implementation, fetch from API
    const mockFeedback: HelpFeedback[] = [];
    setFeedback(mockFeedback);
  };

  const loadSearchQueries = () => {
    // Mock search queries - in real implementation, fetch from API
    const mockQueries: HelpSearchQuery[] = [];
    setSearchQueries(mockQueries);
  };

  const handleContentCreate = (data: HelpContentFormData) => {
    // In real implementation, call API to create content
    const newContent: HelpContent = {
      id: `help-${Date.now()}`,
      ...data,
      lastUpdated: new Date(),
    };
    helpContentService.addContent(newContent);
    loadContents();
  };

  const handleContentUpdate = (id: string, data: HelpContentFormData) => {
    // In real implementation, call API to update content
    const updatedContent: HelpContent = {
      id,
      ...data,
      lastUpdated: new Date(),
    };
    helpContentService.updateContent(id, updatedContent);
    loadContents();
  };

  const handleContentDelete = (id: string) => {
    // In real implementation, call API to delete content
    helpContentService.deleteContent(id);
    loadContents();
  };

  const handleContentView = (id: string) => {
    // Navigate to content view or open in modal
    const content = contents.find((c) => c.id === id);
    if (content) {
      setSelectedContentId(id);
      setShowFeedbackForm(true);
    }
  };

  const handleFeedbackSubmit = (data: import('./components/HelpFeedbackForm').HelpFeedbackFormData) => {
    // In real implementation, call API to submit feedback
    const newFeedback: HelpFeedback = {
      id: `feedback-${Date.now()}`,
      contentId: selectedContentId,
      userId: 'current-user', // Get from auth context
      helpful: data.helpful,
      comment: data.comment,
      rating: data.rating,
      timestamp: new Date(),
      resolved: false,
    };
    setFeedback([...feedback, newFeedback]);
    setShowFeedbackForm(false);
    setSelectedContentId('');
  };

  const handleFeedbackResolve = (id: string) => {
    setFeedback(feedback.map((f) => (f.id === id ? { ...f, resolved: true } : f)));
  };

  const handleFeedbackDelete = (id: string) => {
    setFeedback(feedback.filter((f) => f.id !== id));
  };

  const tabs = [
    { id: 'content' as TabId, label: 'Content', icon: BookOpen },
    { id: 'analytics' as TabId, label: 'Analytics', icon: BarChart3 },
    { id: 'feedback' as TabId, label: 'Feedback', icon: MessageSquare },
  ];

  const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
  const totalSearches = searchQueries.length;
  const totalFeedbackCount = feedback.length;
  const averageRating =
    feedback.filter((f) => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) /
      feedback.filter((f) => f.rating).length || 0;

  const selectedContent = contents.find((c) => c.id === selectedContentId);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="card mb-6">
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'content' && (
          <div className="p-6">
            <HelpContentList
              contents={contents}
              onContentCreate={handleContentCreate}
              onContentUpdate={handleContentUpdate}
              onContentDelete={handleContentDelete}
              onContentView={handleContentView}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6">
            <HelpAnalyticsDashboard
              analytics={analytics}
              searchQueries={searchQueries}
              totalViews={totalViews}
              totalSearches={totalSearches}
              totalFeedback={totalFeedbackCount}
              averageRating={averageRating}
            />
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="p-6">
            <HelpFeedbackList
              feedback={feedback}
              onResolve={handleFeedbackResolve}
              onDelete={handleFeedbackDelete}
            />
          </div>
        )}
      </div>

      {/* Feedback Form Modal */}
      {showFeedbackForm && selectedContent && (
        <HelpFeedbackForm
          contentId={selectedContent.id}
          contentTitle={selectedContent.title}
          onSubmit={handleFeedbackSubmit}
          onCancel={() => {
            setShowFeedbackForm(false);
            setSelectedContentId('');
          }}
          isOpen={showFeedbackForm}
        />
      )}
    </div>
  );
};

