/**
 * Feature Tour Component
 * Provides guided tours and onboarding flows
 * Essential for Task 5.5: Comprehensive User Guidance
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
// Import ariaLiveRegionsService with type-safe access
import { ariaLiveRegionsService } from '../../utils/ariaLiveRegionsHelper';

export interface TourStep {
  id: string;
  target: string; // CSS selector or element ID
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
}

export interface FeatureTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  tourId?: string;
  startStep?: number;
}

/**
 * FeatureTour - Provides guided feature tours
 */
export const FeatureTour: React.FC<FeatureTourProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
  tourId,
  startStep = 0,
}) => {
  const [currentStep, setCurrentStep] = useState(startStep);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

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
      ariaLiveRegionsService.announceStatus(
        `Tour step ${currentStep + 1} of ${steps.length}: ${currentStepData.title}`,
        {
          componentId: tourId,
          action: 'tour-step',
          currentState: { step: currentStep + 1, total: steps.length },
        }
      );
    }

    return () => {
      if (targetElement) {
        targetElement.style.outline = '';
      }
    };
  }, [isOpen, currentStep, currentStepData, steps.length, tourId]);

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

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    onClose();
    ariaLiveRegionsService.announceSuccess('Feature tour completed', {
      componentId: tourId,
      action: 'tour-completed',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight' && !isLastStep) {
      handleNext();
    } else if (e.key === 'ArrowLeft' && !isFirstStep) {
      handlePrevious();
    }
  };

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
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
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
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 id="tour-title" className="text-sm font-semibold text-gray-900">
              {currentStepData.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        {/* Progress Indicator */}
        <div className="mb-4">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
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
            disabled={isFirstStep}
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
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Next step"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </button>
            )}
            {isLastStep && (
              <button
                type="button"
                onClick={handleComplete}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Complete tour"
              >
                <CheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                Complete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
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

export default FeatureTour;
