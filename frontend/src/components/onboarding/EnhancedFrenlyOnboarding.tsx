/**
import { logger } from '../../services/logger'; * Enhanced Frenly Onboarding Component
 *
 * Enhanced version of FrenlyOnboarding with:
 * - User role detection
 * - Role-specific flows
 * - Completion persistence
 * - Interactive elements
 * - Enhanced skip functionality
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tipEngine } from '../../services/tipEngine';
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  X,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
} from 'lucide-react';

export type UserRole = 'admin' | 'analyst' | 'viewer';
export type UserExperience = 'new' | 'experienced';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: string;
  action?: {
    text: string;
    onClick: () => void | Promise<void>;
    validate?: () => boolean | Promise<boolean>;
  };
  duration: number;
  interactive?: boolean;
  target?: string; // CSS selector for element to highlight
  expression: {
    eyes: 'normal' | 'happy' | 'excited' | 'wink';
    mouth: 'smile' | 'big-smile' | 'neutral';
    accessories: string[];
  };
}

interface UserProfile {
  role: UserRole;
  experience: UserExperience;
  permissions: string[];
  onboardingCompleted: boolean;
  completedSteps: string[];
}

interface EnhancedFrenlyOnboardingProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  userProfile?: Partial<UserProfile>;
  onProgressUpdate?: (stepId: string) => void;
}

export const EnhancedFrenlyOnboarding: React.FC<EnhancedFrenlyOnboardingProps> = ({
  isVisible,
  onComplete,
  onSkip,
  userProfile,
  onProgressUpdate,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userData, setUserData] = useState<UserProfile>({
    role: userProfile?.role || 'analyst',
    experience: userProfile?.experience || 'new',
    permissions: userProfile?.permissions || [],
    onboardingCompleted: userProfile?.onboardingCompleted || false,
    completedSteps: userProfile?.completedSteps || [],
  });

  // Load persisted progress
  useEffect(() => {
    const persisted = localStorage.getItem('frenly_onboarding_progress');
    if (persisted) {
      try {
        const data = JSON.parse(persisted);
        setUserData((prev) => ({ ...prev, ...data }));
        // Resume from last incomplete step
        const lastStep = data.completedSteps?.length || 0;
        if (lastStep > 0 && lastStep < getOnboardingSteps().length) {
          setCurrentStep(lastStep);
        }
      } catch (error) {
        logger.error('Failed to load onboarding progress:', error);
      }
    }
  }, []);

  // Detect user role from context (if not provided)
  useEffect(() => {
    if (!userProfile?.role) {
      // Use onboarding integration hook for role detection
      const detectRoleFromAPI = async () => {
        try {
          const { apiClient } = await import('../../services/apiClient');
          const response = await apiClient.getCurrentUser();

          if (response.data) {
            const user = response.data as any;
            const roleMap: Record<string, UserRole> = {
              admin: 'admin',
              administrator: 'admin',
              analyst: 'analyst',
              viewer: 'viewer',
              user: 'analyst',
            };
            const detectedRole = roleMap[user.role?.toLowerCase() || 'analyst'] || 'analyst';
            setUserData((prev) => ({ ...prev, role: detectedRole }));
          } else {
            // Fallback to default
            const detectedRole = await detectUserRole();
            setUserData((prev) => ({ ...prev, role: detectedRole }));
          }
        } catch {
          // Fallback to default
          const detectedRole = await detectUserRole();
          setUserData((prev) => ({ ...prev, role: detectedRole }));
        }
      };
      detectRoleFromAPI();
    }
  }, [userProfile?.role]);

  // Get role-specific onboarding steps
  const getOnboardingSteps = (): OnboardingStep[] => {
    const commonSteps: OnboardingStep[] = [
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
    ];

    const roleSpecificSteps: Record<UserRole, OnboardingStep[]> = {
      admin: [
        {
          id: 'admin-project-management',
          title: 'Project Management ✨',
          description: 'Manage all your reconciliation projects',
          content:
            'As an admin, you can create, edit, and manage all projects. Set up team permissions, configure project settings, and monitor progress across your organization.',
          duration: 5000,
          interactive: true,
          target: '[data-tour="project-management"]',
          expression: {
            eyes: 'excited',
            mouth: 'big-smile',
            accessories: ['star'],
          },
          action: {
            text: 'Create Your First Project',
            onClick: async () => {
              // Navigate to project creation page
              navigate('/projects/new');
              // Note: Project creation happens on the ProjectCreate page
              // We'll check for the project in the validation function
            },
            validate: async () => {
              // Check if we're on a project detail page (after creation)
              const pathname = window.location.pathname;
              const projectDetailMatch = pathname.match(/^\/projects\/([^/]+)$/);
              if (projectDetailMatch) {
                const projectId = projectDetailMatch[1];
                setCreatedProjectId(projectId);
                return true;
              }

              // Check API for projects (more reliable than localStorage)
              try {
                const { apiClient } = await import('../../services/apiClient');
                const response = await apiClient.getProjects(1, 1);
                const data = response.data as any;
                if (data && data.projects && data.projects.length > 0) {
                  const latestProject = data.projects[0];
                  setCreatedProjectId(latestProject.id);
                  return true;
                }
              } catch {
                // Ignore API errors
              }

              // Fallback: Check localStorage for recently created project
              const recentProjects = localStorage.getItem('recent_projects');
              if (recentProjects) {
                try {
                  const projects = JSON.parse(recentProjects);
                  if (projects.length > 0) {
                    setCreatedProjectId(projects[0].id);
                    return true;
                  }
                } catch {
                  // Ignore parse errors
                }
              }
              return false;
            },
          },
        },
        {
          id: 'admin-team-management',
          title: 'Team Management 👥',
          description: 'Manage your team members',
          content:
            'Invite team members, assign roles, and manage permissions. Collaboration makes reconciliation faster and more accurate!',
          duration: 4500,
          target: '[data-tour="team-management"]',
          expression: {
            eyes: 'happy',
            mouth: 'smile',
            accessories: ['users'],
          },
        },
        {
          id: 'admin-settings',
          title: 'System Settings ⚙️',
          description: 'Configure system-wide settings',
          content:
            'Configure integrations, API keys, webhooks, and system preferences. These settings affect all projects.',
          duration: 4000,
          target: '[data-tour="settings"]',
          expression: {
            eyes: 'normal',
            mouth: 'smile',
            accessories: ['gear'],
          },
        },
      ],
      analyst: [
        {
          id: 'analyst-data-upload',
          title: 'Upload Your Data 📤',
          description: 'Start by uploading your files',
          content:
            'Upload CSV, Excel, or JSON files. The system will automatically detect the format and guide you through the mapping process.',
          duration: 5000,
          interactive: true,
          target: '[data-tour="file-upload"]',
          expression: {
            eyes: 'excited',
            mouth: 'big-smile',
            accessories: ['upload'],
          },
          action: {
            text: 'Try Uploading a File',
            onClick: async () => {
              // Navigate to file upload page
              // If we have a project ID from previous step, include it
              if (createdProjectId) {
                navigate(`/upload?projectId=${createdProjectId}`, {
                  state: { projectId: createdProjectId },
                });
              } else {
                navigate('/upload');
              }
            },
            validate: () => {
              // Check if we're on upload page or if a file was uploaded
              const pathname = window.location.pathname;
              if (pathname === '/upload' || pathname.startsWith('/upload')) {
                return true; // User is on upload page
              }
              // Check if we're redirected after successful upload (project detail page)
              const uploadSuccess = pathname.match(/^\/projects\/([^/]+)$/);
              if (uploadSuccess) {
                return true; // Successfully uploaded and redirected
              }
              return false;
            },
          },
        },
        {
          id: 'analyst-reconciliation',
          title: 'Run Reconciliation 🔄',
          description: 'Match and compare your data',
          content:
            "Configure matching rules, run reconciliation jobs, and review the results. I'll help you optimize your matching strategy!",
          duration: 4500,
          target: '[data-tour="reconciliation"]',
          expression: {
            eyes: 'happy',
            mouth: 'smile',
            accessories: ['target'],
          },
        },
        {
          id: 'analyst-review',
          title: 'Review Matches ✅',
          description: 'Review and confirm matches',
          content:
            'Review automatically matched records, resolve discrepancies, and export your results. Quality control is key!',
          duration: 4000,
          target: '[data-tour="match-review"]',
          expression: {
            eyes: 'wink',
            mouth: 'smile',
            accessories: ['check'],
          },
        },
      ],
      viewer: [
        {
          id: 'viewer-browse',
          title: 'Browse Projects 📊',
          description: 'View reconciliation projects',
          content:
            'As a viewer, you can browse all projects, view reports, and export data. You have read-only access to the platform.',
          duration: 4000,
          target: '[data-tour="projects"]',
          expression: {
            eyes: 'happy',
            mouth: 'smile',
            accessories: ['chart'],
          },
        },
        {
          id: 'viewer-reports',
          title: 'View Reports 📈',
          description: 'Access reconciliation reports',
          content:
            'View detailed reconciliation reports, charts, and summaries. Export data in various formats for analysis.',
          duration: 3500,
          target: '[data-tour="reports"]',
          expression: {
            eyes: 'normal',
            mouth: 'smile',
            accessories: ['report'],
          },
        },
      ],
    };

    const finalStep: OnboardingStep = {
      id: 'complete',
      title: "You're All Set! 🚀",
      description: 'Ready to start',
      content:
        "You're ready to start using Frenly AI! Remember, you can always click my avatar for help, or start a guided tour anytime. Let's make reconciliation fun and efficient!",
      duration: 4000,
      expression: {
        eyes: 'happy',
        mouth: 'big-smile',
        accessories: ['rocket'],
      },
      action: {
        text: "Let's Start!",
        onClick: handleComplete,
      },
    };

    return [...commonSteps, ...roleSpecificSteps[userData.role], finalStep];
  };

  const onboardingSteps = getOnboardingSteps();
  const currentStepData = onboardingSteps[currentStep];

  // Detect user role
  const detectUserRole = async (): Promise<UserRole> => {
    try {
      // Use onboarding integration hook for role detection
      const { useOnboardingIntegration } = await import('../../hooks/useOnboardingIntegration');
      // Note: This will be handled by the hook when integrated
      // For now, check localStorage as fallback
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const roleMap: Record<string, UserRole> = {
            admin: 'admin',
            administrator: 'admin',
            analyst: 'analyst',
            viewer: 'viewer',
          };
          return roleMap[user.role?.toLowerCase() || 'analyst'] || 'analyst';
        } catch {
          return 'analyst';
        }
      }
      return 'analyst';
    } catch {
      return 'analyst';
    }
  };

  // Save progress
  const saveProgress = (stepId: string) => {
    const updatedSteps = [...userData.completedSteps];
    if (!updatedSteps.includes(stepId)) {
      updatedSteps.push(stepId);
    }

    const progressData = {
      ...userData,
      completedSteps: updatedSteps,
    };

    setUserData(progressData);
    localStorage.setItem('frenly_onboarding_progress', JSON.stringify(progressData));

    if (onProgressUpdate) {
      onProgressUpdate(stepId);
    }
  };

  // Handle step completion
  const handleStepComplete = async () => {
    if (currentStepData) {
      // Validate interactive action if present
      if (currentStepData.interactive && currentStepData.action?.validate) {
        const isValid = await Promise.resolve(currentStepData.action.validate());
        if (!isValid) {
          // Don't advance if validation fails
          return;
        }
      }

      saveProgress(currentStepData.id);

      // Move to next step
      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep((prev) => prev + 1);
        setProgress(0);
      } else {
        handleComplete();
      }
    }
  };

  // Handle completion
  const handleComplete = () => {
    const completedData = {
      ...userData,
      onboardingCompleted: true,
    };
    setUserData(completedData);
    localStorage.setItem('frenly_onboarding_progress', JSON.stringify(completedData));
    localStorage.setItem('frenly_onboarding_completed', 'true');
    onComplete();
  };

  // Handle skip
  const handleSkip = (skipType: 'step' | 'all' | 'remind-later') => {
    if (skipType === 'all') {
      localStorage.setItem('frenly_onboarding_skipped', 'true');
      onSkip();
    } else if (skipType === 'remind-later') {
      localStorage.setItem('frenly_onboarding_remind_later', new Date().toISOString());
      onSkip();
    } else if (skipType === 'step') {
      handleStepComplete();
    }
  };

  // Auto-advance timer
  useEffect(() => {
    if (!isVisible || !isPlaying || !currentStepData) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const increment = 100 / (currentStepData.duration / 100);
        const newProgress = prev + increment;

        if (newProgress >= 100) {
          handleStepComplete();
          return 0;
        }

        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, isPlaying, currentStep, currentStepData]);

  // Highlight target element
  useEffect(() => {
    if (currentStepData?.target) {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        (element as HTMLElement).style.outline = '2px solid #8b5cf6';
        (element as HTMLElement).style.outlineOffset = '4px';

        return () => {
          (element as HTMLElement).style.outline = '';
          (element as HTMLElement).style.outlineOffset = '';
        };
      }
    }
  }, [currentStep, currentStepData]);

  if (!isVisible || !currentStepData) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 id="onboarding-title" className="text-xl font-bold">
                  Frenly AI Onboarding -{' '}
                  {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                </h2>
                <p className="text-purple-100">Let's get you started!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSkip('remind-later')}
                className="text-white hover:text-purple-200 transition-colors text-sm px-3 py-1 rounded"
                aria-label="Remind me later"
              >
                Remind Later
              </button>
              <button
                onClick={() => handleSkip('all')}
                className="text-white hover:text-purple-200 transition-colors"
                aria-label="Skip onboarding"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Frenly Character */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden">
                {/* Character animation based on expression */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {currentStepData.expression.eyes !== 'wink' && (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  )}
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>

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
            <div
              className="w-full bg-gray-200 rounded-full h-2"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Onboarding progress: ${Math.round(progress)}%`}
              title={`Progress: ${Math.round(progress)}%`}
            >
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setProgress(0);
                  setIsPlaying(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Restart"
                aria-label="Restart onboarding"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
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
                  onClick={async () => {
                    await currentStepData.action?.onClick();
                    if (!currentStepData.action?.validate || currentStepData.action.validate()) {
                      handleStepComplete();
                    }
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:shadow-md transition-all duration-200 flex items-center space-x-2"
                >
                  <span>{currentStepData.action.text}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleStepComplete}
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Step Indicators */}
          <div
            className="flex justify-center space-x-2 mt-6"
            role="group"
            aria-label="Onboarding step indicators"
          >
            {onboardingSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => {
                  setCurrentStep(index);
                  setProgress(0);
                  setIsPlaying(false);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-purple-500'
                    : index < currentStep
                      ? 'bg-purple-300'
                      : 'bg-gray-300'
                }`}
                aria-label={`Step ${index + 1}: ${step.title}`}
                aria-pressed={index === currentStep ? 'true' : 'false'}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFrenlyOnboarding;
