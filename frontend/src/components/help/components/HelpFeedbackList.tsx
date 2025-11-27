/**
 * Help Feedback List Component
 * 
 * Displays and manages help content feedback
 */

import React, { useState, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, Star, Filter, CheckCircle } from 'lucide-react';
import type { HelpFeedback } from '../types';

interface HelpFeedbackListProps {
  feedback: HelpFeedback[];
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}

export const HelpFeedbackList: React.FC<HelpFeedbackListProps> = ({
  feedback,
  onResolve,
  onDelete,
}) => {
  const [filter, setFilter] = useState<'all' | 'helpful' | 'not-helpful' | 'unresolved'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating'>('newest');

  const filteredFeedback = useMemo(() => {
    let filtered = [...feedback];

    // Apply filter
    if (filter === 'helpful') {
      filtered = filtered.filter((f) => f.helpful === true);
    } else if (filter === 'not-helpful') {
      filtered = filtered.filter((f) => f.helpful === false);
    } else if (filter === 'unresolved') {
      filtered = filtered.filter((f) => !f.resolved);
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else {
        return (b.rating || 0) - (a.rating || 0);
      }
    });

    return filtered;
  }, [feedback, filter, sortBy]);

  const stats = useMemo(() => {
    const total = feedback.length;
    const helpful = feedback.filter((f) => f.helpful === true).length;
    const notHelpful = feedback.filter((f) => f.helpful === false).length;
    const unresolved = feedback.filter((f) => !f.resolved).length;
    const averageRating =
      feedback.filter((f) => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) /
      feedback.filter((f) => f.rating).length || 0;

    return { total, helpful, notHelpful, unresolved, averageRating };
  }, [feedback]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-900">Help Feedback</h2>
        <p className="text-secondary-600 mt-1">Review and manage user feedback on help content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-secondary-600">Total Feedback</p>
          <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-secondary-600">Helpful</p>
          <p className="text-2xl font-bold text-green-600">{stats.helpful}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-secondary-600">Not Helpful</p>
          <p className="text-2xl font-bold text-red-600">{stats.notHelpful}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-secondary-600">Average Rating</p>
          <p className="text-2xl font-bold text-secondary-900">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-secondary-500" />
          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value as 'all' | 'helpful' | 'not-helpful' | 'unresolved'
              )
            }
            className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Feedback</option>
            <option value="helpful">Helpful</option>
            <option value="not-helpful">Not Helpful</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'rating')}
          className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="rating">Highest Rating</option>
        </select>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 ${
              item.resolved
                ? 'border-secondary-200 bg-secondary-50'
                : 'border-secondary-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1">
                {item.helpful ? (
                  <ThumbsUp className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <ThumbsDown className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-secondary-900">Content: {item.contentId}</p>
                    {item.resolved && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-secondary-600">
                    User: {item.userId} • {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              {item.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-secondary-900">{item.rating}</span>
                </div>
              )}
            </div>

            {item.comment && (
              <div className="mb-3 p-3 bg-secondary-50 rounded">
                <p className="text-sm text-secondary-700">{item.comment}</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-secondary-200">
              {!item.resolved && (
                <button
                  onClick={() => onResolve(item.id)}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Resolved</span>
                </button>
              )}
              <button
                onClick={() => onDelete(item.id)}
                className="btn-secondary text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredFeedback.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No feedback found</h3>
          <p className="text-secondary-600">Try adjusting your filter criteria.</p>
        </div>
      )}
    </div>
  );
};

