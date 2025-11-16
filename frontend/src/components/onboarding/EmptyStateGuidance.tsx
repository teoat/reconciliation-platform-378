/**
import { logger } from '../services/logger'; * Empty State Guidance Component
 * 
 * Provides contextual guidance when users encounter empty states.
 * Includes one-click setup options and guided first actions.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Database, Plus, Play, BookOpen, Video, Sparkles, CheckCircle } from 'lucide-react';

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
  projectId?: string; // Optional project ID for project-scoped actions
  onCreateProject?: () => void | Promise<void>; // Optional callback for project creation
  onUploadFile?: () => void | Promise<void>; // Optional callback for file upload
  onCreateJob?: () => void | Promise<void>; // Optional callback for job creation
}

const DEFAULT_EMPTY_STATES: Record<EmptyStateType, {
  title: string;
  description: string;
  getDefaultActions: (
    navigate: ReturnType<typeof useNavigate>,
    props: EmptyStateGuidanceProps
  ) => QuickAction[];
}> = {
  projects: {
    title: 'No Projects Yet',
    description: 'Create your first reconciliation project to get started. Projects help you organize and manage your reconciliation workflows.',
    getDefaultActions: (navigate, props) => [
      {
        id: 'create-project',
        label: 'Create New Project',
        icon: <Plus className="w-5 h-5" />,
        onClick: async () => {
          if (props.onCreateProject) {
            await props.onCreateProject();
          } else {
            navigate('/projects/new');
          }
        },
        description: 'Set up a new reconciliation project from scratch',
        primary: true,
      },
      {
        id: 'use-template',
        label: 'Use Template',
        icon: <FileText className="w-5 h-5" />,
        onClick: () => {
          navigate('/projects/new?template=true');
        },
        description: 'Start with a pre-configured project template',
      },
    ],
  },
  data_sources: {
    title: 'No Data Sources',
    description: 'Upload or connect your data sources to begin reconciliation. You can upload files or connect to external systems.',
    getDefaultActions: (navigate, props) => [
      {
        id: 'upload-file',
        label: 'Upload File',
        icon: <Upload className="w-5 h-5" />,
        onClick: async () => {
          if (props.onUploadFile) {
            await props.onUploadFile();
          } else {
            navigate(props.projectId ? `/upload?projectId=${props.projectId}` : '/upload');
          }
        },
        description: 'Upload CSV, Excel, or JSON files',
        primary: true,
      },
      {
        id: 'connect-api',
        label: 'Connect API',
        icon: <Database className="w-5 h-5" />,
        onClick: () => {
          navigate(props.projectId ? `/projects/${props.projectId}/data-sources/new?type=api` : '/data-sources/new?type=api');
        },
        description: 'Connect to external data sources via API',
      },
    ],
  },
  reconciliation_jobs: {
    title: 'No Reconciliation Jobs',
    description: 'Start your first reconciliation job to match and compare data from different sources.',
    getDefaultActions: (navigate, props) => [
      {
        id: 'create-job',
        label: 'Create Job',
        icon: <Plus className="w-5 h-5" />,
        onClick: async () => {
          if (props.onCreateJob) {
            await props.onCreateJob();
          } else if (props.projectId) {
            navigate(`/projects/${props.projectId}/jobs/new`);
          } else {
            navigate('/reconciliation/new');
          }
        },
        description: 'Set up a new reconciliation job',
        primary: true,
      },
      {
        id: 'quick-start',
        label: 'Quick Start',
        icon: <Play className="w-5 h-5" />,
        onClick: () => {
          navigate('/quick-reconciliation');
        },
        description: 'Use the guided quick start wizard',
      },
    ],
  },
  results: {
    title: 'No Results Yet',
    description: 'Run a reconciliation job to see results here. Results will show matched and unmatched records.',
    getDefaultActions: (navigate, props) => [
      {
        id: 'run-reconciliation',
        label: 'Run Reconciliation',
        icon: <Play className="w-5 h-5" />,
        onClick: () => {
          if (props.projectId) {
            navigate(`/projects/${props.projectId}/jobs`);
          } else {
            navigate('/reconciliation');
          }
        },
        description: 'Execute a reconciliation job',
        primary: true,
      },
    ],
  },
  matches: {
    title: 'No Matches Found',
    description: 'Matches will appear here after running a reconciliation job. Check your matching rules if no matches are found.',
    getDefaultActions: (navigate, props) => [
      {
        id: 'configure-rules',
        label: 'Configure Rules',
        icon: <FileText className="w-5 h-5" />,
        onClick: () => {
          if (props.projectId) {
            navigate(`/projects/${props.projectId}/settings/rules`);
          } else {
            navigate('/settings/rules');
          }
        },
        description: 'Adjust matching rules and thresholds',
        primary: true,
      },
      {
        id: 'review-data',
        label: 'Review Data',
        icon: <Database className="w-5 h-5" />,
        onClick: () => {
          if (props.projectId) {
            navigate(`/projects/${props.projectId}/data-sources`);
          } else {
            navigate('/data-sources');
          }
        },
        description: 'Check data quality and format',
      },
    ],
  },
  discrepancies: {
    title: 'No Discrepancies',
    description: 'Great job! All records matched successfully. Discrepancies will appear here when records don\'t match perfectly.',
    getDefaultActions: () => [],
  },
  exports: {
    title: 'No Exports',
    description: 'Export your reconciliation results to CSV, Excel, or PDF. Exports will be listed here for download.',
    getDefaultActions: (navigate, props) => [
      {
        id: 'export-results',
        label: 'Export Results',
        icon: <FileText className="w-5 h-5" />,
        onClick: () => {
          // Export functionality would be triggered from the results page
          if (props.projectId) {
            navigate(`/projects/${props.projectId}/exports/new`);
          } else {
            navigate('/exports/new');
          }
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
  projectId,
  onCreateProject,
  onUploadFile,
  onCreateJob,
}) => {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const emptyStateConfig = DEFAULT_EMPTY_STATES[type];
  const finalTitle = title || emptyStateConfig.title;
  const finalDescription = description || emptyStateConfig.description;
  const actions = quickActions || emptyStateConfig.getDefaultActions(navigate, {
    type,
    projectId,
    onCreateProject,
    onUploadFile,
    onCreateJob,
  });

  const handleAction = async (action: QuickAction) => {
    setActionLoading(action.id);
    try {
      await action.onClick();
      if (onActionComplete) {
        onActionComplete(action.id);
      }
    } catch (error) {
      logger.error('Action failed:', error);
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

