/**
 * Consolidated Frenly Provider
 *
 * Combines all Frenly provider implementations into a single, optimized provider
 * with state persistence, tutorial support, and comprehensive features.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { logger } from '@/services/logger';
import {
  MessageCircle,
  X,
  Minimize2,
  Lightbulb,
  AlertTriangle,
  PartyPopper,
  Star,
  Smile,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import { FrenlyGuidance, FrenlyTips } from './FrenlyGuidance';
import { setFrenlyMessageHandler } from '@/orchestration/PageFrenlyIntegration';
import { useFrenlyMaintenanceStatus } from '@/hooks/useFrenlyMaintenanceStatus';
import { useFrenlyMaintenanceHistory, getHealthTrend } from '@/hooks/useFrenlyMaintenanceHistory';
import type { MaintenanceRun } from '@/hooks/useFrenlyMaintenanceHistory';
import { useToast } from '@/hooks/useToast';

// ============================================================================
// TYPES
// ============================================================================

export interface FrenlyMessage {
  id: string;
  type:
    | 'greeting'
    | 'tip'
    | 'warning'
    | 'celebration'
    | 'question'
    | 'instruction'
    | 'encouragement';
  content: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  timestamp: Date;
  page?: string;
  priority: 'low' | 'medium' | 'high';
  dismissible: boolean;
  autoHide?: number;
}

export interface FrenlyState {
  isVisible: boolean;
  isMinimized: boolean;
  currentPage: string;
  userProgress: {
    completedSteps: string[];
    currentStep: string;
    totalSteps: number;
  };
  personality: {
    mood: 'happy' | 'excited' | 'concerned' | 'proud' | 'curious';
    energy: 'low' | 'medium' | 'high';
    helpfulness: number;
  };
  preferences: {
    showTips: boolean;
    showCelebrations: boolean;
    showWarnings: boolean;
    voiceEnabled: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
  };
  conversationHistory: FrenlyMessage[];
  activeMessage?: FrenlyMessage;
  // Additional features
  isTutorialActive: boolean;
  showTips: boolean;
}

interface FrenlyContextType {
  state: FrenlyState;
  updateProgress: (step: string) => void;
  showMessage: (message: FrenlyMessage) => void;
  hideMessage: () => void;
  updatePage: (page: string) => void;
  toggleVisibility: () => void;
  toggleMinimize: () => void;
  updatePreferences: (preferences: Partial<FrenlyState['preferences']>) => void;
  // Tutorial features
  startTutorial: () => void;
  stopTutorial: () => void;
  toggleTips: () => void;
  resetProgress: () => void;
  // Utility functions
  getProgressPercentage: () => number;
  getNextStep: () => string | undefined;
  isStepCompleted: (stepId: string) => boolean;
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
  children: ReactNode;
  initialProgress?: string[];
  enableTips?: boolean;
  enableTutorial?: boolean;
  enablePersistence?: boolean;
}

// ============================================================================
// STATE PERSISTENCE UTILITIES
// ============================================================================

const STORAGE_KEYS = {
  state: 'frenly:state',
  progress: 'frenly:progress',
  preferences: 'frenly:preferences',
  session: 'frenly:session',
} as const;

function saveStateToStorage(state: Partial<FrenlyState>): void {
  try {
    if (state.userProgress) {
      localStorage.setItem(
        STORAGE_KEYS.progress,
        JSON.stringify(state.userProgress.completedSteps)
      );
    }
    if (state.preferences) {
      localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(state.preferences));
    }
    if (state.currentPage) {
      localStorage.setItem('frenly:currentPage', state.currentPage);
    }
    // Save full state snapshot
    const stateSnapshot = {
      userProgress: state.userProgress,
      preferences: state.preferences,
      currentPage: state.currentPage,
      personality: state.personality,
      isTutorialActive: state.isTutorialActive,
      showTips: state.showTips,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(stateSnapshot));
  } catch (error) {
    logger.error('Failed to save Frenly state to storage:', { error });
  }
}

function loadStateFromStorage(): Partial<FrenlyState> | null {
  try {
    const savedState = localStorage.getItem(STORAGE_KEYS.state);
    if (!savedState) return null;

    const parsed = JSON.parse(savedState);

    // Check if state is stale (older than 7 days)
    if (parsed.timestamp && Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEYS.state);
      return null;
    }

    return {
      userProgress: parsed.userProgress
        ? {
            completedSteps: parsed.userProgress.completedSteps || [],
            currentStep: parsed.userProgress.currentStep || 'dashboard',
            totalSteps: parsed.userProgress.totalSteps || 7,
          }
        : undefined,
      preferences: parsed.preferences,
      currentPage: parsed.currentPage,
      personality: parsed.personality,
      isTutorialActive: parsed.isTutorialActive || false,
      showTips: parsed.showTips !== undefined ? parsed.showTips : true,
    };
  } catch (error) {
    logger.error('Failed to load Frenly state from storage:', { error });
    return null;
  }
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const FrenlyProvider: React.FC<FrenlyProviderProps> = ({
  children,
  initialProgress = [],
  enableTips = true,
  enableTutorial = true,
  enablePersistence = true,
}) => {
  // Load initial state from storage or use defaults
  const savedState = enablePersistence ? loadStateFromStorage() : null;

  const [state, setState] = useState<FrenlyState>(() => {
    const defaultState: FrenlyState = {
      isVisible: true,
      isMinimized: false,
      currentPage: '/dashboard',
      userProgress: {
        completedSteps: [],
        currentStep: 'dashboard',
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
      isTutorialActive: false,
      showTips: enableTips,
    };

    // Merge with saved state
    if (savedState) {
      return {
        ...defaultState,
        ...savedState,
        userProgress: savedState.userProgress || defaultState.userProgress,
        preferences: savedState.preferences || defaultState.preferences,
      };
    }

    // Use initial progress if provided
    if (initialProgress.length > 0) {
      defaultState.userProgress.completedSteps = initialProgress;
    }

    return defaultState;
  });

  const { status: maintenanceStatus, loading: maintenanceLoading } = useFrenlyMaintenanceStatus();
  const { runs: maintenanceHistory } = useFrenlyMaintenanceHistory(7);
  const healthTrend = getHealthTrend(maintenanceHistory);
  const toast = useToast();
  
  // Track previous maintenance status for change detection
  const prevMaintenanceStatusRef = useRef<typeof maintenanceStatus>(null);
  
  // Show toast notification when maintenance status degrades
  useEffect(() => {
    if (maintenanceLoading || !maintenanceStatus) return;
    
    const prevStatus = prevMaintenanceStatusRef.current;
    const currentStatus = maintenanceStatus.overallStatus;
    
    // Only show toast on status change (not on initial load)
    if (prevStatus) {
      const prevOverall = prevStatus.overallStatus;
      
      // Status degraded from healthy
      if (prevOverall === 'healthy' && currentStatus === 'degraded') {
        toast.warning(
          `⚠️ System health degraded: ${maintenanceStatus.softFailures} non-critical issue${maintenanceStatus.softFailures > 1 ? 's' : ''} detected`,
          { duration: 6000 }
        );
      } else if (prevOverall === 'healthy' && currentStatus === 'failed') {
        toast.error(
          `🚨 System health critical: ${maintenanceStatus.hardFailures} critical issue${maintenanceStatus.hardFailures > 1 ? 's' : ''} require attention`,
          { duration: 8000 }
        );
      } else if (prevOverall === 'degraded' && currentStatus === 'failed') {
        toast.error(
          `🚨 Status worsened: ${maintenanceStatus.hardFailures} critical issue${maintenanceStatus.hardFailures > 1 ? 's' : ''} now detected`,
          { duration: 8000 }
        );
      } else if (currentStatus === 'healthy' && prevOverall !== 'healthy') {
        toast.success(
          '✅ System health restored! All checks passing.',
          { duration: 4000 }
        );
      }
    }
    
    prevMaintenanceStatusRef.current = maintenanceStatus;
  }, [maintenanceStatus, maintenanceLoading, toast]);

  // Save state to storage whenever it changes
  useEffect(() => {
    if (enablePersistence) {
      saveStateToStorage({
        userProgress: state.userProgress,
        preferences: state.preferences,
        currentPage: state.currentPage,
        personality: state.personality,
        isTutorialActive: state.isTutorialActive,
        showTips: state.showTips,
      });
    }
  }, [
    state.userProgress,
    state.preferences,
    state.currentPage,
    state.personality,
    state.isTutorialActive,
    state.showTips,
    enablePersistence,
  ]);

  // Sync state with backend on significant changes
  const syncWithBackend = useCallback(async () => {
    if (!enablePersistence) return;

    try {
      const _userId = localStorage.getItem('userId') || 'unknown';
      await frenlyAgentService.updateOnboardingProgress({
        pageId: state.currentPage,
        completedSteps: state.userProgress.completedSteps,
        currentStep: state.userProgress.currentStep || null,
      });
    } catch (error) {
      logger.error('Failed to sync Frenly state with backend:', { error });
    }
  }, [state.currentPage, state.userProgress, enablePersistence]);

  // Sync with backend when progress changes
  useEffect(() => {
    syncWithBackend();
  }, [state.userProgress.completedSteps.length, syncWithBackend]);

  // ============================================================================
  // STATE UPDATERS
  // ============================================================================

  const updateProgress = useCallback((step: string) => {
    setState((prev) => {
      const newCompletedSteps = prev.userProgress.completedSteps.includes(step)
        ? prev.userProgress.completedSteps
        : [...prev.userProgress.completedSteps, step];

      return {
        ...prev,
        userProgress: {
          ...prev.userProgress,
          completedSteps: newCompletedSteps,
          currentStep: step,
        },
      };
    });
  }, []);

  const showMessage = useCallback((message: FrenlyMessage) => {
    setState((prev) => ({
      ...prev,
      activeMessage: message,
      conversationHistory: [...prev.conversationHistory, message].slice(-50), // Keep last 50
    }));

    // Auto-hide message if specified
    if (message.autoHide) {
      setTimeout(() => {
        setState((prev) => ({ ...prev, activeMessage: undefined }));
      }, message.autoHide);
    }
  }, []);

  const hideMessage = useCallback(() => {
    setState((prev) => ({ ...prev, activeMessage: undefined }));
  }, []);

  const updatePage = useCallback((page: string) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const toggleVisibility = useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: !prev.isVisible }));
  }, []);

  const toggleMinimize = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  const updatePreferences = useCallback((preferences: Partial<FrenlyState['preferences']>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences },
    }));
  }, []);

  const startTutorial = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isTutorialActive: true,
      personality: { ...prev.personality, mood: 'excited', energy: 'high' },
    }));
  }, []);

  const stopTutorial = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isTutorialActive: false,
      personality: { ...prev.personality, mood: 'proud', energy: 'medium' },
    }));
  }, []);

  const toggleTips = useCallback(() => {
    setState((prev) => ({ ...prev, showTips: !prev.showTips }));
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => ({
      ...prev,
      userProgress: {
        completedSteps: [],
        currentStep: 'dashboard',
        totalSteps: 7,
      },
    }));
    if (enablePersistence) {
      localStorage.removeItem(STORAGE_KEYS.progress);
    }
  }, [enablePersistence]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getProgressPercentage = useCallback(() => {
    return Math.round(
      (state.userProgress.completedSteps.length / state.userProgress.totalSteps) * 100
    );
  }, [state.userProgress]);

  const getNextStep = useCallback(() => {
    const allSteps = [
      'welcome',
      'upload-files',
      'configure-reconciliation',
      'review-matches',
      'adjudicate-discrepancies',
      'visualize-results',
      'export-summary',
    ];
    return allSteps.find((step) => !state.userProgress.completedSteps.includes(step));
  }, [state.userProgress]);

  const isStepCompleted = useCallback(
    (stepId: string) => {
      return state.userProgress.completedSteps.includes(stepId);
    },
    [state.userProgress]
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: FrenlyContextType = {
    state,
    updateProgress,
    showMessage,
    hideMessage,
    updatePage,
    toggleVisibility,
    toggleMinimize,
    updatePreferences,
    startTutorial,
    stopTutorial,
    toggleTips,
    resetProgress,
    getProgressPercentage,
    getNextStep,
    isStepCompleted,
  };

  // Register message handler for PageFrenlyIntegration
  useEffect(() => {
    setFrenlyMessageHandler({
      showMessage,
      hideMessage,
    });

    return () => {
      setFrenlyMessageHandler(null);
    };
  }, [showMessage, hideMessage]);

  return (
    <FrenlyContext.Provider value={value}>
      {children}
      <FrenlyAI />
      {enableTutorial && state.isTutorialActive && (
        <FrenlyGuidance
          currentPage={state.currentPage}
          userProgress={state.userProgress.completedSteps}
          onStepComplete={updateProgress}
          onStartTutorial={startTutorial}
        />
      )}
      {enableTips && state.showTips && <FrenlyTips tips={[]} currentPage={state.currentPage} />}
    </FrenlyContext.Provider>
  );
};

// ============================================================================
// FRENLY AI COMPONENT
// ============================================================================

const FrenlyAI: React.FC = () => {
  const { state, hideMessage, toggleVisibility, toggleMinimize, showMessage, updatePreferences } =
    useFrenly();
  const messageGenerationRef = useRef<Promise<FrenlyMessage | null> | null>(null);

  // Helper to check if maintenance status is stale (older than 7 days)
  const isMaintenanceStale = useCallback((): boolean => {
    if (!maintenanceStatus?.lastRun) return true;
    const lastRunDate = new Date(maintenanceStatus.lastRun);
    const now = new Date();
    const daysSinceRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRun > 7;
  }, [maintenanceStatus]);

  // Generate maintenance-aware contextual messages
  const generateContextualMessage = useCallback(async (): Promise<FrenlyMessage | null> => {
    // Prevent duplicate requests
    if (messageGenerationRef.current) {
      return messageGenerationRef.current;
    }

    const promise = (async () => {
      try {
        // Check for maintenance issues first (priority messages)
        if (maintenanceStatus) {
          // Show maintenance warning if system is degraded or failed
          if (maintenanceStatus.overallStatus === 'failed') {
            return {
              id: `maintenance-alert-${Date.now()}`,
              type: 'warning' as const,
              content: `⚠️ System health check found ${maintenanceStatus.hardFailures} critical issue${maintenanceStatus.hardFailures > 1 ? 's' : ''}. ${maintenanceStatus.failedChecks.slice(0, 2).join(', ')}${maintenanceStatus.failedChecks.length > 2 ? ` and ${maintenanceStatus.failedChecks.length - 2} more` : ''} need attention.`,
              timestamp: new Date(),
              page: state.currentPage,
              priority: 'high' as const,
              dismissible: true,
              action: {
                text: 'View Report',
                onClick: () => window.open(`/${maintenanceStatus.reportPath}`, '_blank'),
              },
            } as FrenlyMessage;
          }
          
          if (maintenanceStatus.overallStatus === 'degraded') {
            return {
              id: `maintenance-degraded-${Date.now()}`,
              type: 'tip' as const,
              content: `🔧 Some non-critical checks are failing (${maintenanceStatus.softFailures} issue${maintenanceStatus.softFailures > 1 ? 's' : ''}). The system is working, but you might want to address: ${maintenanceStatus.failedChecks.slice(0, 2).join(', ')}.`,
              timestamp: new Date(),
              page: state.currentPage,
              priority: 'medium' as const,
              dismissible: true,
              action: {
                text: 'See Details',
                onClick: () => window.open(`/${maintenanceStatus.reportPath}`, '_blank'),
              },
            } as FrenlyMessage;
          }
        }
        
        // Check if maintenance is stale
        if (isMaintenanceStale()) {
          const daysSince = maintenanceStatus?.lastRun 
            ? Math.floor((Date.now() - new Date(maintenanceStatus.lastRun).getTime()) / (1000 * 60 * 60 * 24))
            : null;
          
          return {
            id: `maintenance-stale-${Date.now()}`,
            type: 'tip' as const,
            content: daysSince 
              ? `📋 It's been ${daysSince} days since the last maintenance check. Want me to suggest running a quick health check?`
              : `📋 No recent maintenance runs found. Running periodic health checks helps catch issues early!`,
            timestamp: new Date(),
            page: state.currentPage,
            priority: 'low' as const,
            dismissible: true,
            autoHide: 8000,
          } as FrenlyMessage;
        }

        // Get user ID from localStorage or generate one
        const userId =
          localStorage.getItem('userId') ||
          `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (!localStorage.getItem('userId')) {
          localStorage.setItem('userId', userId);
        }

        // Track interaction
        await frenlyAgentService.trackInteraction(userId, 'page_view');

        // Generate intelligent message using agent
        const agentMessage = await frenlyAgentService.generateMessage({
          userId,
          page: state.currentPage,
          progress: {
            completedSteps: state.userProgress.completedSteps,
            totalSteps: state.userProgress.totalSteps,
            currentStep: state.userProgress.currentStep,
          },
          preferences: {
            communicationStyle: 'conversational',
            messageFrequency: 'medium',
          },
          behavior: {
            sessionDuration:
              Date.now() -
              (localStorage.getItem('sessionStart')
                ? parseInt(localStorage.getItem('sessionStart')!, 10)
                : Date.now()),
          },
        });

        // Track message shown
        await frenlyAgentService.trackInteraction(userId, 'message_shown', agentMessage.id);

        // Convert agent message to FrenlyMessage format
        const frenlyMessage: FrenlyMessage = {
          id: agentMessage.id,
          type: agentMessage.type === 'help' ? 'tip' : (agentMessage.type as FrenlyMessage['type']),
          content: agentMessage.content,
          timestamp: agentMessage.timestamp,
          page: state.currentPage,
          priority: agentMessage.priority,
          dismissible: true,
          autoHide: agentMessage.type === 'greeting' ? 5000 : undefined,
        };

        return frenlyMessage;
      } catch (error) {
        logger.error('Error generating contextual message:', { error: error instanceof Error ? error.message : String(error) });
        // Fallback to default message
        return {
          id: Math.random().toString(36).substr(2, 9),
          type: 'greeting' as const,
          content: "Hi there! I'm Frenly, your AI assistant! 🤖✨ Ready to help you!",
          timestamp: new Date(),
          page: state.currentPage,
          priority: 'medium',
          dismissible: true,
          autoHide: 5000,
        } as FrenlyMessage;
      } finally {
        messageGenerationRef.current = null;
      }
    })();

    messageGenerationRef.current = promise;
    return promise;
  }, [state.currentPage, state.userProgress, maintenanceStatus, isMaintenanceStale]);

  // Track session start
  useEffect(() => {
    if (!localStorage.getItem('sessionStart')) {
      localStorage.setItem('sessionStart', Date.now().toString());
    }
  }, []);

  // Show contextual message when page changes
  useEffect(() => {
    generateContextualMessage().then((message) => {
      if (message) {
        showMessage(message);
      }
    });
  }, [state.currentPage, generateContextualMessage, showMessage]);

  if (!state.isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50"
        title="Open Frenly AI Assistant"
        aria-label="Open Frenly AI Assistant"
      >
        <MessageCircle className="w-8 h-8 text-white" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        state.isMinimized ? 'w-16 h-16' : 'w-80'
      }`}
    >
      {/* Frenly Character */}
      <div className="relative">
        {/* Character Avatar */}
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center mb-2 relative overflow-hidden">
          {/* Eyes */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <div className="w-2 h-2 bg-white rounded-full" />
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>

          {/* Mouth */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
            <div className="w-4 h-2 border-b-2 border-white rounded-full" />
          </div>
        </div>

        {/* Speech Bubble */}
        {state.activeMessage && !state.isMinimized && (
          <div className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-lg p-4 max-w-64 border-2 border-purple-200">
            {/* Speech bubble tail */}
            <div className="absolute bottom-0 right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
            <div className="absolute bottom-0 right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-purple-200 transform translate-y-0.5" />

            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {state.activeMessage.type === 'greeting' && (
                  <Smile className="w-4 h-4 text-purple-500" />
                )}
                {state.activeMessage.type === 'tip' && (
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                )}
                {state.activeMessage.type === 'warning' && (
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                )}
                {state.activeMessage.type === 'celebration' && (
                  <PartyPopper className="w-4 h-4 text-pink-500" />
                )}
                {state.activeMessage.type === 'encouragement' && (
                  <Star className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-sm font-medium text-purple-600">Frenly AI</span>
              </div>
              <button
                onClick={async () => {
                  // Record feedback when user dismisses
                  if (state.activeMessage) {
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                      try {
                        await frenlyAgentService.recordFeedback(
                          userId,
                          state.activeMessage.id,
                          'dismissed'
                        );
                      } catch (error) {
                        logger.error('Error recording feedback:', { error: error instanceof Error ? error.message : String(error) });
                      }
                    }
                  }
                  hideMessage();
                }}
                className="text-gray-400 hover:text-gray-600"
                title="Close message"
                aria-label="Close message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-700 mb-3">{state.activeMessage.content}</p>

            {state.activeMessage.action && (
              <button
                onClick={state.activeMessage.action.onClick}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm py-2 px-4 rounded-lg hover:shadow-md transition-all duration-200"
              >
                {state.activeMessage.action.text}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Control Panel */}
      {!state.isMinimized && (
        <div className="bg-white rounded-lg shadow-lg p-3 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-600">Frenly AI</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleMinimize}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Minimize Frenly AI"
                aria-label="Minimize Frenly AI"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={toggleVisibility}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Close Frenly AI"
                aria-label="Close Frenly AI"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Progress</span>
              <span className="text-xs text-gray-600">
                {state.userProgress.completedSteps.length}/{state.userProgress.totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(state.userProgress.completedSteps.length / state.userProgress.totalSteps) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* System Health Badge (Frenly-aware) with Enhanced Tooltip */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center space-x-2">
                <Activity className="w-3 h-3 text-gray-500" />
                <span className="font-medium text-gray-700">System Health</span>
              </div>
              {maintenanceStatus && (
                <a
                  href={`/${maintenanceStatus.reportPath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[0.65rem] text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
                >
                  <span>View report</span>
                </a>
              )}
            </div>
            
            {/* Health Status Badge with Tooltip */}
            <div className="flex items-center gap-2">
              {maintenanceLoading && (
                <div className="flex-1 flex items-center justify-center py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <RefreshCw className="w-3 h-3 mr-1.5 text-gray-400 animate-spin" />
                  <span className="text-[0.7rem] text-gray-500">Checking status...</span>
                </div>
              )}
              
              {!maintenanceLoading && maintenanceStatus && (
                <Tooltip
                  content={
                    <div className="min-w-[200px] max-w-[280px]">
                      <div className="font-semibold mb-2 pb-1 border-b border-gray-700">
                        Maintenance Details
                      </div>
                      
                      {/* Last Run */}
                      <div className="flex items-center gap-2 mb-1.5 text-gray-300">
                        <Clock className="w-3 h-3" />
                        <span className="text-[0.7rem]">
                          {new Date(maintenanceStatus.lastRun).toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Mode & Duration */}
                      <div className="flex items-center justify-between mb-2 text-[0.7rem] text-gray-300">
                        <span>Mode: <span className="text-white">{maintenanceStatus.mode}</span></span>
                        <span>{maintenanceStatus.durationSeconds}s</span>
                      </div>
                      
                      {/* Checks Summary */}
                      <div className="flex items-center gap-3 mb-2 text-[0.7rem]">
                        {maintenanceStatus.hardFailures === 0 && maintenanceStatus.softFailures === 0 ? (
                          <span className="flex items-center text-green-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            All checks passed
                          </span>
                        ) : (
                          <>
                            {maintenanceStatus.hardFailures > 0 && (
                              <span className="flex items-center text-red-400">
                                <XCircle className="w-3 h-3 mr-1" />
                                {maintenanceStatus.hardFailures} hard
                              </span>
                            )}
                            {maintenanceStatus.softFailures > 0 && (
                              <span className="flex items-center text-yellow-400">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {maintenanceStatus.softFailures} soft
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Failed Checks List */}
                      {maintenanceStatus.failedChecks.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="text-[0.65rem] text-gray-400 mb-1">Failed checks:</div>
                          <ul className="space-y-0.5">
                            {maintenanceStatus.failedChecks.slice(0, 5).map((check, i) => (
                              <li key={i} className="text-[0.65rem] text-red-300 flex items-start gap-1">
                                <span className="text-red-400 mt-0.5">•</span>
                                <span>{check}</span>
                              </li>
                            ))}
                            {maintenanceStatus.failedChecks.length > 5 && (
                              <li className="text-[0.65rem] text-gray-400 italic">
                                +{maintenanceStatus.failedChecks.length - 5} more...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  }
                  position="top"
                  delay={200}
                >
                  <button
                    type="button"
                    className={`flex-1 flex items-center justify-between py-2 px-3 rounded-lg border transition-all duration-200 cursor-default ${
                      maintenanceStatus.overallStatus === 'healthy'
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : maintenanceStatus.overallStatus === 'degraded'
                        ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                        : 'bg-red-50 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          maintenanceStatus.overallStatus === 'healthy'
                            ? 'bg-green-500'
                            : maintenanceStatus.overallStatus === 'degraded'
                            ? 'bg-yellow-500 animate-pulse'
                            : 'bg-red-500 animate-pulse'
                        }`}
                      />
                      <span
                        className={`text-[0.75rem] font-medium ${
                          maintenanceStatus.overallStatus === 'healthy'
                            ? 'text-green-700'
                            : maintenanceStatus.overallStatus === 'degraded'
                            ? 'text-yellow-700'
                            : 'text-red-700'
                        }`}
                      >
                        {maintenanceStatus.overallStatus === 'healthy'
                          ? 'All Systems Healthy'
                          : maintenanceStatus.overallStatus === 'degraded'
                          ? 'Partially Degraded'
                          : 'Attention Required'}
                      </span>
                    </div>
                    
                    {/* Mini stats */}
                    <div className="flex items-center gap-1.5 text-[0.65rem]">
                      {maintenanceStatus.hardFailures > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">
                          {maintenanceStatus.hardFailures}
                        </span>
                      )}
                      {maintenanceStatus.softFailures > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-600 font-medium">
                          {maintenanceStatus.softFailures}
                        </span>
                      )}
                      {maintenanceStatus.hardFailures === 0 && maintenanceStatus.softFailures === 0 && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </div>
                  </button>
                </Tooltip>
              )}
              
              {!maintenanceLoading && !maintenanceStatus && (
                <div className="flex-1 flex items-center justify-center py-2 rounded-lg bg-gray-50 border border-dashed border-gray-300">
                  <Clock className="w-3 h-3 mr-1.5 text-gray-400" />
                  <span className="text-[0.7rem] text-gray-500">No recent maintenance run</span>
                </div>
              )}
            </div>
            
            {/* History Sparkline */}
            {maintenanceHistory.length > 1 && (
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {maintenanceHistory.slice(0, 7).reverse().map((run: MaintenanceRun, i: number) => (
                    <Tooltip
                      key={i}
                      content={
                        <div className="text-[0.7rem]">
                          <div className="font-medium">{new Date(run.timestamp).toLocaleDateString()}</div>
                          <div className="capitalize">{run.overallStatus}</div>
                        </div>
                      }
                      position="top"
                      delay={100}
                    >
                      <span
                        className={`block w-2.5 h-2.5 rounded-sm transition-all hover:scale-125 ${
                          run.overallStatus === 'healthy'
                            ? 'bg-green-400'
                            : run.overallStatus === 'degraded'
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                        }`}
                      />
                    </Tooltip>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[0.65rem]">
                  {healthTrend === 'improving' && (
                    <span className="text-green-600 flex items-center">
                      <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      Improving
                    </span>
                  )}
                  {healthTrend === 'declining' && (
                    <span className="text-red-600 flex items-center">
                      <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Declining
                    </span>
                  )}
                  {healthTrend === 'stable' && (
                    <span className="text-gray-500 flex items-center">
                      <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                      </svg>
                      Stable
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                const message = await generateContextualMessage();
                if (message) {
                  showMessage(message);
                }
              }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs py-2 px-3 rounded-lg hover:shadow-md transition-all duration-200"
              title="Get help from Frenly AI"
              aria-label="Get help from Frenly AI"
            >
              Get Help
            </button>
            <button
              onClick={() => {
                updatePreferences({ showTips: !state.preferences.showTips });
              }}
              className={`p-2 rounded-lg transition-all duration-200 ${
                state.preferences.showTips
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
              title="Toggle tips display"
              aria-label="Toggle tips display"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
