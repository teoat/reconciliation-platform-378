'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { X } from 'lucide-react';
import { Play } from 'lucide-react';
import { Pause } from 'lucide-react';
import { SkipForward } from 'lucide-react';
import { RotateCcw } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  duration: number;
  expression: {
    eyes: 'normal' | 'happy' | 'excited' | 'wink';
    mouth: 'smile' | 'big-smile' | 'neutral';
    accessories: string[];
  };
}

interface FrenlyOnboardingProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const FrenlyOnboarding: React.FC<FrenlyOnboardingProps> = ({ isVisible, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Frenly AI! 👋',
      description: 'Your friendly reconciliation assistant',
      content:
        "Hi there! I'm Frenly, your AI assistant for reconciliation tasks. I'm here to guide you through your journey and make everything easier and more fun! 🎉",
      duration: 4000,
      expression: {
        eyes: 'happy',
        mouth: 'big-smile',
        accessories: ['party-hat'],
      },
    },
    {
      id: 'features',
      title: 'What I Can Do ✨',
      description: 'Discover my superpowers',
      content:
        "I can help you with project management, data ingestion, reconciliation, and much more! I'll provide tips, celebrate your successes, and warn you about potential issues. Think of me as your personal reconciliation buddy! 🤖",
      duration: 5000,
      expression: {
        eyes: 'excited',
        mouth: 'big-smile',
        accessories: ['star'],
      },
    },
    {
      id: 'guidance',
      title: "I'll Guide You 🗺️",
      description: 'Step-by-step assistance',
      content:
        "I'll be with you every step of the way! I'll show you contextual tips, help you understand what to do next, and celebrate when you complete tasks. Just look for my speech bubbles and progress indicators! 🎯",
      duration: 4500,
      expression: {
        eyes: 'wink',
        mouth: 'smile',
        accessories: ['target'],
      },
    },
    {
      id: 'interaction',
      title: "Let's Interact! 💬",
      description: 'How to use me effectively',
      content:
        "You can click my avatar to get help anytime, minimize me if you need more space, or adjust my settings. I'll remember your preferences and adapt to your working style. Ready to start our adventure together? 🚀",
      duration: 5000,
      expression: {
        eyes: 'happy',
        mouth: 'smile',
        accessories: ['heart'],
      },
      action: {
        text: "Let's Start!",
        onClick: onComplete,
      },
    },
  ];

  const currentStepData = onboardingSteps[currentStep];

  useEffect(() => {
    if (!isVisible || !isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / (currentStepData.duration / 100);
        if (newProgress >= 100) {
          if (currentStep < onboardingSteps.length - 1) {
            setCurrentStep((prev) => prev + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 100;
          }
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, isPlaying, currentStep, currentStepData.duration, onboardingSteps.length]);

  const handlePlay = () => {
    setIsPlaying(true);
    setProgress(0);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSkip = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setProgress(0);
    } else {
      onComplete();
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Frenly AI Onboarding</h2>
                <p className="text-purple-100">Let&apos;s get you started!</p>
              </div>
            </div>
            <button 
              onClick={onSkip} 
              className="text-white hover:text-purple-200 transition-colors"
              aria-label="Skip onboarding"
              title="Skip onboarding"
              type="button"
            >
              <span className="sr-only">Skip onboarding</span>
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Frenly Character */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden">
                {/* Eyes */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  <div
                    className={`w-3 h-3 bg-white rounded-full ${
                      currentStepData.expression.eyes === 'wink' ? 'opacity-0' : ''
                    }`}
                  />
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>

                {/* Mouth */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  {currentStepData.expression.mouth === 'smile' && (
                    <div className="w-6 h-3 border-b-2 border-white rounded-full" />
                  )}
                  {currentStepData.expression.mouth === 'big-smile' && (
                    <div className="w-8 h-4 border-b-2 border-white rounded-full" />
                  )}
                  {currentStepData.expression.mouth === 'neutral' && (
                    <div className="w-4 h-0.5 bg-white rounded-full" />
                  )}
                </div>

                {/* Accessories */}
                {currentStepData.expression.accessories.includes('party-hat') && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-b-8 border-transparent border-b-yellow-400" />
                )}
                {currentStepData.expression.accessories.includes('star') && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 text-yellow-400">⭐</div>
                )}
                {currentStepData.expression.accessories.includes('target') && (
                  <div className="absolute -top-2 -left-2 w-4 h-4 text-blue-400">🎯</div>
                )}
                {currentStepData.expression.accessories.includes('heart') && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 text-red-400">❤️</div>
                )}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h3>
            <p className="text-gray-600 mb-4">{currentStepData.description}</p>
            <p className="text-gray-700 leading-relaxed">{currentStepData.content}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Step {currentStep + 1} of {onboardingSteps.length}
              </span>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRestart}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Restart"
                aria-label="Restart onboarding"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause onboarding' : 'Play onboarding'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {currentStepData.action ? (
                <button
                  onClick={currentStepData.action.onClick}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:shadow-md transition-all duration-200 flex items-center space-x-2"
                  aria-label={currentStepData.action.text}
                >
                  <span>{currentStepData.action.text}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                  aria-label="Next step"
                >
                  <span>Next</span>
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-2 mt-6">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-purple-500'
                    : index < currentStep
                      ? 'bg-purple-300'
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrenlyOnboarding;
