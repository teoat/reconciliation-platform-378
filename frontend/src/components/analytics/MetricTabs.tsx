'use client';
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  icon: LucideIcon;
}

interface MetricTabsProps {
  tabs: Tab[];
  selectedTab: string;
  onTabChange: (tabId: string) => void;
}

export const MetricTabs: React.FC<MetricTabsProps> = ({ tabs, selectedTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Metric tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={selectedTab === tab.id ? 'page' : undefined}
              aria-label={`View ${tab.name} metrics`}
            >
              <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
