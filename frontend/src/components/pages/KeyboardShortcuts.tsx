import React, { useState, useEffect } from 'react';
import { Keyboard, Search, X } from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

interface Shortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'actions' | 'workflow' | 'general';
  platform?: 'mac' | 'windows' | 'all';
}

const shortcuts: Shortcut[] = [
  // Navigation
  {
    keys: ['Tab'],
    description: 'Navigate to next focusable element',
    category: 'navigation',
  },
  {
    keys: ['Shift', 'Tab'],
    description: 'Navigate to previous focusable element',
    category: 'navigation',
  },
  {
    keys: ['ArrowUp'],
    description: 'Navigate up in current group',
    category: 'navigation',
  },
  {
    keys: ['ArrowDown'],
    description: 'Navigate down in current group',
    category: 'navigation',
  },
  {
    keys: ['ArrowLeft'],
    description: 'Navigate left in current group',
    category: 'navigation',
  },
  {
    keys: ['ArrowRight'],
    description: 'Navigate right in current group',
    category: 'navigation',
  },
  {
    keys: ['Home'],
    description: 'Navigate to first element in group',
    category: 'navigation',
  },
  {
    keys: ['End'],
    description: 'Navigate to last element in group',
    category: 'navigation',
  },
  {
    keys: ['Escape'],
    description: 'Cancel current action or close modal',
    category: 'navigation',
  },
  {
    keys: ['Enter'],
    description: 'Activate current element',
    category: 'navigation',
  },
  {
    keys: ['Space'],
    description: 'Activate current element',
    category: 'navigation',
  },
  // Actions
  {
    keys: ['Ctrl', 'S'],
    description: 'Save current progress',
    category: 'actions',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'S'],
    description: 'Save current progress',
    category: 'actions',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', 'U'],
    description: 'Upload files',
    category: 'actions',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'U'],
    description: 'Upload files',
    category: 'actions',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', 'M'],
    description: 'Use AI mapping',
    category: 'actions',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'M'],
    description: 'Use AI mapping',
    category: 'actions',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', 'R'],
    description: 'Start reconciliation',
    category: 'actions',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'R'],
    description: 'Start reconciliation',
    category: 'actions',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', 'E'],
    description: 'Export results',
    category: 'actions',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'E'],
    description: 'Export results',
    category: 'actions',
    platform: 'mac',
  },
  // General
  {
    keys: ['Ctrl', 'K'],
    description: 'Open keyboard shortcuts help',
    category: 'general',
    platform: 'windows',
  },
  {
    keys: ['Cmd', 'K'],
    description: 'Open keyboard shortcuts help',
    category: 'general',
    platform: 'mac',
  },
  {
    keys: ['Ctrl', '/'],
    description: 'Show keyboard shortcuts',
    category: 'general',
    platform: 'windows',
  },
  {
    keys: ['Cmd', '/'],
    description: 'Show keyboard shortcuts',
    category: 'general',
    platform: 'mac',
  },
];

const categoryLabels = {
  navigation: 'Navigation',
  actions: 'Actions',
  workflow: 'Workflow',
  general: 'General',
};

export const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'all'>('all');

  // Detect platform
  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setPlatform(isMac ? 'mac' : 'windows');
  }, []);

  // Keyboard shortcut to open this dialog
  useKeyboardShortcut(platform === 'mac' ? 'Cmd+K' : 'Ctrl+K', () => setIsOpen(true), true);

  useKeyboardShortcut(platform === 'mac' ? 'Cmd+/' : 'Ctrl+/', () => setIsOpen(true), true);

  // Close on Escape
  useKeyboardShortcut('Escape', () => setIsOpen(false), isOpen);

  const filteredShortcuts = shortcuts.filter((shortcut) => {
    const matchesSearch =
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.some((key) => key.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || shortcut.category === selectedCategory;
    const matchesPlatform =
      platform === 'all' ||
      !shortcut.platform ||
      shortcut.platform === platform ||
      shortcut.platform === 'all';

    return matchesSearch && matchesCategory && matchesPlatform;
  });

  const groupedShortcuts = filteredShortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>
  );

  const renderKey = (key: string) => {
    const isMac = platform === 'mac';
    const keyMap: Record<string, string> = {
      Ctrl: isMac ? '⌃' : 'Ctrl',
      Cmd: '⌘',
      Shift: '⇧',
      Alt: isMac ? '⌥' : 'Alt',
      Enter: '↵',
      Escape: 'Esc',
      Space: 'Space',
      Tab: '⇥',
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
    };

    return (
      <kbd
        className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm"
        key={key}
      >
        {keyMap[key] || key}
      </kbd>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => setIsOpen(false)}
        aria-label="Close keyboard shortcuts dialog"
      />
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col relative z-10"
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Keyboard className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <h2 id="keyboard-shortcuts-title" className="text-2xl font-semibold text-gray-900">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close keyboard shortcuts dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search keyboard shortcuts"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.keys(groupedShortcuts).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No shortcuts found matching your search.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm text-gray-700">{shortcut.description}</span>
                        <div className="flex items-center space-x-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              {renderKey(key)}
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="mx-1 text-gray-400">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Press{' '}
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">
              {platform === 'mac' ? '⌘' : 'Ctrl'}+K
            </kbd>{' '}
            or{' '}
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">
              {platform === 'mac' ? '⌘' : 'Ctrl'}+/
            </kbd>{' '}
            to open this dialog anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
