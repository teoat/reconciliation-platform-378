// Frenly AI Meta Agent Types and Interfaces
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
  autoHide?: number // milliseconds
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
    helpfulness: number // 0-100
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

export interface FrenlyAnimation {
  type: 'bounce' | 'wave' | 'spin' | 'pulse' | 'shake' | 'dance' | 'blink'
  duration: number
  delay?: number
  loop?: boolean
}

export interface FrenlyExpression {
  eyes: 'normal' | 'happy' | 'excited' | 'concerned' | 'sleepy' | 'wink'
  mouth: 'smile' | 'big-smile' | 'neutral' | 'surprised' | 'thinking'
  accessories: string[] // hat, glasses, etc.
}

export interface PageGuidance {
  page: string
  title: string
  description: string
  steps: Array<{
    id: string
    title: string
    description: string
    completed: boolean
    tips: string[]
  }>
  tips: string[]
  warnings: string[]
  celebrations: string[]
}
