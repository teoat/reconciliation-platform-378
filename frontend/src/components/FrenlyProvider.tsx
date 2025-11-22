'use client';

import React, { createContext, useContext, useState, useEffect } from 'react'
import { FrenlyState, FrenlyMessage } from '../types/frenly'

// Define PageGuidance interface locally
interface PageGuidance {
  page: string;
  title: string;
  description: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    tips?: string[];
  }>;
  tips?: string[];
  warnings?: string[];
  celebrations?: string[];
}481751c1

interface FrenlyContextType {
  state: FrenlyState;
  updateProgress: (step: string) => void;
  showMessage: (message: FrenlyMessage) => void;
  hideMessage: () => void;
  updatePage: (page: string) => void;
  toggleVisibility: () => void;
  toggleMinimize: () => void;
  updatePreferences: (preferences: Partial<FrenlyState['preferences']>) => void;
}

const FrenlyContext = createContext<FrenlyContextType | undefined>(undefined);

export const useFrenly = () => {
  const context = useContext(FrenlyContext);
  if (!context) {
    throw new Error('useFrenly must be used within a FrenlyProvider');
  }
  return context;
};

interface FrenlyProviderProps {
  children: React.ReactNode;
}

export const FrenlyProvider: React.FC<FrenlyProviderProps> = ({ children }) => {
  const [state, setState] = useState<FrenlyState>({
    isVisible: true,
    isMinimized: false,
    currentPage: '/projects',
    userProgress: {
      completedSteps: [],
      currentStep: 'project_selection',
      totalSteps: 7,
    },
    personality: {
      mood: 'happy',
      energy: 'high',
      helpfulness: 95,
    },
    preferences: {
      showTips: true,
      showCelebrations: true,
      showWarnings: true,
      voiceEnabled: false,
      animationSpeed: 'normal',
    },
    conversationHistory: [],
    activeMessage: undefined,
  });

  // Page guidance definitions
  const pageGuidance: Record<string, PageGuidance> = {
    '/projects': {
      page: '/projects',
      title: 'Project Selection',
      description: 'Choose or create reconciliation projects',
      steps: [
        {
          id: 'browse_projects',
          title: 'Browse Projects',
          description: 'View existing reconciliation projects',
          completed: false,
          tips: ['Use filters to find specific projects', 'Check project status before starting'],
        },
        {
          id: 'create_project',
          title: 'Create Project',
          description: 'Set up a new reconciliation project',
          completed: false,
          tips: ['Use templates for faster setup', 'Set proper permissions for team access'],
        },
        {
          id: 'select_project',
          title: 'Select Project',
          description: 'Choose a project to work on',
          completed: false,
          tips: ['Check project requirements', 'Verify data sources are available'],
        },
      ],
      tips: [
        'Use project templates to speed up creation',
        'Set clear project descriptions for team members',
        'Organize projects with tags and categories',
      ],
      warnings: [
        'Ensure proper permissions are set for team collaboration',
        'Verify project requirements before starting',
      ],
      celebrations: [
        'Great project setup!',
        'Perfect project selection!',
        'Excellent project organization!',
      ],
    },
    '/ingestion': {
      page: '/ingestion',
      title: 'Data Ingestion',
      description: 'Upload and process data files',
      steps: [
        {
          id: 'upload_files',
          title: 'Upload Files',
          description: 'Upload CSV, Excel, or JSON files',
          completed: false,
          tips: ['Ensure files have proper headers', 'Check file formats are supported'],
        },
        {
          id: 'verify_data',
          title: 'Verify Data',
          description: 'Review uploaded data for accuracy',
          completed: false,
          tips: ['Check data completeness', 'Verify column mappings'],
        },
        {
          id: 'process_files',
          title: 'Process Files',
          description: 'Process and validate uploaded data',
          completed: false,
          tips: ['Monitor processing progress', 'Review any error messages'],
        },
      ],
      tips: [
        'Use drag-and-drop for easier file uploads',
        'Check file formats before uploading',
        'Verify data quality after processing',
      ],
      warnings: [
        'Large files may take time to process',
        'Ensure data privacy compliance',
        'Backup original files before processing',
      ],
      celebrations: [
        'Files uploaded successfully!',
        'Data processing complete!',
        'Great data quality!',
      ],
    },
    '/reconciliation': {
      page: '/reconciliation',
      title: 'Reconciliation',
      description: 'Match and compare records between systems',
      steps: [
        {
          id: 'configure_rules',
          title: 'Configure Rules',
          description: 'Set up matching rules and criteria',
          completed: false,
          tips: ['Start with simple rules', 'Test rules with sample data'],
        },
        {
          id: 'run_matching',
          title: 'Run Matching',
          description: 'Execute the reconciliation process',
          completed: false,
          tips: ['Monitor matching progress', 'Review match scores'],
        },
        {
          id: 'review_results',
          title: 'Review Results',
          description: 'Analyze matching results and discrepancies',
          completed: false,
          tips: ['Focus on unmatched records', 'Check match quality'],
        },
      ],
      tips: [
        'Adjust matching rules to improve results',
        'Review unmatched records carefully',
        'Use filters to focus on specific issues',
      ],
      warnings: [
        'Low match rates may indicate data quality issues',
        'Review all discrepancies before proceeding',
        'Save matching rules for future use',
      ],
      celebrations: [
        'Excellent matching results!',
        'Great reconciliation performance!',
        'Perfect match rate achieved!',
      ],
    },
    '/adjudication': {
      page: '/adjudication',
      title: 'Adjudication',
      description: 'Review and resolve discrepancies',
      steps: [
        {
          id: 'review_discrepancies',
          title: 'Review Discrepancies',
          description: 'Examine unmatched and discrepant records',
          completed: false,
          tips: ['Sort by priority', 'Use comments for documentation'],
        },
        {
          id: 'resolve_issues',
          title: 'Resolve Issues',
          description: 'Make decisions on discrepancy resolution',
          completed: false,
          tips: ['Document resolution reasons', 'Escalate complex issues'],
        },
        {
          id: 'finalize_resolutions',
          title: 'Finalize Resolutions',
          description: 'Complete all discrepancy resolutions',
          completed: false,
          tips: ['Double-check all resolutions', 'Get approvals if needed'],
        },
      ],
      tips: [
        'Use priority levels to focus on important issues',
        'Document all resolution decisions',
        'Collaborate with team members on complex cases',
      ],
      warnings: [
        'High priority discrepancies need immediate attention',
        'Ensure all resolutions are properly documented',
        'Get stakeholder approval for significant decisions',
      ],
      celebrations: [
        'All discrepancies resolved!',
        'Excellent adjudication work!',
        'Perfect resolution documentation!',
      ],
    },
    '/visualization': {
      page: '/visualization',
      title: 'Visualization',
      description: 'Create charts and analytics',
      steps: [
        {
          id: 'select_charts',
          title: 'Select Charts',
          description: 'Choose appropriate visualization types',
          completed: false,
          tips: ['Match chart type to data', 'Consider your audience'],
        },
        {
          id: 'configure_visualizations',
          title: 'Configure Visualizations',
          description: 'Set up chart parameters and styling',
          completed: false,
          tips: ['Use consistent colors', 'Add meaningful labels'],
        },
        {
          id: 'analyze_insights',
          title: 'Analyze Insights',
          description: 'Interpret visualization results',
          completed: false,
          tips: ['Look for patterns', 'Identify key trends'],
        },
      ],
      tips: [
        'Choose chart types that best represent your data',
        'Use consistent styling across visualizations',
        'Add meaningful titles and labels',
      ],
      warnings: [
        'Ensure data is complete before creating visualizations',
        'Verify chart accuracy matches underlying data',
        'Consider data privacy in visualizations',
      ],
      celebrations: [
        'Beautiful visualizations created!',
        'Great insights discovered!',
        'Perfect data storytelling!',
      ],
    },
    '/presummary': {
      page: '/presummary',
      title: 'Pre-Summary',
      description: 'Review results before final export',
      steps: [
        {
          id: 'review_categories',
          title: 'Review Categories',
          description: 'Check all reconciliation categories',
          completed: false,
          tips: ['Verify completeness', 'Check accuracy'],
        },
        {
          id: 'validate_results',
          title: 'Validate Results',
          description: 'Ensure all results are correct',
          completed: false,
          tips: ['Cross-check totals', 'Verify calculations'],
        },
        {
          id: 'prepare_export',
          title: 'Prepare Export',
          description: 'Get ready for final summary generation',
          completed: false,
          tips: ['Select export format', 'Review report sections'],
        },
      ],
      tips: [
        'Double-check all reconciliation results',
        'Verify totals and calculations',
        'Review all categories before proceeding',
      ],
      warnings: [
        'Ensure all discrepancies are resolved',
        'Verify data accuracy before export',
        'Check compliance requirements',
      ],
      celebrations: [
        'Perfect pre-summary review!',
        'All results validated!',
        'Ready for final export!',
      ],
    },
    '/summary': {
      page: '/summary',
      title: 'Summary & Export',
      description: 'Generate final reports and export data',
      steps: [
        {
          id: 'configure_export',
          title: 'Configure Export',
          description: 'Set up export format and options',
          completed: false,
          tips: ['Choose appropriate format', 'Select report sections'],
        },
        {
          id: 'generate_report',
          title: 'Generate Report',
          description: 'Create the final reconciliation report',
          completed: false,
          tips: ['Monitor generation progress', 'Review report content'],
        },
        {
          id: 'distribute_results',
          title: 'Distribute Results',
          description: 'Share reports with stakeholders',
          completed: false,
          tips: ['Use secure distribution', 'Include proper documentation'],
        },
      ],
      tips: [
        'Choose export formats based on audience needs',
        'Include all necessary report sections',
        'Use secure distribution methods',
      ],
      warnings: [
        'Ensure data privacy in exported reports',
        'Verify report accuracy before distribution',
        'Backup reports for future reference',
      ],
      celebrations: [
        'Reconciliation complete!',
        'Excellent final report!',
        'Perfect reconciliation journey!',
      ],
    },
    '/auth': {
      page: '/auth',
      title: 'Authentication',
      description: 'Secure login and user authentication',
      steps: [
        {
          id: 'enter_credentials',
          title: 'Enter Credentials',
          description: 'Provide username and password',
          completed: false,
          tips: ['Use strong passwords', 'Enable two-factor authentication'],
        },
        {
          id: 'verify_identity',
          title: 'Verify Identity',
          description: 'Complete authentication process',
          completed: false,
          tips: ['Check email for verification', 'Complete security questions'],
        },
        {
          id: 'access_granted',
          title: 'Access Granted',
          description: 'Successfully authenticated and logged in',
          completed: false,
          tips: ['Review security settings', 'Update profile if needed'],
        },
      ],
      tips: [
        'Use unique passwords for each account',
        'Enable two-factor authentication for security',
        'Keep your login credentials secure',
      ],
      warnings: [
        'Never share your login credentials',
        'Log out from shared computers',
        'Report suspicious activity immediately',
      ],
      celebrations: ['Welcome back!', 'Secure login successful!', 'Ready to start reconciling!'],
    },
    '/cashflow-evaluation': {
      page: '/cashflow-evaluation',
      title: 'Cashflow Evaluation',
      description: 'Analyze cashflow patterns and trends',
      steps: [
        {
          id: 'analyze_patterns',
          title: 'Analyze Patterns',
          description: 'Examine cashflow trends and patterns',
          completed: false,
          tips: ['Look for seasonal trends', 'Identify anomalies'],
        },
        {
          id: 'evaluate_performance',
          title: 'Evaluate Performance',
          description: 'Assess cashflow performance metrics',
          completed: false,
          tips: ['Compare against benchmarks', 'Review key ratios'],
        },
        {
          id: 'generate_insights',
          title: 'Generate Insights',
          description: 'Create actionable insights and recommendations',
          completed: false,
          tips: ['Focus on actionable items', 'Document key findings'],
        },
      ],
      tips: [
        'Use multiple time periods for analysis',
        'Compare against industry benchmarks',
        'Focus on actionable insights',
      ],
      warnings: [
        'Verify data accuracy before analysis',
        'Consider external factors affecting cashflow',
        'Document assumptions and limitations',
      ],
      celebrations: [
        'Excellent cashflow analysis!',
        'Great insights discovered!',
        'Perfect evaluation complete!',
      ],
    },
  };

  const updateProgress = (step: string) => {
    setState((prev) => {
      const newCompletedSteps = prev.userProgress.completedSteps.includes(step)
        ? prev.userProgress.completedSteps
        : [...prev.userProgress.completedSteps, step];

      const currentGuidance = pageGuidance[prev.currentPage];
      const currentStepIndex = currentGuidance?.steps.findIndex((s) => s.id === step) || 0;
      const nextStep = currentGuidance?.steps[currentStepIndex + 1]?.id || step;

      return {
        ...prev,
        userProgress: {
          ...prev.userProgress,
          completedSteps: newCompletedSteps,
          currentStep: nextStep,
        },
      };
    });
  };

  const showMessage = (message: FrenlyMessage) => {
    setState((prev) => ({
      ...prev,
      activeMessage: message,
      conversationHistory: [...prev.conversationHistory, message],
    }));
  };

  const hideMessage = () => {
    setState((prev) => ({ ...prev, activeMessage: undefined }));
  };

  const updatePage = (page: string) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  const toggleVisibility = () => {
    setState((prev) => ({ ...prev, isVisible: !prev.isVisible }));
  };

  const toggleMinimize = () => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const updatePreferences = (preferences: Partial<FrenlyState['preferences']>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences },
    }));
  };

  const value: FrenlyContextType = {
    state,
    updateProgress,
    showMessage,
    hideMessage,
    updatePage,
    toggleVisibility,
    toggleMinimize,
    updatePreferences,
  };

  return <FrenlyContext.Provider value={value}>{children}</FrenlyContext.Provider>;
};
