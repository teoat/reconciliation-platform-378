/**
 * Help Search Component
 * 
 * Provides search functionality for help content using HelpContentService
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, BookOpen, Clock } from 'lucide-react';
import { helpContentService, HelpSearchResult } from '../../services/helpContentService';

export interface HelpSearchProps {
  onSelectContent?: (contentId: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const HelpSearch: React.FC<HelpSearchProps> = ({
  onSelectContent,
  placeholder = 'Search help articles...',
  className = '',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HelpSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const searchResults = helpContentService.search(query);
      setResults(searchResults);
      setShowResults(true);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showResults || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleSelectContent(results[selectedIndex].content.id);
          }
          break;
        case 'Escape':
          setShowResults(false);
          setQuery('');
          break;
      }
    },
    [showResults, results, selectedIndex]
  );

  const handleSelectContent = (contentId: string) => {
    helpContentService.trackView(contentId);
    if (onSelectContent) {
      onSelectContent(contentId);
    }
    setShowResults(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    searchInputRef.current?.focus();
  };

  // Get search history
  const searchHistory = helpContentService.getSearchHistory();

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() || searchHistory.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          autoFocus={false}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search help articles"
          aria-expanded={showResults}
          aria-haspopup="listbox"
          aria-controls="help-search-results"
          role="combobox"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <ul id="help-search-results" role="listbox" className="py-1">
              {results.map((result, index) => (
                <li
                  key={result.content.id}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectContent(result.content.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectContent(result.content.id);
                    }
                  }}
                  tabIndex={0}
                >
                  <div className="flex items-start">
                    <BookOpen className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {result.content.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {result.content.content}
                      </div>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <span className="capitalize">{result.content.category}</span>
                        {result.relevanceScore > 0 && (
                          <span className="ml-2">
                            {Math.round(result.relevanceScore)}% match
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-500">
              No results found for &quot;{query}&quot;
            </div>
          ) : searchHistory.length > 0 ? (
            <div className="py-1">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                Recent Searches
              </div>
              {searchHistory.slice(0, 5).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  {term}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

