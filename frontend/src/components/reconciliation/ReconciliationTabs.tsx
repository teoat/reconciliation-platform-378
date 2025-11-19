import React from 'react';
import { Upload, Settings, Play, BarChart3 } from 'lucide-react';

interface Tab {
  id: 'upload' | 'configure' | 'run' | 'results';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ReconciliationTabsProps {
  activeTab: 'upload' | 'configure' | 'run' | 'results';
  completedTabs: string[];
  onTabChange: (tab: 'upload' | 'configure' | 'run' | 'results') => void;
}

export const ReconciliationTabs: React.FC<ReconciliationTabsProps> = ({
  activeTab,
  completedTabs,
  onTabChange,
}) => {
  const tabs: Tab[] = [
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'configure', label: 'Configure', icon: Settings },
    { id: 'run', label: 'Run Jobs', icon: Play },
    { id: 'results', label: 'Results', icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="navigation-tabs">
      <div className="border-b border-gray-200">
        <div
          className="-mb-px flex space-x-8"
          role="tablist"
          aria-label="Reconciliation workflow tabs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isCompleted = completedTabs.includes(tab.id);
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
              >
                <Icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.label}
                {isCompleted && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
