'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2, 
  Volume2, 
  VolumeX,
  Settings,
  Lightbulb,
  AlertTriangle,
  PartyPopper,
  HelpCircle,
  Play,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Heart,
  Zap,
  Star,
  Target,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  Wand2,
  Smile,
  Frown,
  Meh,
  Laugh
} from 'lucide-react'
import { FrenlyState, FrenlyMessage, FrenlyAnimation, FrenlyExpression } from '../types/frenly'

interface FrenlyAIProps {
  currentPage: string
  userProgress: {
    completedSteps: string[]
    currentStep: string
    totalSteps: number
  }
  onAction?: (action: string) => void
}

const FrenlyAI: React.FC<FrenlyAIProps> = ({
  currentPage,
  userProgress,
  onAction
}) => {
  const [state, setState] = useState<FrenlyState>({
    isVisible: true,
    isMinimized: false,
    currentPage,
    userProgress,
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

  const [currentExpression, setCurrentExpression] = useState<FrenlyExpression>({
    eyes: 'happy',
    mouth: 'smile',
    accessories: []
  })

  const [currentAnimation, setCurrentAnimation] = useState<FrenlyAnimation | null>(null)
  const messageTimeoutRef = useRef<NodeJS.Timeout>()

  // Generate contextual messages based on current page and progress
  const createDefaultMessage = useCallback((): FrenlyMessage => ({
    id: Math.random().toString(36).substr(2, 9),
    type: 'greeting',
    content: "Hi there! I'm Frenly, your AI assistant! 🤖✨ Ready to help you with your reconciliation journey!",
    timestamp: new Date(),
    page: currentPage,
    priority: 'medium',
    dismissible: true,
    autoHide: 5000
  }), [currentPage])

  const generateContextualMessage = useCallback((): FrenlyMessage => {
    const pageGuidance = {
    '/projects': {
      greeting: "Hey there! 👋 Ready to start your reconciliation journey? Let's create some amazing projects together!",
      tip: "💡 Pro tip: Use templates to speed up your project creation process!",
      warning: "⚠️ Don't forget to set proper permissions for team collaboration!",
      celebration: "🎉 Great job! Your project is ready to go!"
    },
    '/ingestion': {
      greeting: "Welcome to the data ingestion zone! 📊 Let's get your files uploaded and processed!",
      tip: "💡 Make sure your CSV files have headers for better data recognition!",
      warning: "⚠️ Large files might take a while to process - grab a coffee! ☕",
      celebration: "🎉 Excellent! Your data is ready for reconciliation!"
    },
    '/reconciliation': {
      greeting: "Time for the magic! ✨ Let's match those records and find the perfect pairs!",
      tip: "💡 Adjust matching rules to improve your match rate!",
      warning: "⚠️ Review unmatched records carefully - they might need special attention!",
      celebration: "🎉 Fantastic matching results! You're doing great!"
    },
    '/adjudication': {
      greeting: "Detective mode activated! 🔍 Let's solve these discrepancies together!",
      tip: "💡 Use comments to document your resolution decisions!",
      warning: "⚠️ High priority discrepancies need immediate attention!",
      celebration: "🎉 Case closed! All discrepancies resolved!"
    },
    '/visualization': {
      greeting: "Data visualization time! 📈 Let's turn those numbers into beautiful insights!",
      tip: "💡 Try different chart types to find the best view of your data!",
      warning: "⚠️ Make sure your data is complete before creating visualizations!",
      celebration: "🎉 Stunning visualizations! Your data tells a great story!"
    },
    '/presummary': {
      greeting: "Almost there! 🏁 Let's review everything before the final summary!",
      tip: "💡 Double-check all categories before proceeding to export!",
      warning: "⚠️ Make sure all discrepancies are resolved!",
      celebration: "🎉 Perfect! Ready for the final summary!"
    },
    '/summary': {
      greeting: "The grand finale! 🎊 Time to create your comprehensive report!",
      tip: "💡 Choose the right export format for your audience!",
      warning: "⚠️ Save your work before exporting large reports!",
      celebration: "🎉 Congratulations! Your reconciliation is complete!"
    },
    '/auth': {
      greeting: "Welcome! 🔐 Let's get you securely logged in!",
      tip: "💡 Use a strong password and enable two-factor authentication!",
      warning: "⚠️ Never share your login credentials with anyone!",
      celebration: "🎉 Welcome back! Ready to start reconciling!"
    },
    '/cashflow-evaluation': {
      greeting: "Cashflow analysis time! 💰 Let's dive into your financial patterns!",
      tip: "💡 Look for seasonal trends and anomalies in your data!",
      warning: "⚠️ Verify data accuracy before making financial decisions!",
      celebration: "🎉 Excellent cashflow insights! Great analysis work!"
    }
  }

    const guidance = pageGuidance[currentPage as keyof typeof pageGuidance]
    if (!guidance) return createDefaultMessage()

    const progressPercentage = (userProgress.completedSteps.length / userProgress.totalSteps) * 100
    
    // Determine message type based on context
    let messageType: FrenlyMessage['type'] = 'tip'
    let content = guidance.tip

    if (progressPercentage === 0) {
      messageType = 'greeting'
      content = guidance.greeting
    } else if (progressPercentage === 100) {
      messageType = 'celebration'
      content = guidance.celebration
    } else if (progressPercentage < 30) {
      messageType = 'instruction'
      content = guidance.tip
    } else if (progressPercentage > 70) {
      messageType = 'encouragement'
      content = "You're almost there! Keep up the great work! 🚀"
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type: messageType,
      content,
      timestamp: new Date(),
      page: currentPage,
      priority: 'medium',
      dismissible: true,
       autoHide: messageType === 'greeting' ? 5000 : undefined
     }
   }, [currentPage, userProgress, createDefaultMessage])

  // Update expression based on mood and message type
  const updateExpression = useCallback((messageType: FrenlyMessage['type']) => {
    switch (messageType) {
      case 'greeting':
        setCurrentExpression({ eyes: 'happy', mouth: 'big-smile', accessories: [] })
        break
      case 'celebration':
        setCurrentExpression({ eyes: 'excited', mouth: 'big-smile', accessories: ['party-hat'] })
        break
      case 'warning':
        setCurrentExpression({ eyes: 'concerned', mouth: 'neutral', accessories: [] })
        break
      case 'tip':
        setCurrentExpression({ eyes: 'wink', mouth: 'smile', accessories: ['lightbulb'] })
        break
      case 'encouragement':
        setCurrentExpression({ eyes: 'happy', mouth: 'smile', accessories: ['star'] })
        break
      default:
        setCurrentExpression({ eyes: 'normal', mouth: 'smile', accessories: [] })
    }
  }, [])

  const hideMessage = useCallback(() => {
    setState(prev => ({ ...prev, activeMessage: undefined }))
    setCurrentExpression({ eyes: 'normal', mouth: 'smile', accessories: [] })
  }, [])

  // Show new message
  const showMessage = useCallback((message: FrenlyMessage) => {
    setState(prev => ({ ...prev, activeMessage: message }))
    updateExpression(message.type)
    
    // Auto-hide message after delay
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }
    
    if (message.autoHide) {
      messageTimeoutRef.current = setTimeout(() => {
        hideMessage()
      }, message.autoHide)
    }
  }, [updateExpression, hideMessage])

  const toggleVisibility = () => {
    setState(prev => ({ ...prev, isVisible: !prev.isVisible }))
  }

  const toggleMinimize = () => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }))
  }

  // Initialize with contextual message
  useEffect(() => {
    const message = generateContextualMessage()
    showMessage(message)
   }, [currentPage, userProgress, generateContextualMessage, showMessage])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  if (!state.isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50"
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
            <div className={`w-2 h-2 bg-white rounded-full ${
              currentExpression.eyes === 'wink' ? 'opacity-0' : ''
            }`} />
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
                onClick={hideMessage}
                className="text-gray-400 hover:text-gray-600"
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
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={toggleVisibility}
                className="p-1 text-gray-400 hover:text-gray-600"
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
                {userProgress.completedSteps.length}/{userProgress.totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(userProgress.completedSteps.length / userProgress.totalSteps) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const message = generateContextualMessage()
                showMessage(message)
              }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs py-2 px-3 rounded-lg hover:shadow-md transition-all duration-200"
            >
              Get Help
            </button>
            <button
              onClick={() => setState(prev => ({ 
                ...prev, 
                preferences: { 
                  ...prev.preferences, 
                  showTips: !prev.preferences.showTips 
                } 
              }))}
              className={`p-2 rounded-lg transition-all duration-200 ${
                state.preferences.showTips 
                  ? 'bg-yellow-100 text-yellow-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FrenlyAI
