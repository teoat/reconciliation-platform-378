// API Tabs Component
// Extracted from APIDevelopment.tsx

import React from 'react';
import { Server, Zap, Activity, File } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { APITab } from '../types';

interface APITabsProps {
  activeTab: APITab;
  onTabChange: (tab: APITab) => void;
}

const tabs: Array<{ id: APITab; label: string; icon: LucideIcon }> = [
  { id: 'endpoints', label: 'API Endpoints', icon: Server },
  { id: 'webhooks', label: 'Webhooks', icon: Zap },
  { id: 'logs', label: 'API Logs', icon: Activity },
  { id: 'documentation', label: 'Documentation', icon: File },
];

export const APITabs: React.FC<APITabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-secondary-200">
      <nav className="flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

