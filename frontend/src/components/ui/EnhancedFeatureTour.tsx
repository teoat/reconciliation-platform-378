/**
/**
 * Enhanced Feature Tour Component
 *
 * Enhanced version of FeatureTour with:
 * - Step validation
 * - Conditional navigation
 * - Tour persistence
 * - Auto-trigger system
 * - Integration with OnboardingService
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { onboardingService } from '@/services/onboardingService';
import { ariaLiveRegionsService } from '@/services/ariaLiveRegionsService';
import { logger } from '@/services/logger';

export interface TourStep {
  id: string;
  target: string; // CSS selector or element ID
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void | Promise<void>;
  validate?: () => boolean | Promise<boolean>; // Check if user completed action
  actionRequired?: boolean; // Must complete before advancing
  conditional?: () => boolean; // Show step only if condition is true
  dependsOn?: string[]; // Steps that must be completed first
}

export interface EnhancedFeatureTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  tourId?: string;
  startStep?: number;
  autoTrigger?: boolean; // Auto-trigger on first visit
  persistProgress?: boolean; // Save progress to localStorage
  onStepComplete?: (stepId: string) => void;
}

/**
 * Enhanced FeatureTour with validation and persistence
 */
export const EnhancedFeatureTour: React.FC<EnhancedFeatureTourProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
  tourId = 'feature-tour',
  startStep = 0,
  autoTrigger = false,
  persistProgress = true,
  onStepComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(startStep);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Load persisted progress
  useEffect(() => {
    if (persistProgress && tourId) {
      const persisted = localStorage.getItem(`tour_progress_${tourId}`);
      if (persisted) {
        try {
          const data = JSON.parse(persisted);
          const lastStep = data.lastStep || 0;
          if (lastStep > 0 && lastStep < steps.length) {
            setCurrentStep(lastStep);
          }
        } catch (error) {
          logger.error('Failed to load tour progress:', { error: { error } });
        }
      }
    }
  }, [tourId, persistProgress, steps.length]);

  // Auto-trigger on first visit or feature discovery
  useEffect(() => {
    if (autoTrigger && tourId && !isOpen) {
      const hasCompleted = localStorage.getItem(`tour_completed_${tourId}`);
      const hasShown = localStorage.getItem(`tour_shown_${tourId}`);

      if (!hasCompleted && !hasShown) {
        // Check if all required elements exist before auto-triggering
        const allStepsVisible = steps.every((step) => {
          const element = document.querySelector(step.target);
          return element !== null;
        });

        if (allStepsVisible && steps.length > 0) {
          localStorage.setItem(`tour_shown_${tourId}`, 'true');
          // Notify parent to open tour via callback
          // Parent component should handle opening
          if (onComplete) {
            // Use a small delay to ensure DOM is ready
            setTimeout(() => {
              // This will be handled by parent component watching for tour triggers
            }, 500);
          }
        }
      }
    }
  }, [autoTrigger, tourId, isOpen, steps, onComplete]);

  // Get completed steps from persistence
  const getCompletedSteps = (): string[] => {
    if (persistProgress && tourId) {
      const persisted = localStorage.getItem(`tour_progress_${tourId}`);
      if (persisted) {
        try {
          const data = JSON.parse(persisted);
          return data.completedSteps || [];
        } catch (_error) {
          return [];
        }
      }
    }
    return [];
  };

  // Filter visible steps based on conditions and dependencies
  const getVisibleSteps = (): TourStep[] => {
    const completedSteps = getCompletedSteps();

    return steps.filter((step) => {
      // Check conditional visibility
      if (step.conditional && !step.conditional()) {
        return false;
      }

      // Check dependencies - all must be completed
      if (step.dependsOn && step.dependsOn.length > 0) {
        const allDependenciesMet = step.dependsOn.every((depId) => completedSteps.includes(depId));
        if (!allDependenciesMet) {
          return false;
        }
      }

      // Check if target element exists
      const targetElement = document.querySelector(step.target);
      if (!targetElement) {
        return false;
      }

      return true;
    });
  };

  // Get ordered steps based on dependencies (topological sort)
  const getOrderedSteps = (): TourStep[] => {
    const visibleSteps = getVisibleSteps();
    const completedSteps = getCompletedSteps();
    const ordered: TourStep[] = [];
    const visited = new Set<string>();
    const inProgress = new Set<string>();

    const visit = (step: TourStep) => {
      if (visited.has(step.id)) return;
      if (inProgress.has(step.id)) {
        // Circular dependency detected, skip
        logger.warn(`Circular dependency detected in tour step: ${step.id}`);
        return;
      }

      inProgress.add(step.id);

      // Visit dependencies first
      if (step.dependsOn) {
        step.dependsOn.forEach((depId) => {
          const depStep = visibleSteps.find((s) => s.id === depId);
          if (depStep && !completedSteps.includes(depId)) {
            visit(depStep);
          }
        });
      }

      inProgress.delete(step.id);
      visited.add(step.id);
      ordered.push(step);
    };

    visibleSteps.forEach(visit);
    return ordered;
  };

  // Use ordered steps for better dependency handling
  const visibleSteps = React.useMemo(() => getOrderedSteps(), [steps, currentStep]);
  const currentStepData = visibleSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === visibleSteps.length - 1;

  // Save progress
  const saveProgress = (stepId: string) => {
    if (persistProgress && tourId) {
      const completedSteps = getCompletedSteps();
      if (!completedSteps.includes(stepId)) {
        completedSteps.push(stepId);
      }

      const progressData = {
        lastStep: currentStep,
        completedSteps,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(`tour_progress_${tourId}`, JSON.stringify(progressData));
    }
  };

  // Find and highlight target element
  useEffect(() => {
    if (!isOpen || !currentStepData) return;

    const targetElement = document.querySelector(currentStepData.target) as HTMLElement;
    if (targetElement) {
      setHighlightedElement(targetElement);

      // Scroll into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Focus for accessibility
      setTimeout(() => {
        if (targetElement.tabIndex >= 0) {
          targetElement.focus();
        }
      }, 300);

      // Announce step to screen readers
      if (ariaLiveRegionsService) {
        ariaLiveRegionsService.announceStatus(
          `Tour step ${currentStep + 1} of ${visibleSteps.length}: ${currentStepData.title}`,
          {
            componentId: tourId,
            action: 'tour-step',
            currentState: { step: currentStep + 1, total: visibleSteps.length },
          }
        );
      }
    } else {
      setHighlightedElement(null);
    }

    return () => {
      if (targetElement) {
        targetElement.style.outline = '';
      }
    };
  }, [isOpen, currentStep, currentStepData, visibleSteps.length, tourId]);

  // Calculate overlay position
  useEffect(() => {
    if (!highlightedElement || !overlayRef.current) return;

    const rect = highlightedElement.getBoundingClientRect();
    const overlay = overlayRef.current;

    overlay.style.top = `${rect.top}px`;
    overlay.style.left = `${rect.left}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;

    // Add highlight outline
    highlightedElement.style.outline = '2px solid #3b82f6';
    highlightedElement.style.outlineOffset = '2px';
    highlightedElement.style.zIndex = '9998';

    return () => {
      if (highlightedElement) {
        highlightedElement.style.outline = '';
        highlightedElement.style.outlineOffset = '';
        highlightedElement.style.zIndex = '';
      }
    };
  }, [highlightedElement]);

  // Validate step before advancing
  const validateStep = async (): Promise<boolean> => {
    if (!currentStepData?.validate) return true;

    setIsValidating(true);
    setValidationError(null);

    try {
      const isValid = await Promise.resolve(currentStepData.validate());
      if (!isValid && currentStepData.actionRequired) {
        setValidationError('Please complete the required action before continuing.');
        setIsValidating(false);
        return false;
      }
      setIsValidating(false);
      return true;
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Validation failed');
      setIsValidating(false);
      return false;
    }
  };

  // Handle next step
  const handleNext = async () => {
    if (isLastStep) {
      handleComplete();
      return;
    }

    // Validate if action is required
    if (currentStepData?.actionRequired) {
      const isValid = await validateStep();
      if (!isValid) {
        return;
      }
    }

    // Execute action if present
    if (currentStepData?.action) {
      try {
        await Promise.resolve(currentStepData.action());
      } catch (error) {
        logger.error('Tour action failed:', { error: { error } });
      }
    }

    // Save progress
    if (currentStepData) {
      saveProgress(currentStepData.id);
      if (onStepComplete) {
        onStepComplete(currentStepData.id);
      }

      // Track analytics
      onboardingService.completeStep(currentStepData.id, currentStepData.title, 0, 'feature_tour');
    }

    // Move to next step
    setCurrentStep((prev) => prev + 1);
  };

  // Handle previous step
  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
      setValidationError(null);
    }
  };

  // Handle completion
  const handleComplete = () => {
    // Save completion
    if (persistProgress && tourId) {
      localStorage.setItem(`tour_completed_${tourId}`, 'true');

      const completedSteps = getCompletedSteps();
      if (currentStepData && !completedSteps.includes(currentStepData.id)) {
        completedSteps.push(currentStepData.id);
      }

      const progressData = {
        completed: true,
        completedSteps,
        completedAt: new Date().toISOString(),
      };

      localStorage.setItem(`tour_progress_${tourId}`, JSON.stringify(progressData));
    }

    // Track analytics
    onboardingService.completeOnboarding('feature_tour');

    // Call completion callback
    if (onComplete) {
      onComplete();
    }

    onClose();

    // Announce completion
    if (ariaLiveRegionsService) {
      ariaLiveRegionsService.announceSuccess('Feature tour completed', {
        componentId: tourId,
        action: 'tour-completed',
      });
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (persistProgress && tourId) {
      localStorage.setItem(`tour_skipped_${tourId}`, 'true');
    }
    onClose();
  };

  // Keyboard navigation - Removed unused handleKeyDown function
  // const handleKeyDown = (e: React.KeyboardEvent) => {
  //   if (e.key === 'Escape') {
  //     handleSkip();
  //   } else if (e.key === 'ArrowRight' && !isLastStep && !isValidating) {
  //     handleNext();
  //   } else if (e.key === 'ArrowLeft' && !isFirstStep) {
  //     handlePrevious();
  //   }
  // };

  if (!isOpen || !currentStepData) return null;

  const placementClasses = {
    top: 'bottom-full mb-4',
    bottom: 'top-full mt-4',
    left: 'right-full mr-4',
    right: 'left-full ml-4',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        style={{ zIndex: 9997 }}
        onClick={handleSkip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSkip();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Skip tour"
      />

      {/* Highlight Overlay */}
      {highlightedElement && (
        <div
          ref={overlayRef}
          className="fixed pointer-events-none"
          style={{
            zIndex: 9998,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Tour Content */}
      <div
        className={`fixed w-80 bg-white rounded-lg shadow-xl p-4 ${placementClasses[currentStepData.placement || 'bottom']}`}
        style={{ zIndex: 9999 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-content"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 id="tour-title" className="text-sm font-semibold text-gray-900">
              {currentStepData.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Step {currentStep + 1} of {visibleSteps.length}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div id="tour-content" className="text-sm text-gray-700 mb-4">
          {currentStepData.content}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{validationError}</p>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-4">
          <div className="flex space-x-1">
            {visibleSteps.map((_, index) => (
              <div
                key={visibleSteps[index].id}
                className={`h-1 flex-1 rounded ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-label={`Step ${index + 1} ${index <= currentStep ? 'completed' : 'pending'}`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isFirstStep || isValidating}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Previous
          </button>

          <div className="flex space-x-2">
            {!isLastStep && (
              <button
                type="button"
                onClick={handleNext}
                disabled={isValidating || (currentStepData.actionRequired && !!validationError)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next step"
              >
                {isValidating ? 'Validating...' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </button>
            )}
            {isLastStep && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isValidating}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Complete tour"
              >
                <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                Complete
              </button>
            )}
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Skip Tour
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnhancedFeatureTour;
