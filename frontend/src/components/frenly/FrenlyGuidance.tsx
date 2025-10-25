import React, { useState, useEffect, useCallback } from 'react'
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Lightbulb, 
  AlertTriangle, 
  PartyPopper, 
  Star, 
  Smile,
  BookOpen,
  Target,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  Zap
} from 'lucide-react'

export interface GuidanceStep {
  id: string
  title: string
  description: string
  page: string
  element?: string
  action?: {
    text: string
    onClick: () => void
  }
  completed: boolean
  optional: boolean
}

export interface FrenlyGuidanceProps {
  currentPage: string
  userProgress: string[]
  onStepComplete: (stepId: string) => void
  onStartTutorial: () => void
  className?: string
}

export const FrenlyGuidance: React.FC<FrenlyGuidanceProps> = ({
  currentPage,
  userProgress,
  onStepComplete,
  onStartTutorial,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentStep, setCurrentStep] = useState<GuidanceStep | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const guidanceSteps: GuidanceStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Reconciliation Platform',
      description: 'Let\'s get you started with a quick tour of the platform',
      page: 'dashboard',
      completed: userProgress.includes('welcome'),
      optional: false
    },
    {
      id: 'upload-files',
      title: 'Upload Your Data Files',
      description: 'Start by uploading your CSV or Excel files for reconciliation',
      page: 'ingestion',
      element: 'file-upload',
      completed: userProgress.includes('upload-files'),
      optional: false
    },
    {
      id: 'configure-reconciliation',
      title: 'Configure Reconciliation Settings',
      description: 'Set up matching rules and tolerance levels for your data',
      page: 'reconciliation',
      element: 'config-panel',
      completed: userProgress.includes('configure-reconciliation'),
      optional: false
    },
    {
      id: 'review-matches',
      title: 'Review and Confirm Matches',
      description: 'Check the automatically matched records and make adjustments',
      page: 'reconciliation',
      element: 'matches-table',
      completed: userProgress.includes('review-matches'),
      optional: false
    },
    {
      id: 'adjudicate-discrepancies',
      title: 'Adjudicate Discrepancies',
      description: 'Handle unmatched records and resolve discrepancies',
      page: 'adjudication',
      element: 'discrepancies-list',
      completed: userProgress.includes('adjudicate-discrepancies'),
      optional: false
    },
    {
      id: 'visualize-results',
      title: 'Visualize Your Results',
      description: 'View charts and reports to understand your reconciliation results',
      page: 'visualization',
      element: 'charts-section',
      completed: userProgress.includes('visualize-results'),
      optional: true
    },
    {
      id: 'export-summary',
      title: 'Export Final Summary',
      description: 'Download your reconciliation report and summary',
      page: 'summary',
      element: 'export-buttons',
      completed: userProgress.includes('export-summary'),
      optional: false
    }
  ]

  const currentPageSteps = guidanceSteps.filter(step => step.page === currentPage)
  const completedSteps = guidanceSteps.filter(step => step.completed)
  const nextStep = guidanceSteps.find(step => !step.completed)

  useEffect(() => {
    if (nextStep && nextStep.page === currentPage) {
      setCurrentStep(nextStep)
    } else {
      setCurrentStep(null)
    }
  }, [currentPage, nextStep])

  const handleStepComplete = useCallback((stepId: string) => {
    onStepComplete(stepId)
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
  }, [onStepComplete])

  const getProgressPercentage = () => {
    return Math.round((completedSteps.length / guidanceSteps.length) * 100)
  }

  const getMoodIcon = () => {
    const progress = getProgressPercentage()
    if (progress === 100) return <PartyPopper className="h-5 w-5 text-yellow-500" />
    if (progress >= 75) return <Star className="h-5 w-5 text-blue-500" />
    if (progress >= 50) return <Smile className="h-5 w-5 text-green-500" />
    if (progress >= 25) return <Lightbulb className="h-5 w-5 text-orange-500" />
    return <HelpCircle className="h-5 w-5 text-gray-500" />
  }

  const getEncouragementMessage = () => {
    const progress = getProgressPercentage()
    if (progress === 100) return "🎉 Congratulations! You've completed the full reconciliation process!"
    if (progress >= 75) return "🚀 You're almost there! Just a few more steps to go!"
    if (progress >= 50) return "💪 Great progress! You're halfway through the process!"
    if (progress >= 25) return "🌟 Nice start! Keep going, you're doing great!"
    return "👋 Welcome! Let's get you started with your first reconciliation!"
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <PartyPopper className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      )}

      {/* Main Guidance Panel */}
      <div className={`bg-white rounded-lg shadow-lg border transition-all duration-300 ${
        isExpanded ? 'w-80 h-96' : 'w-16 h-16'
      }`}>
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            title="Open Frenly AI Guidance"
            aria-label="Open Frenly AI Guidance"
          >
            {getMoodIcon()}
          </button>
        ) : (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Frenly AI</h3>
                  <p className="text-xs text-gray-500">Your Reconciliation Guide</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Minimize guidance panel"
              >
                <Minimize2 className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Progress */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">{getEncouragementMessage()}</p>
            </div>

            {/* Current Step */}
            {currentStep && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Target className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{currentStep.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{currentStep.description}</p>
                    {currentStep.action && (
                      <button
                        onClick={currentStep.action.onClick}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                      >
                        <span>{currentStep.action.text}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Steps List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {currentPageSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                      step.completed 
                        ? 'bg-green-50 border border-green-200' 
                        : step.id === currentStep?.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? 'bg-green-500' 
                        : step.id === currentStep?.id
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="h-3 w-3 text-white" />
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${
                        step.completed ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </p>
                      {step.optional && (
                        <span className="text-xs text-gray-500">(Optional)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={onStartTutorial}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                <Zap className="h-4 w-4" />
                <span>Start Tutorial</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export interface FrenlyTipsProps {
  tips: Array<{
    id: string
    title: string
    content: string
    category: 'general' | 'reconciliation' | 'upload' | 'visualization'
    icon: React.ReactNode
  }>
  currentPage: string
  className?: string
}

export const FrenlyTips: React.FC<FrenlyTipsProps> = ({
  tips,
  currentPage,
  className = ''
}) => {
  const [currentTip, setCurrentTip] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const relevantTips = tips.filter(tip => 
    tip.category === 'general' || 
    tip.category === currentPage.toLowerCase()
  )

  useEffect(() => {
    if (relevantTips.length > 0) {
      const interval = setInterval(() => {
        setCurrentTip(prev => (prev + 1) % relevantTips.length)
      }, 10000) // Change tip every 10 seconds

      return () => clearInterval(interval)
    }
  }, [relevantTips.length])

  if (!isVisible || relevantTips.length === 0) return null

  const tip = relevantTips[currentTip]

  return (
    <div className={`fixed top-4 right-4 z-40 max-w-sm ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              {tip.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">{tip.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{tip.content}</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Dismiss tip"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  )
}
