import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { logger } from '../services/logger';import { MessageCircle } from 'lucide-react'
import { X } from 'lucide-react'
import { Minimize2 } from 'lucide-react'
import { Lightbulb } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { PartyPopper } from 'lucide-react'
import { Star } from 'lucide-react'
import { Smile } from 'lucide-react'
import { frenlyAgentService } from '@/services/frenlyAgentService'

// Frenly AI Types
export interface FrenlyMessage {
  id: string
  type: 'greeting' | 'tip' | 'warning' | 'celebration' | 'question' | 'instruction' | 'encouragement'
  content: string
  action?: {
    text: string
    onClick: () => void
  }
  timestamp: Date
  page?: string
  priority: 'low' | 'medium' | 'high'
  dismissible: boolean
  autoHide?: number
}

export interface FrenlyState {
  isVisible: boolean
  isMinimized: boolean
  currentPage: string
  userProgress: {
    completedSteps: string[]
    currentStep: string
    totalSteps: number
  }
  personality: {
    mood: 'happy' | 'excited' | 'concerned' | 'proud' | 'curious'
    energy: 'low' | 'medium' | 'high'
    helpfulness: number
  }
  preferences: {
    showTips: boolean
    showCelebrations: boolean
    showWarnings: boolean
    voiceEnabled: boolean
    animationSpeed: 'slow' | 'normal' | 'fast'
  }
  conversationHistory: FrenlyMessage[]
  activeMessage?: FrenlyMessage
}

interface FrenlyContextType {
  state: FrenlyState
  updateProgress: (step: string) => void
  showMessage: (message: FrenlyMessage) => void
  hideMessage: () => void
  updatePage: (page: string) => void
  toggleVisibility: () => void
  toggleMinimize: () => void
  updatePreferences: (preferences: Partial<FrenlyState['preferences']>) => void
}

const FrenlyContext = createContext<FrenlyContextType | undefined>(undefined)

export const useFrenly = () => {
  const context = useContext(FrenlyContext)
  if (!context) {
    throw new Error('useFrenly must be used within a FrenlyProvider')
  }
  return context
}

interface FrenlyProviderProps {
  children: ReactNode
}

export const FrenlyProvider: React.FC<FrenlyProviderProps> = ({ children }) => {
  const [state, setState] = useState<FrenlyState>({
    isVisible: true,
    isMinimized: false,
    currentPage: '/dashboard',
    userProgress: {
      completedSteps: [],
      currentStep: 'dashboard',
      totalSteps: 7
    },
    personality: {
      mood: 'happy',
      energy: 'high',
      helpfulness: 95
    },
    preferences: {
      showTips: true,
      showCelebrations: true,
      showWarnings: true,
      voiceEnabled: false,
      animationSpeed: 'normal'
    },
    conversationHistory: [],
    activeMessage: undefined
  })

  const updateProgress = (step: string) => {
    setState(prev => {
      const newCompletedSteps = prev.userProgress.completedSteps.includes(step)
        ? prev.userProgress.completedSteps
        : [...prev.userProgress.completedSteps, step]

      return {
        ...prev,
        userProgress: {
          ...prev.userProgress,
          completedSteps: newCompletedSteps,
          currentStep: step
        }
      }
    })
  }

  const showMessage = (message: FrenlyMessage) => {
    setState(prev => ({
      ...prev,
      activeMessage: message,
      conversationHistory: [...prev.conversationHistory, message]
    }))

    // Auto-hide message if specified
    if (message.autoHide) {
      setTimeout(() => {
        hideMessage()
      }, message.autoHide)
    }
  }

  const hideMessage = () => {
    setState(prev => ({ ...prev, activeMessage: undefined }))
  }

  const updatePage = (page: string) => {
    setState(prev => ({ ...prev, currentPage: page }))
  }

  const toggleVisibility = () => {
    setState(prev => ({ ...prev, isVisible: !prev.isVisible }))
  }

  const toggleMinimize = () => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }))
  }

  const updatePreferences = (preferences: Partial<FrenlyState['preferences']>) => {
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
    }))
  }

  const value: FrenlyContextType = {
    state,
    updateProgress,
    showMessage,
    hideMessage,
    updatePage,
    toggleVisibility,
    toggleMinimize,
    updatePreferences
  }

  return (
    <FrenlyContext.Provider value={value}>
      {children}
      <FrenlyAI />
    </FrenlyContext.Provider>
  )
}

// Frenly AI Component
const FrenlyAI: React.FC = () => {
  const { state, hideMessage, toggleVisibility, toggleMinimize, showMessage } = useFrenly()

  // Generate contextual messages using FrenlyAgentService
  const generateContextualMessage = useCallback(async (): Promise<FrenlyMessage | null> => {
    try {
      // Get user ID from localStorage or generate one
      const userId = localStorage.getItem('userId') || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          sessionDuration: Date.now() - (localStorage.getItem('sessionStart') ? parseInt(localStorage.getItem('sessionStart')!) : Date.now()),
        },
      });

      // Track message shown
      await frenlyAgentService.trackInteraction(userId, 'message_shown', agentMessage.id);

      // Convert agent message to FrenlyMessage format
      const frenlyMessage: FrenlyMessage = {
        id: agentMessage.id,
        type: agentMessage.type === 'help' ? 'tip' : agentMessage.type,
        content: agentMessage.content,
        timestamp: agentMessage.timestamp,
        page: state.currentPage,
        priority: agentMessage.priority,
        dismissible: true,
        autoHide: agentMessage.type === 'greeting' ? 5000 : undefined,
      };

      return frenlyMessage;
    } catch (error) {
      logger.error('Error generating contextual message:', error);
      // Fallback to default message
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'greeting',
        content: "Hi there! I'm Frenly, your AI assistant! 🤖✨ Ready to help you!",
        timestamp: new Date(),
        page: state.currentPage,
        priority: 'medium',
        dismissible: true,
        autoHide: 5000
      };
    }
  }, [state.currentPage, state.userProgress])

  // Track session start
  useEffect(() => {
    if (!localStorage.getItem('sessionStart')) {
      localStorage.setItem('sessionStart', Date.now().toString());
    }
  }, []);

  // Show contextual message when page changes
  useEffect(() => {
    generateContextualMessage().then(message => {
      if (message) {
        showMessage(message);
      }
    });
  }, [state.currentPage, generateContextualMessage])

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
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      state.isMinimized ? 'w-16 h-16' : 'w-80'
    }`}>
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
                {state.activeMessage.type === 'greeting' && <Smile className="w-4 h-4 text-purple-500" />}
                {state.activeMessage.type === 'tip' && <Lightbulb className="w-4 h-4 text-yellow-500" />}
                {state.activeMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                {state.activeMessage.type === 'celebration' && <PartyPopper className="w-4 h-4 text-pink-500" />}
                {state.activeMessage.type === 'encouragement' && <Star className="w-4 h-4 text-blue-500" />}
                <span className="text-sm font-medium text-purple-600">Frenly AI</span>
              </div>
              <button
                onClick={async () => {
                  // Record feedback when user dismisses
                  if (state.activeMessage) {
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                      try {
                        await frenlyAgentService.recordFeedback(userId, state.activeMessage.id, 'dismissed');
                      } catch (error) {
                        logger.error('Error recording feedback:', error);
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
            
            <p className="text-sm text-gray-700 mb-3">
              {state.activeMessage.content}
            </p>
            
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
                style={{ width: `${(state.userProgress.completedSteps.length / state.userProgress.totalSteps) * 100}%` }}
              />
            </div>
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
                const newState = { 
                  ...state, 
                  preferences: { 
                    ...state.preferences, 
                    showTips: !state.preferences.showTips 
                  } 
                }
                // This would need to be handled by the parent component
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
  )
}
