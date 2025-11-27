/**
 * Help Content List Component
 * 
 * Displays list of help content with CRUD operations
 */

import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, BookOpen } from 'lucide-react';
import type { HelpContent } from '../types';
import { HelpContentForm } from './HelpContentForm';
import type { HelpContentFormData } from '../types';

interface HelpContentListProps {
  contents: HelpContent[];
  onContentCreate: (data: HelpContentFormData) => void;
  onContentUpdate: (id: string, data: HelpContentFormData) => void;
  onContentDelete: (id: string) => void;
  onContentView: (id: string) => void;
}

export const HelpContentList: React.FC<HelpContentListProps> = ({
  contents,
  onContentCreate,
  onContentUpdate,
  onContentDelete,
  onContentView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<HelpContent | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    contents.forEach((content) => {
      if (content.category) {
        cats.add(content.category);
      }
    });
    return Array.from(cats).sort();
  }, [contents]);

  const filteredContents = useMemo(() => {
    return contents.filter((content) => {
      const matchesSearch =
        !searchQuery ||
        content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || content.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [contents, searchQuery, selectedCategory]);

  const handleCreate = () => {
    setEditingContent(null);
    setShowForm(true);
  };

  const handleEdit = (content: HelpContent) => {
    setEditingContent(content);
    setShowForm(true);
  };

  const handleSave = (data: HelpContentFormData) => {
    if (editingContent) {
      onContentUpdate(editingContent.id, data);
    } else {
      onContentCreate(data);
    }
    setShowForm(false);
    setEditingContent(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this help content?')) {
      onContentDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Help Content Management</h2>
          <p className="text-secondary-600 mt-1">
            Manage help content, articles, and documentation
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Content</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help content..."
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContents.map((content) => (
          <div
            key={content.id}
            className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 flex-1">
                <BookOpen className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <h3 className="font-semibold text-secondary-900 line-clamp-2">
                  {content.title}
                </h3>
              </div>
            </div>

            {content.category && (
              <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded mb-2">
                {content.category}
              </span>
            )}

            <p className="text-sm text-secondary-600 mb-3 line-clamp-3">
              {content.content.substring(0, 150)}...
            </p>

            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {content.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-secondary-100 text-secondary-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {content.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-xs text-secondary-500">
                    +{content.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-secondary-200">
              <button
                onClick={() => onContentView(content.id)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(content)}
                  className="text-secondary-600 hover:text-primary-600"
                  aria-label="Edit content"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(content.id)}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Delete content"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredContents.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No content found</h3>
          <p className="text-secondary-600">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first help content to get started.'}
          </p>
        </div>
      )}

      {/* Form Modal */}
      <HelpContentForm
        content={editingContent || undefined}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingContent(null);
        }}
        isOpen={showForm}
      />
    </div>
  );
};

