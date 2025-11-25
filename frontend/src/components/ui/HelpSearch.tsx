/**
 * Help Search Component
 *
 * Searchable help system with keyword matching and related articles.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Video, ExternalLink, ChevronRight } from 'lucide-react';
import { helpContentService, HelpContent } from '../../services/helpContentService';

export interface HelpSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onContentSelect?: (content: HelpContent) => void;
  className?: string;
}

export const HelpSearch: React.FC<HelpSearchProps> = ({
  isOpen,
  onClose,
  onContentSelect,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HelpContent[]>([]);
  const [popular, setPopular] = useState<HelpContent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load popular content on mount
  useEffect(() => {
    if (isOpen) {
      setPopular((helpContentService as any).getPopular(5));
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const searchResults = helpContentService.search(query);
      setResults(searchResults.slice(0, 10).map(r => r.content)); // Limit to 10 results and extract content
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = useCallback(
    (content: HelpContent) => {
      helpContentService.trackView(content.id);
      if (onContentSelect) {
        onContentSelect(content);
      }
      onClose();
    },
    [onContentSelect, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Search Modal */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl z-50 ${className}`}                 
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-search-title"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 id="help-search-title" className="text-lg font-semibold text-gray-900">
              Search Help Center
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for help articles..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4">
          {isSearching && <div className="text-center py-8 text-gray-500">Searching...</div>}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or check popular articles below</p>
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Search Results ({results.length})
              </h3>
              {results.map((content) => (
                <button
                  key={content.id}
                  onClick={() => handleSelect(content)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{content.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{content.content}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {content.category}
                        </span>
                        {content.videoUrl && (
                          <span className="text-xs text-blue-600 flex items-center">
                            <Video className="h-3 w-3 mr-1" />
                            Video
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query && popular.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Popular Articles</h3>
              {popular.map((content) => (
                <button
                  key={content.id}
                  onClick={() => handleSelect(content)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{content.title}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{content.content}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HelpSearch;
