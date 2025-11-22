import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '@/services/logger';
import { FrenlyGuidance, FrenlyTips } from './FrenlyGuidance';
import { FrenlyProvider as OriginalFrenlyProvider } from './FrenlyProvider';

export interface FrenlyAIContextType {
  // Progress tracking
  userProgress: string[];
  updateProgress: (stepId: string) => void;
  resetProgress: () => void;

  // Tutorial system
  isTutorialActive: boolean;
  startTutorial: () => void;
  stopTutorial: () => void;

  // Tips system
  showTips: boolean;
  toggleTips: () => void;

  // Current context
  currentPage: string;
  updatePage: (page: string) => void;

  // AI personality
  personality: {
    mood: 'happy' | 'excited' | 'concerned' | 'proud' | 'curious';
    energy: 'low' | 'medium' | 'high';
    helpfulness: number;
  };
  updatePersonality: (updates: Partial<FrenlyAIContextType['personality']>) => void;
}

const FrenlyAIContext = createContext<FrenlyAIContextType | undefined>(undefined);

export const useFrenlyAI = () => {
  const context = useContext(FrenlyAIContext);
  if (!context) {
    throw new Error('useFrenlyAI must be used within a FrenlyAIProvider');
  }
  return context;
};

interface FrenlyAIProviderProps {
  children: ReactNode;
  initialProgress?: string[];
  enableTips?: boolean;
  enableTutorial?: boolean;
}

export const FrenlyAIProvider: React.FC<FrenlyAIProviderProps> = ({
  children,
  initialProgress = [],
  enableTips = true,
  enableTutorial = true,
}) => {
const [userProgress, setUserProgress] = useState<string[]>(initialProgress)
  const [isTutorialActive, setIsTutorialActive] = useState(false)
  const [showTips, setShowTips] = useState(enableTips)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [personality, setPersonality] = useState<FrenlyAIContextType['personality']>({
    mood: 'happy',
    energy: 'medium',
    helpfulness: 8
  })481751c1

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('frenly-progress');
    if (savedProgress) {
      try {
        setUserProgress(JSON.parse(savedProgress));
      } catch (error) {
        logger.error('Failed to load Frenly progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('frenly-progress', JSON.stringify(userProgress));
  }, [userProgress]);

  const updateProgress = (stepId: string) => {
    setUserProgress((prev) => {
      if (!prev.includes(stepId)) {
        return [...prev, stepId];
      }
      return prev;
    });
  };

  const resetProgress = () => {
    setUserProgress([]);
    localStorage.removeItem('frenly-progress');
  };

  const startTutorial = () => {
    setIsTutorialActive(true);
    setPersonality((prev) => ({ ...prev, mood: 'excited', energy: 'high' }));
  };

  const stopTutorial = () => {
    setIsTutorialActive(false);
    setPersonality((prev) => ({ ...prev, mood: 'proud', energy: 'medium' }));
  };

  const toggleTips = () => {
    setShowTips((prev) => !prev);
  };

  const updatePage = (page: string) => {
    setCurrentPage(page);
  };

  const updatePersonality = (updates: Partial<FrenlyAIContextType['personality']>) => {
    setPersonality((prev) => ({ ...prev, ...updates }));
  };

  const contextValue: FrenlyAIContextType = {
    userProgress,
    updateProgress,
    resetProgress,
    isTutorialActive,
    startTutorial,
    stopTutorial,
    showTips,
    toggleTips,
    currentPage,
    updatePage,
    personality,
    updatePersonality,
  };

  const tips = [
    {
      id: 'upload-tip',
      title: '💡 Upload Tip',
      content:
        'Make sure your CSV files have headers in the first row for better data recognition.',
      category: 'upload' as const,
      icon: <span>📁</span>,
    },
    {
      id: 'reconciliation-tip',
      title: '⚡ Reconciliation Tip',
      content:
        'Start with a higher tolerance level and gradually reduce it to find the best matches.',
      category: 'reconciliation' as const,
      icon: <span>🔍</span>,
    },
    {
      id: 'visualization-tip',
      title: '📊 Visualization Tip',
      content: 'Use different chart types to understand your data patterns better.',
      category: 'visualization' as const,
      icon: <span>📈</span>,
    },
    {
      id: 'general-tip',
      title: '🎯 General Tip',
      content: 'Save your work frequently and use the auto-save feature to avoid data loss.',
      category: 'general' as const,
      icon: <span>💾</span>,
    },
  ];

  return (
    <FrenlyAIContext.Provider value={contextValue}>
      <OriginalFrenlyProvider>
        {children}

        {/* Frenly AI Components */}
        {enableTutorial && (
          <FrenlyGuidance
            currentPage={currentPage}
            userProgress={userProgress}
            onStepComplete={updateProgress}
            onStartTutorial={startTutorial}
          />
        )}

        {enableTips && showTips && <FrenlyTips tips={tips} currentPage={currentPage} />}
      </OriginalFrenlyProvider>
    </FrenlyAIContext.Provider>
  );
};

// Hook for easy access to Frenly AI features
export const useFrenlyFeatures = () => {
  const {
    userProgress,
    updateProgress,
    isTutorialActive,
    startTutorial,
    stopTutorial,
    showTips,
    toggleTips,
    personality,
  } = useFrenlyAI();

  const getProgressPercentage = () => {
    const totalSteps = 7; // Total number of guidance steps
    return Math.round((userProgress.length / totalSteps) * 100);
  };

  const getNextStep = () => {
    const allSteps = [
      'welcome',
      'upload-files',
      'configure-reconciliation',
      'review-matches',
      'adjudicate-discrepancies',
      'visualize-results',
      'export-summary',
    ];
    return allSteps.find((step) => !userProgress.includes(step));
  };

  const isStepCompleted = (stepId: string) => {
    return userProgress.includes(stepId);
  };

  const getEncouragementMessage = () => {
    const progress = getProgressPercentage();
    if (progress === 100) return "🎉 Congratulations! You've mastered the platform!";
    if (progress >= 75) return "🚀 You're almost there! Just a few more steps!";
    if (progress >= 50) return "💪 Great progress! You're halfway through!";
    if (progress >= 25) return '🌟 Nice start! Keep going!';
    return "👋 Welcome! Let's get you started!";
  };

  return {
    // Progress
    userProgress,
    updateProgress,
    getProgressPercentage,
    getNextStep,
    isStepCompleted,
    getEncouragementMessage,

    // Tutorial
    isTutorialActive,
    startTutorial,
    stopTutorial,

    // Tips
    showTips,
    toggleTips,

    // Personality
    personality,
  };
};
