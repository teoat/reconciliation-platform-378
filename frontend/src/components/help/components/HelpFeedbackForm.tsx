/**
 * Help Feedback Form Component
 * 
 * Form for submitting feedback on help content
 */

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Star, X } from 'lucide-react';

export interface HelpFeedbackFormData {
  helpful: boolean;
  comment?: string;
  rating?: number;
}

interface HelpFeedbackFormProps {
  contentId: string;
  contentTitle: string;
  onSubmit: (data: HelpFeedbackFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const HelpFeedbackForm: React.FC<HelpFeedbackFormProps> = ({
  contentId,
  contentTitle,
  onSubmit,
  onCancel,
  isOpen,
}) => {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (helpful !== null) {
      onSubmit({
        helpful,
        comment: comment.trim() || undefined,
        rating: rating > 0 ? rating : undefined,
      });
      // Reset form
      setHelpful(null);
      setRating(0);
      setComment('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Help Feedback</h3>
          <button
            onClick={onCancel}
            className="text-secondary-400 hover:text-secondary-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-secondary-600 mb-6">
          Was this help content about <strong>{contentTitle}</strong> helpful?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Helpful/Not Helpful */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Was this helpful? *
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setHelpful(true)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 border-2 rounded-lg transition-colors ${
                  helpful === true
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-secondary-300 text-secondary-700 hover:border-green-300'
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                <span>Yes</span>
              </button>
              <button
                type="button"
                onClick={() => setHelpful(false)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 border-2 rounded-lg transition-colors ${
                  helpful === false
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-secondary-300 text-secondary-700 hover:border-red-300'
                }`}
              >
                <ThumbsDown className="w-5 h-5" />
                <span>No</span>
              </button>
            </div>
          </div>

          {/* Rating */}
          {helpful !== null && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Rating (optional)
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`p-2 rounded transition-colors ${
                      rating >= value
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-secondary-300 hover:text-yellow-400'
                    }`}
                    aria-label={`Rate ${value} stars`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comment */}
          {helpful !== null && (
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-secondary-700 mb-2">
                Additional Comments (optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Tell us more about your experience..."
              />
            </div>
          )}

          {/* Actions */}
          {helpful !== null && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Submit Feedback
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

