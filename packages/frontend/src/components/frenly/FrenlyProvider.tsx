import React, { createContext, useContext, useState, ReactNode } from 'react'

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
    </FrenlyContext.Provider>
  )
}
