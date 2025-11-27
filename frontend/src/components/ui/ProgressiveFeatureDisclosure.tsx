/**
 * Progressive Feature Disclosure Component
 *
 * Gradually reveals features based on user progress and onboarding completion.
 * Features are unlocked as users complete onboarding steps and gain experience.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Sparkles, CheckCircle } from 'lucide-react';
import { FeatureGate, useFeatureGate } from './FeatureGate';
import { onboardingService } from '@/services/onboardingService';
import { SmartTip } from './SmartTip';
import { logger } from '@/services/logger';

export type FeatureUnlockLevel = 'locked' | 'preview' | 'unlocked' | 'mastered';

export interface ProgressiveFeature {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  unlockRequirements: {
    onboardingSteps?: string[];
    minProgress?: number; // Percentage 0-100
    requiredFeatures?: string[];
    userRole?: string[];
  };
  previewContent?: React.ReactNode;
  lockedMessage?: string;
  onUnlock?: () => void;
}

export interface ProgressiveFeatureDisclosureProps {
  feature: ProgressiveFeature;
  userProgress?: string[];
  userRole?: string;
  children: React.ReactNode;
  className?: string;
  showUnlockAnimation?: boolean;
  onFeatureUnlock?: (featureId: string) => void;
}

/**
 * Progressive Feature Disclosure Component
 */
export const ProgressiveFeatureDisclosure: React.FC<ProgressiveFeatureDisclosureProps> = ({
  feature,
  userProgress = [],
  userRole,
  children,
  className = '',
  showUnlockAnimation = true,
  onFeatureUnlock,
}) => {
  const [unlockLevel, setUnlockLevel] = useState<FeatureUnlockLevel>('locked');
  const [showUnlockAnimationState, setShowUnlockAnimationState] = useState(false);

  // Calculate unlock level based on requirements
  useEffect(() => {
    const calculateUnlockLevel = (): FeatureUnlockLevel => {
      const requirements = feature.unlockRequirements;

      // Check role requirement
      if (requirements.userRole && requirements.userRole.length > 0) {
        if (!userRole || !requirements.userRole.includes(userRole)) {
          return 'locked';
        }
      }

      // Check onboarding steps
      if (requirements.onboardingSteps && requirements.onboardingSteps.length > 0) {
        const hasAllSteps = requirements.onboardingSteps.every((step) =>
          userProgress.includes(step)
        );
        if (!hasAllSteps) {
          // Check if partially complete for preview
          const hasSomeSteps = requirements.onboardingSteps.some((step) =>
            userProgress.includes(step)
          );
          return hasSomeSteps ? 'preview' : 'locked';
        }
      }

      // Check progress percentage
      if (requirements.minProgress !== undefined) {
        const progress = onboardingService.getProgress('initial');
        const progressPercentage =
          (progress.completedSteps.length / progress.totalSteps) * 100;
        if (progressPercentage < requirements.minProgress) {
          return progressPercentage >= requirements.minProgress * 0.5 ? 'preview' : 'locked';
        }
      }

      // Check required features
      if (requirements.requiredFeatures && requirements.requiredFeatures.length > 0) {
        const unlockedFeatures = JSON.parse(
          localStorage.getItem('unlocked_features') || '[]'
        ) as string[];
        const hasAllFeatures = requirements.requiredFeatures.every((reqFeature) =>
          unlockedFeatures.includes(reqFeature)
        );
        if (!hasAllFeatures) {
          return 'preview';
        }
      }

      // All requirements met - feature is unlocked
      return 'unlocked';
    };

    const newLevel = calculateUnlockLevel();
    const previousLevel = unlockLevel;

    setUnlockLevel(newLevel);

    // Trigger unlock animation if transitioning from locked/preview to unlocked
    if (
      showUnlockAnimation &&
      (previousLevel === 'locked' || previousLevel === 'preview') &&
      newLevel === 'unlocked'
    ) {
      setShowUnlockAnimationState(true);
      setTimeout(() => setShowUnlockAnimationState(false), 2000);

      // Mark feature as unlocked
      const unlockedFeatures = JSON.parse(
        localStorage.getItem('unlocked_features') || '[]'
      ) as string[];
      if (!unlockedFeatures.includes(feature.id)) {
        unlockedFeatures.push(feature.id);
        localStorage.setItem('unlocked_features', JSON.stringify(unlockedFeatures));
      }

      // Call unlock callback
      feature.onUnlock?.();
      onFeatureUnlock?.(feature.id);

      logger.info('Feature unlocked', { featureId: feature.id });
    }
  }, [feature, userProgress, userRole, unlockLevel, showUnlockAnimation, onFeatureUnlock]);

  const renderLockedState = () => (
    <div
      className={`progressive-feature-locked p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 ${className}`}
      data-feature-id={feature.id}
      data-unlock-level="locked"
    >
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">{feature.name}</h3>
          <p className="text-sm text-gray-500 mb-3">
            {feature.lockedMessage ||
              'Complete onboarding steps to unlock this feature'}
          </p>
        </div>
        {feature.unlockRequirements.onboardingSteps && (
          <div className="text-xs text-gray-400">
            <p className="mb-1">Required steps:</p>
            <ul className="list-disc list-inside space-y-1">
              {feature.unlockRequirements.onboardingSteps.map((step) => (
                <li
                  key={step}
                  className={userProgress.includes(step) ? 'text-green-600' : ''}
                >
                  {step}
                  {userProgress.includes(step) && (
                    <CheckCircle className="inline w-3 h-3 ml-1" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  const renderPreviewState = () => (
    <div
      className={`progressive-feature-preview p-4 border-2 border-yellow-300 rounded-lg bg-yellow-50 ${className}`}
      data-feature-id={feature.id}
      data-unlock-level="preview"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Sparkles className="w-5 h-5 text-yellow-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">{feature.name}</h3>
          <p className="text-xs text-yellow-700 mb-2">{feature.description}</p>
          {feature.previewContent}
        </div>
      </div>
    </div>
  );

  const renderUnlockedState = () => (
    <div
      className={`progressive-feature-unlocked ${showUnlockAnimationState ? 'animate-pulse' : ''} ${className}`}
      data-feature-id={feature.id}
      data-unlock-level="unlocked"
    >
      {showUnlockAnimationState && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-100 bg-opacity-50 rounded-lg z-10">
          <div className="flex flex-col items-center gap-2">
            <Unlock className="w-12 h-12 text-green-600 animate-bounce" />
            <p className="text-lg font-semibold text-green-800">Feature Unlocked!</p>
          </div>
        </div>
      )}
      {children}
    </div>
  );

  switch (unlockLevel) {
    case 'locked':
      return renderLockedState();
    case 'preview':
      return renderPreviewState();
    case 'unlocked':
      return renderUnlockedState();
    default:
      return renderLockedState();
  }
};

/**
 * Hook for progressive feature disclosure
 */
export const useProgressiveFeature = (
  featureId: string,
  unlockRequirements: ProgressiveFeature['unlockRequirements']
) => {
  const [unlockLevel, setUnlockLevel] = useState<FeatureUnlockLevel>('locked');
  const progress = onboardingService.getProgress('initial');

  useEffect(() => {
    const calculateLevel = (): FeatureUnlockLevel => {
      // Check role
      if (unlockRequirements.userRole && unlockRequirements.userRole.length > 0) {
        // Role check would need to be passed in
      }

      // Check onboarding steps
      if (unlockRequirements.onboardingSteps) {
        const hasAllSteps = unlockRequirements.onboardingSteps.every((step) =>
          progress.completedSteps.includes(step)
        );
        if (!hasAllSteps) {
          const hasSomeSteps = unlockRequirements.onboardingSteps.some((step) =>
            progress.completedSteps.includes(step)
          );
          return hasSomeSteps ? 'preview' : 'locked';
        }
      }

      // Check progress
      if (unlockRequirements.minProgress !== undefined) {
        const progressPercentage =
          (progress.completedSteps.length / progress.totalSteps) * 100;
        if (progressPercentage < unlockRequirements.minProgress) {
          return progressPercentage >= unlockRequirements.minProgress * 0.5
            ? 'preview'
            : 'locked';
        }
      }

      return 'unlocked';
    };

    setUnlockLevel(calculateLevel());
  }, [featureId, unlockRequirements, progress]);

  return {
    unlockLevel,
    isLocked: unlockLevel === 'locked',
    isPreview: unlockLevel === 'preview',
    isUnlocked: unlockLevel === 'unlocked',
  };
};

export default ProgressiveFeatureDisclosure;

