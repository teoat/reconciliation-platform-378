/**
 * Help Analytics Dashboard Component
 * 
 * Displays analytics for help content usage
 */

import React, { useMemo } from 'react';
import { TrendingUp, Eye, Search, MessageSquare, Star } from 'lucide-react';
import type { HelpAnalytics, HelpSearchQuery } from '../types';

interface HelpAnalyticsDashboardProps {
  analytics: HelpAnalytics[];
  searchQueries: HelpSearchQuery[];
  totalViews: number;
  totalSearches: number;
  totalFeedback: number;
  averageRating: number;
}

export const HelpAnalyticsDashboard: React.FC<HelpAnalyticsDashboardProps> = ({
  analytics,
  searchQueries,
  totalViews,
  totalSearches,
  totalFeedback,
  averageRating,
}) => {
  const topContent = useMemo(() => {
    return [...analytics]
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [analytics]);

  const topQueries = useMemo(() => {
    const queryMap = new Map<string, number>();
    searchQueries.forEach((query) => {
      const count = queryMap.get(query.query) || 0;
      queryMap.set(query.query, count + 1);
    });

    return Array.from(queryMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [searchQueries]);

  const topRated = useMemo(() => {
    return [...analytics]
      .filter((a) => a.averageRating > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);
  }, [analytics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-900">Help Analytics</h2>
        <p className="text-secondary-600 mt-1">Track help content usage and user engagement</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Views</p>
              <p className="text-2xl font-bold text-secondary-900">{totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Searches</p>
              <p className="text-2xl font-bold text-secondary-900">
                {totalSearches.toLocaleString()}
              </p>
            </div>
            <Search className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Feedback</p>
              <p className="text-2xl font-bold text-secondary-900">
                {totalFeedback.toLocaleString()}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Average Rating</p>
              <p className="text-2xl font-bold text-secondary-900">
                {averageRating.toFixed(1)} / 5.0
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Top Content */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Most Viewed Content</span>
        </h3>
        <div className="space-y-3">
          {topContent.map((item, index) => (
            <div
              key={item.contentId}
              className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-sm font-medium text-secondary-500 w-6">{index + 1}</span>
                <div className="flex-1">
                  <p className="font-medium text-secondary-900">{item.title}</p>
                  <p className="text-sm text-secondary-600">
                    {item.views} views • {item.searches} searches
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-secondary-900">
                  {item.feedbackCount} feedback
                </p>
                {item.averageRating > 0 && (
                  <p className="text-xs text-secondary-600">
                    ⭐ {item.averageRating.toFixed(1)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Search Queries */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Popular Search Queries</span>
        </h3>
        <div className="space-y-2">
          {topQueries.map((item, index) => (
            <div
              key={item.query}
              className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-sm font-medium text-secondary-500 w-6">{index + 1}</span>
                <p className="text-secondary-900">{item.query}</p>
              </div>
              <span className="text-sm font-medium text-secondary-600">{item.count} searches</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Rated Content */}
      {topRated.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Top Rated Content</span>
          </h3>
          <div className="space-y-3">
            {topRated.map((item) => (
              <div
                key={item.contentId}
                className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-secondary-900">{item.title}</p>
                  <p className="text-sm text-secondary-600">
                    {item.views} views • {item.feedbackCount} ratings
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-600">
                    ⭐ {item.averageRating.toFixed(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

