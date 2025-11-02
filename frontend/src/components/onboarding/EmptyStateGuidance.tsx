/**
 * Empty State Guidance Component
 * 
 * Provides contextual guidance when users encounter empty states.
 * Includes one-click setup options and guided first actions.
 */

import React, { useState } from 'react';
import { Upload, FileText, Database, Plus, Play, BookOpen, Video, Sparkles } from 'lucide-react';

export type EmptyStateType = 
  | 'projects' 
  | 'data_sources' 
  | 'reconciliation_jobs' 
  | 'results' 
  | 'matches'
  | 'discrepancies'
  | 'exports';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void | Promise<void>;
  description?: string;
  primary?: boolean;
}

interface EmptyStateGuidanceProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  quickActions?: QuickAction[];
  helpLink?: string;
  videoUrl?: string;
  onActionComplete?: (actionId: string) => void;
  className?: string;
}

const DEFAULT_EMPTY_STATES: Record<EmptyStateType, {
  title: string;
  description: string;
  defaultActions: QuickAction[];
}> = {
  projects: {
    title: 'No Projects Yet',
    description: 'Create your first reconciliation project to get started. Projects help you organize and manage your reconciliation workflows.',
    defaultActions: [
      {
        id: 'create-project',
        label: 'Create New Project',
        icon: <Plus className="w-5 h-5" />,
        onClick: () => {
          // TODO: Trigger project creation
          console.log('Create project triggered');
        },
        description: 'Set up a new reconciliation project from scratch',
        primary: true,
      },
      {
        id: 'use-template',
        label: 'Use Template',
        icon: <FileText className="w-5 h-5" />,
        onClick: () => {
          // TODO: Open template selector
          console.log('Template selector triggered');
        },
        description: 'Start with a pre-configured project template',
      },
      {
        id: 'import-sample',
        label: 'Try Sample Data',
        icon: <Database className="w-5 h-5" />,
        onClick: () => {
          // TODO: Import sample data
          console.log('Sample data import triggered');
        },
        description: 'Explore with sample reconciliation data',
      },
    ],
  },
  data_sources: {
    title: 'No Data Sources',
    description: 'Upload or connect your data sources to begin reconciliation. You can upload files or connect to external systems.',
    defaultActions: [
      {
        id: 'upload-file',
        label: 'Upload File',
        icon: <Upload className="w-5 h-5" />,
        onClick: () => {
          // TODO: Trigger file upload
          console.log('File upload triggered');
        },
        description: 'Upload CSV, Excel, or JSON files',
        primary: true,
      },
      {
        id: 'connect-api',
        label: 'Connect API',
        icon: <Database className="w-5 h-5" />,
        onClick: () => {
          // TODO: Open API connection dialog
          console.log('API connection triggered');
        },
        description: 'Connect to external data sources via API',
      },
      {
        id: 'use-sample',
        label: 'Use Sample Data',
        icon: <Sparkles className="w-5 h-5" />,
        onClick: () => {
          // TODO: Use sample data
          console.log('Sample data triggered');
        },
        description: 'Try with sample reconciliation data',
      },
    ],
  },
  reconciliation_jobs: {
    title: 'No Reconciliation Jobs',
    description: 'Start your first reconciliation job to match and compare data from different sources.',
    defaultActions: [
      {
        id: 'create-job',
        label: 'Create Job',
        icon: <Plus className="w-5 h-5" />,
        onClick: () => {
          // TODO: Create reconciliation job
          console.log('Job creation triggered');
        },
        description: 'Set up a new reconciliation job',
        primary: true,
      },
      {
        id: 'quick-start',
        label: 'Quick Start',
        icon: <Play className="w-5 h-5" />,
        onClick: () => {
          // TODO: Quick start wizard
          console.log('Quick start triggered');
        },
        description: 'Use the guided quick start wizard',
      },
    ],
  },
  results: {
    title: 'No Results Yet',
    description: 'Run a reconciliation job to see results here. Results will show matched and unmatched records.',
    defaultActions: [
      {
        id: 'run-reconciliation',
        label: 'Run Reconciliation',
        icon: <Play className="w-5 h-5" />,
        onClick: () => {
          // TODO: Run reconciliation
          console.log('Reconciliation triggered');
        },
        description: 'Execute a reconciliation job',
        primary: true,
      },
    ],
  },
  matches: {
    title: 'No Matches Found',
    description: 'Matches will appear here after running a reconciliation job. Check your matching rules if no matches are found.',
    defaultActions: [
      {
        id: 'configure-rules',
        label: 'Configure Rules',
        icon: <FileText className="w-5 h-5" />,
        onClick: () => {
          // TODO: Configure matching rules
          console.log('Rule configuration triggered');
        },
        description: 'Adjust matching rules and thresholds',
        primary: true,
      },
      {
        id: 'review-data',
        label: 'Review Data',
        icon: <Database className="w-5 h-5" />,
        onClick: () => {
          // TODO: Review data sources
          console.log('Data review triggered');
        },
        description: 'Check data quality and format',
      },
    ],
  },
  discrepancies: {
    title: 'No Discrepancies',
    description: 'Great job! All records matched successfully. Discrepancies will appear here when records don\'t match perfectly.',
    defaultActions: [],
  },
  exports: {
    title: 'No Exports',
    description: 'Export your reconciliation results to CSV, Excel, or PDF. Exports will be listed here for download.',
    defaultActions: [
      {
        id: 'export-results',
        label: 'Export Results',
        icon: <FileText className="w-5 h-5" />,
        onClick: () => {
          // TODO: Trigger export
          console.log('Export triggered');
        },
        description: 'Export current reconciliation results',
        primary: true,
      },
    ],
  },
};

export const EmptyStateGuidance: React.FC<EmptyStateGuidanceProps> = ({
  type,
  title,
  description,
  quickActions,
  helpLink,
  videoUrl,
  onActionComplete,
  className = '',
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const emptyStateConfig = DEFAULT_EMPTY_STATES[type];
  const finalTitle = title || emptyStateConfig.title;
  const finalDescription = description || emptyStateConfig.description;
  const actions = quickActions || emptyStateConfig.defaultActions;

  const handleAction = async (action: QuickAction) => {
    setActionLoading(action.id);
    try {
      await action.onClick();
      if (onActionComplete) {
        onActionComplete(action.id);
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 ${className}`}>
      {/* Illustration */}
      <div className="mb-6">
        <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
          {type === 'projects' && <FileText className="w-12 h-12 text-purple-500" />}
          {type === 'data_sources' && <Upload className="w-12 h-12 text-purple-500" />}
          {type === 'reconciliation_jobs' && <Play className="w-12 h-12 text-purple-500" />}
          {type === 'results' && <Database className="w-12 h-12 text-purple-500" />}
          {type === 'matches' && <Sparkles className="w-12 h-12 text-purple-500" />}
          {type === 'discrepancies' && <CheckCircle className="w-12 h-12 text-green-500" />}
          {type === 'exports' && <FileText className="w-12 h-12 text-purple-500" />}
        </div>
      </div>

      {/* Title & Description */}
      <div className="text-center mb-8 max-w-md">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {finalTitle}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {finalDescription}
        </p>
      </div>

      {/* Quick Actions */}
      {actions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-6">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={actionLoading === action.id}
              className={`
                flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all
                ${action.primary
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent hover:from-purple-600 hover:to-pink-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                ${actionLoading === action.id ? 'animate-pulse' : ''}
              `}
            >
              <div className="mb-3">
                {action.icon}
              </div>
              <span className="font-semibold mb-1">{action.label}</span>
              {action.description && (
                <span className={`text-xs ${action.primary ? 'text-purple-100' : 'text-gray-500'}`}>
                  {action.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Help Links */}
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        {helpLink && (
          <a
            href={helpLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-purple-600 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Learn More</span>
          </a>
        )}
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-purple-600 transition-colors"
          >
            <Video className="w-4 h-4" />
            <span>Watch Tutorial</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default EmptyStateGuidance;

