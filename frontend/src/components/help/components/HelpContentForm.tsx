/**
 * Help Content Form Component
 * 
 * Form for creating and editing help content
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { HelpContent, HelpContentFormData } from '../types';

interface HelpContentFormProps {
  content?: HelpContent;
  onSave: (data: HelpContentFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const HelpContentForm: React.FC<HelpContentFormProps> = ({
  content,
  onSave,
  onCancel,
  isOpen,
}) => {
  const [formData, setFormData] = useState<HelpContentFormData>({
    title: '',
    content: '',
    format: 'markdown',
    category: '',
    tags: [],
    relatedFeatures: [],
    tips: [],
    links: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [tipInput, setTipInput] = useState('');

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title,
        content: content.content,
        format: content.format,
        category: content.category || '',
        tags: content.tags || [],
        relatedFeatures: content.relatedFeatures || [],
        tips: content.tips || [],
        videoUrl: content.videoUrl,
        interactiveExample: content.interactiveExample,
        links: content.links || [],
      });
    } else {
      setFormData({
        title: '',
        content: '',
        format: 'markdown',
        category: '',
        tags: [],
        relatedFeatures: [],
        tips: [],
        links: [],
      });
    }
  }, [content, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  const addTip = () => {
    if (tipInput.trim()) {
      setFormData({
        ...formData,
        tips: [
          ...(formData.tips || []),
          { id: `tip-${Date.now()}`, content: tipInput.trim() },
        ],
      });
      setTipInput('');
    }
  };

  const removeTip = (tipId: string) => {
    setFormData({
      ...formData,
      tips: formData.tips?.filter((t) => t.id !== tipId) || [],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-secondary-900">
            {content ? 'Edit Help Content' : 'Create Help Content'}
          </h2>
          <button
            onClick={onCancel}
            className="text-secondary-400 hover:text-secondary-600"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-secondary-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Format */}
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-secondary-700 mb-2">
              Format *
            </label>
            <select
              id="format"
              value={formData.format}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  format: e.target.value as 'markdown' | 'html' | 'plain',
                })
              }
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
              <option value="plain">Plain Text</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-secondary-700 mb-2">
              Category
            </label>
            <input
              id="category"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., data-ingestion, reconciliation"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-secondary-700 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags-input" className="block text-sm font-medium text-secondary-700 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                id="tags-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-secondary flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-primary-600"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <label htmlFor="tips-input" className="block text-sm font-medium text-secondary-700 mb-2">Tips</label>
            <div className="flex gap-2 mb-2">
              <input
                id="tips-input"
                type="text"
                value={tipInput}
                onChange={(e) => setTipInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTip();
                  }
                }}
                className="flex-1 px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add a tip"
              />
              <button
                type="button"
                onClick={addTip}
                className="btn-secondary flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-2">
              {formData.tips?.map((tip) => (
                <div
                  key={tip.id}
                  className="flex items-center justify-between p-2 bg-secondary-50 rounded"
                >
                  <span className="text-sm text-secondary-700">{tip.content}</span>
                  <button
                    type="button"
                    onClick={() => removeTip(tip.id)}
                    className="text-red-600 hover:text-red-800"
                    aria-label="Remove tip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-secondary-700 mb-2">
              Video URL
            </label>
            <input
              id="videoUrl"
              type="url"
              value={formData.videoUrl || ''}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/video"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {content ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

