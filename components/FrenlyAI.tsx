'use client';

import React, { useState, useCallback } from 'react';
import { MessageCircle, X, Minimize2, Maximize2, Lightbulb, AlertTriangle, PartyPopper, Sparkles } from 'lucide-react';

interface FrenlyMessage {
  id: string;
  type: 'greeting' | 'tip' | 'warning' | 'celebration' | 'question' | 'instruction' | 'encouragement';
  content: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  dismissible: boolean;
}

interface FrenlyAIProps {
  currentPage: string;
  userProgress: {
    completedSteps: string[];
    currentStep: string;
    totalSteps: number;
  };
  onAction?: (action: string) => void;
}

const FrenlyAI: React.FC<FrenlyAIProps> = ({ currentPage, userProgress, onAction }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMessage, setActiveMessage] = useState<FrenlyMessage | null>(null);

  const progressPercentage = Math.round(
    (userProgress.completedSteps.length / userProgress.totalSteps) * 100
  );

  const getMessageIcon = (type: FrenlyMessage['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'celebration':
        return <PartyPopper className="w-4 h-4 text-purple-500" />;
      case 'tip':
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary-500" />;
    }
  };

  const handleToggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev);
    if (onAction) {
      onAction('toggle_visibility');
    }
  }, [onAction]);

  const handleToggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
    if (onAction) {
      onAction('toggle_minimize');
    }
  }, [onAction]);

  const handleDismissMessage = useCallback(() => {
    setActiveMessage(null);
    if (onAction) {
      onAction('dismiss_message');
    }
  }, [onAction]);

  if (!isVisible) {
    return (
      <button
        onClick={handleToggleVisibility}
        className="fixed bottom-6 right-6 p-4 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        aria-label="Show Frenly AI assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleToggleMinimize}
          className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-200 hover:border-primary-300 transition-colors"
          aria-label="Expand Frenly AI assistant"
        >
          <span className="text-2xl">🤖</span>
          <span className="text-sm font-medium text-gray-700">Frenly AI</span>
          <Maximize2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h3 className="text-white font-semibold">Frenly AI</h3>
              <p className="text-primary-100 text-xs">Your helpful assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleToggleMinimize}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              aria-label="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleVisibility}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">Your Progress</span>
          <span className="text-xs font-bold text-primary-600">{progressPercentage}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {userProgress.completedSteps.length} of {userProgress.totalSteps} steps completed
        </p>
      </div>

      {/* Active Message */}
      {activeMessage && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start space-x-3">
            {getMessageIcon(activeMessage.type)}
            <div className="flex-1">
              <p className="text-sm text-gray-700">{activeMessage.content}</p>
              {activeMessage.dismissible && (
                <button
                  onClick={handleDismissMessage}
                  className="text-xs text-gray-400 hover:text-gray-600 mt-2"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="p-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            👋 Hey! I&apos;m here to help you with your reconciliation tasks.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Currently on: <span className="font-medium">{currentPage}</span>
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAction?.('get_help')}
            className="flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Lightbulb className="w-3 h-3" />
            <span>Get Tips</span>
          </button>
          <button
            onClick={() => onAction?.('start_tutorial')}
            className="flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>Tutorial</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrenlyAI;
