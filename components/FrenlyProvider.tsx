'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
export interface FrenlyMessage {
  id: string;
  type: 'greeting' | 'tip' | 'warning' | 'celebration' | 'question' | 'instruction' | 'encouragement';
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
  preferences: {
    showTips: boolean;
    showCelebrations: boolean;
    showWarnings: boolean;
  };
  conversationHistory: FrenlyMessage[];
  activeMessage?: FrenlyMessage;
}

interface FrenlyContextType {
  state: FrenlyState;
  updateProgress: (step: string) => void;
  showMessage: (message: FrenlyMessage) => void;
  hideMessage: () => void;
  updatePage: (page: string) => void;
  toggleVisibility: () => void;
  toggleMinimize: () => void;
}

const defaultState: FrenlyState = {
  isVisible: true,
  isMinimized: false,
  currentPage: 'projects',
  userProgress: {
    completedSteps: [],
    currentStep: 'projects',
    totalSteps: 8,
  },
  preferences: {
    showTips: true,
    showCelebrations: true,
    showWarnings: true,
  },
  conversationHistory: [],
  activeMessage: undefined,
};

const FrenlyContext = createContext<FrenlyContextType | undefined>(undefined);

export const useFrenly = (): FrenlyContextType => {
  const context = useContext(FrenlyContext);
  if (!context) {
    throw new Error('useFrenly must be used within a FrenlyProvider');
  }
  return context;
};

interface FrenlyProviderProps {
  children: ReactNode;
}

export const FrenlyProvider: React.FC<FrenlyProviderProps> = ({ children }) => {
  const [state, setState] = useState<FrenlyState>(defaultState);

  const updateProgress = useCallback((step: string) => {
    setState((prev) => ({
      ...prev,
      userProgress: {
        ...prev.userProgress,
        completedSteps: prev.userProgress.completedSteps.includes(step)
          ? prev.userProgress.completedSteps
          : [...prev.userProgress.completedSteps, step],
        currentStep: step,
      },
    }));
  }, []);

  const showMessage = useCallback((message: FrenlyMessage) => {
    setState((prev) => ({
      ...prev,
      activeMessage: message,
      conversationHistory: [...prev.conversationHistory, message].slice(-50),
    }));
  }, []);

  const hideMessage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeMessage: undefined,
    }));
  }, []);

  const updatePage = useCallback((page: string) => {
    setState((prev) => ({
      ...prev,
      currentPage: page,
    }));
  }, []);

  const toggleVisibility = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isVisible: !prev.isVisible,
    }));
  }, []);

  const toggleMinimize = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }));
  }, []);

  const value: FrenlyContextType = {
    state,
    updateProgress,
    showMessage,
    hideMessage,
    updatePage,
    toggleVisibility,
    toggleMinimize,
  };

  return <FrenlyContext.Provider value={value}>{children}</FrenlyContext.Provider>;
};

export default FrenlyProvider;
