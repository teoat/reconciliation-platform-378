'use client';
import { logger } from '../services/logger';
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  MessageCircle,
  X,
  Minimize2,
  Lightbulb,
  AlertTriangle,
  PartyPopper,
  Star,
  Smile,
} from 'lucide-react';
import { FrenlyState, FrenlyMessage, FrenlyExpression } from '../types/frenly';
import { frenlyAgentService } from '@/services/frenlyAgentService';

interface FrenlyAIProps {
  currentPage: string;
  userProgress: {
    completedSteps: string[];
    currentStep: string;
    totalSteps: number;
  };
  onAction?: (action: string) => void;
}

const FrenlyAI: React.FC<FrenlyAIProps> = ({ currentPage, userProgress, onAction: _onAction }) => {
  const [state, setState] = useState<FrenlyState>({
    isVisible: true,
    isMinimized: false,
    currentPage,
    userProgress,
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

  const [currentExpression, setCurrentExpression] = useState<FrenlyExpression>({
    eyes: 'happy',
    mouth: 'smile',
    accessories: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Generate contextual messages using FrenlyAgentService
  const createDefaultMessage = useCallback(
    (): FrenlyMessage => ({
      id: Math.random().toString(36).substr(2, 9),
      type: 'greeting',
      content:
        "Hi there! I'm Frenly, your AI assistant! 🤖✨ Ready to help you with your reconciliation journey!",
      timestamp: new Date(),
      page: currentPage,
      priority: 'medium',
      dismissible: true,
      autoHide: 5000,
    }),
    [currentPage]
  );

  const generateContextualMessage = useCallback(async (): Promise<FrenlyMessage> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get user ID from localStorage or generate one
      const userId =
        localStorage.getItem('userId') ||
        `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!localStorage.getItem('userId')) {
        localStorage.setItem('userId', userId);
      }

      // Track interaction
      await frenlyAgentService.trackInteraction(userId, 'page_view').catch((err) => {
        logger.warn('Failed to track interaction:', err);
      });

      // Generate intelligent message using agent
      const agentMessage = await frenlyAgentService.generateMessage({
        userId,
        page: currentPage,
        progress: {
          completedSteps: userProgress.completedSteps,
          totalSteps: userProgress.totalSteps,
          currentStep: userProgress.currentStep,
        },
        preferences: {
          communicationStyle: 'conversational',
          messageFrequency: 'medium',
        },
        behavior: {
          sessionDuration:
            Date.now() -
            (localStorage.getItem('sessionStart')
              ? parseInt(localStorage.getItem('sessionStart')!)
              : Date.now()),
        },
      });

      // Track message shown
      await frenlyAgentService
        .trackInteraction(userId, 'message_shown', agentMessage.id)
        .catch((err) => {
          logger.warn('Failed to track message shown:', err);
        });

      // Convert agent message to FrenlyMessage format
      return {
        id: agentMessage.id,
        type: agentMessage.type === 'help' ? 'tip' : agentMessage.type,
        content: agentMessage.content,
        timestamp: agentMessage.timestamp,
        page: currentPage,
        priority: agentMessage.priority,
        dismissible: true,
        autoHide: agentMessage.type === 'greeting' ? 5000 : undefined,
      };
    } catch (error) {
      logger.error('Error generating contextual message:', { error: error instanceof Error ? error.message : String(error) });
      setError('Unable to generate message. Using default message.');
      // Fallback to default message
      return createDefaultMessage();
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, userProgress, createDefaultMessage]);


  // Update expression based on mood and message type
  const updateExpression = useCallback((messageType: FrenlyMessage['type']) => {
    switch (messageType) {
      case 'greeting':
        setCurrentExpression({ eyes: 'happy', mouth: 'big-smile', accessories: [] });
        break;
      case 'celebration':
        setCurrentExpression({ eyes: 'excited', mouth: 'big-smile', accessories: ['party-hat'] });
        break;
      case 'warning':
        setCurrentExpression({ eyes: 'concerned', mouth: 'neutral', accessories: [] });
        break;
      case 'tip':
        setCurrentExpression({ eyes: 'wink', mouth: 'smile', accessories: ['lightbulb'] });
        break;
      case 'encouragement':
        setCurrentExpression({ eyes: 'happy', mouth: 'smile', accessories: ['star'] });
        break;
      default:
        setCurrentExpression({ eyes: 'normal', mouth: 'smile', accessories: [] });
    }
  }, []);

  const hideMessage = useCallback(() => {
    setState((prev) => ({ ...prev, activeMessage: undefined }));
    setCurrentExpression({ eyes: 'normal', mouth: 'smile', accessories: [] });
  }, []);

  // Show new message
  const showMessage = useCallback(
    (message: FrenlyMessage) => {
      setState((prev) => ({ ...prev, activeMessage: message }));
      updateExpression(message.type);

      // Auto-hide message after delay
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }

      if (message.autoHide) {
        messageTimeoutRef.current = setTimeout(() => {
          hideMessage();
        }, message.autoHide);
      }
    },
    [updateExpression, hideMessage]
  );

  // These functions are used in JSX event handlers (lines 226, 398, 406)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleVisibility = () => {
    setState((prev) => ({ ...prev, isVisible: !prev.isVisible }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleMinimize = () => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  // Track session start
  useEffect(() => {
    if (!localStorage.getItem('sessionStart')) {
      localStorage.setItem('sessionStart', Date.now().toString());
    }
  }, []);

  // Initialize with contextual message
  useEffect(() => {
    generateContextualMessage().then((message) => {
      showMessage(message);
    });
  }, [currentPage, userProgress, generateContextualMessage, showMessage]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  if (!state.isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label="Open Frenly AI Assistant"
        title="Open Frenly AI Assistant"
      >
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        state.isMinimized ? 'w-16 h-16 sm:w-16 sm:h-16' : 'w-[calc(100vw-3rem)] sm:w-80 max-w-sm'
      }`}
      role="complementary"
      aria-label="Frenly AI Assistant"
    >
      {/* Frenly Character */}
      <div className="relative">
        {/* Character Avatar */}
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center mb-2 relative overflow-hidden">
          {/* Eyes */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <div
              className={`w-2 h-2 bg-white rounded-full ${
                currentExpression.eyes === 'wink' ? 'opacity-0' : ''
              }`}
            />
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>

          {/* Mouth */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
            {currentExpression.mouth === 'smile' && (
              <div className="w-4 h-2 border-b-2 border-white rounded-full" />
            )}
            {currentExpression.mouth === 'big-smile' && (
              <div className="w-5 h-3 border-b-2 border-white rounded-full" />
            )}
            {currentExpression.mouth === 'neutral' && (
              <div className="w-3 h-0.5 bg-white rounded-full" />
            )}
          </div>

          {/* Accessories */}
          {currentExpression.accessories.includes('party-hat') && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-6 border-transparent border-b-yellow-400" />
          )}
          {currentExpression.accessories.includes('lightbulb') && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
          )}
          {currentExpression.accessories.includes('star') && (
            <div className="absolute -top-1 -left-1 w-3 h-3 text-yellow-400">⭐</div>
          )}
        </div>

        {/* Speech Bubble */}
        {!state.isMinimized && (
          <>
            {isLoading && !state.activeMessage && (
              <div className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-lg p-4 max-w-64 border-2 border-purple-200">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' } as React.CSSProperties}
                    />
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' } as React.CSSProperties}
                    />
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' } as React.CSSProperties}
                    />
                  </div>
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute bottom-20 right-0 bg-orange-50 rounded-2xl shadow-lg p-4 max-w-64 border-2 border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">Notice</span>
                </div>
                <p className="text-xs text-orange-700">{error}</p>
              </div>
            )}

            {state.activeMessage && (
              <div
                className="absolute bottom-20 right-0 bg-white rounded-2xl shadow-lg p-3 sm:p-4 max-w-[calc(100vw-6rem)] sm:max-w-64 border-2 border-purple-200"
                role="alert"
                aria-live="polite"
              >
                {/* Speech bubble tail */}
                <div className="absolute bottom-0 right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
                <div className="absolute bottom-0 right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-purple-200 transform translate-y-0.5" />

                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {state.activeMessage.type === 'greeting' && (
                      <Smile className="w-4 h-4 text-purple-500" aria-hidden="true" />
                    )}
                    {state.activeMessage.type === 'tip' && (
                      <Lightbulb className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                    )}
                    {state.activeMessage.type === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" aria-hidden="true" />
                    )}
                    {state.activeMessage.type === 'celebration' && (
                      <PartyPopper className="w-4 h-4 text-pink-500" aria-hidden="true" />
                    )}
                    {state.activeMessage.type === 'encouragement' && (
                      <Star className="w-4 h-4 text-blue-500" aria-hidden="true" />
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
                    aria-label="Close message"
                    title="Close message"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-gray-700 mb-3">{state.activeMessage.content}</p>

                {state.activeMessage.action && (
                  <button
                    onClick={state.activeMessage.action.onClick}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm py-2 px-4 rounded-lg hover:shadow-md transition-all duration-200"
                    aria-label={state.activeMessage.action.text}
                  >
                    {state.activeMessage.action.text}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Panel */}
      {!state.isMinimized && (
        <div className="bg-white rounded-lg shadow-lg p-2 sm:p-3 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-600">Frenly AI</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleMinimize}
                className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                aria-label={state.isMinimized ? 'Expand Frenly AI' : 'Minimize Frenly AI'}
                title={state.isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minimize2 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={toggleVisibility}
                className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                aria-label="Close Frenly AI"
                title="Close"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Progress</span>
              <span className="text-xs text-gray-600">
                {userProgress.completedSteps.length}/{userProgress.totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(userProgress.completedSteps.length / userProgress.totalSteps) * 100}%`,
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                const message = await generateContextualMessage();
                showMessage(message);
              }}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs py-2 px-3 rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="Get help from Frenly AI"
              title="Get help"
            >
              {isLoading ? 'Loading...' : 'Get Help'}
            </button>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    showTips: !prev.preferences.showTips,
                  },
                }))
              }
              className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                state.preferences.showTips
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
              aria-label={state.preferences.showTips ? 'Hide tips' : 'Show tips'}
              title={state.preferences.showTips ? 'Hide tips' : 'Show tips'}
            >
              <Lightbulb className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(FrenlyAI);
