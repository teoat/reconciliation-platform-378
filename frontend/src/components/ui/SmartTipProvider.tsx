/**
 * Smart Tip Provider Component
 *
 * Provides smart tips contextually based on current page and user progress.
 * Integrates with onboarding service and FrenlyProvider.
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SmartTip, useSmartTips, type SmartTip as SmartTipType } from './SmartTip';
import { onboardingService } from '@/services/onboardingService';
import { logger } from '@/services/logger';

export interface SmartTipProviderProps {
  children: React.ReactNode;
  maxTips?: number;
  enabled?: boolean;
}

/**
 * Smart Tip Provider
 * 
 * Automatically displays contextual tips based on current route and user progress
 */
export const SmartTipProvider: React.FC<SmartTipProviderProps> = ({
  children,
  maxTips = 3,
  enabled = true,
}) => {
  const location = useLocation();
  const [userProgress, setUserProgress] = useState<string[]>([]);

  // Get current page from pathname
  const currentPage = location.pathname.split('/')[1] || 'dashboard';
  const featureId = location.pathname.split('/').pop() || undefined;

  // Load user progress from onboarding service
  useEffect(() => {
    try {
      const progress = onboardingService.getProgress('initial');
      setUserProgress(progress.completedSteps || []);
    } catch (error) {
      logger.debug('Failed to load onboarding progress for tips', { error });
    }
  }, [location.pathname]);

  // Get smart tips for current context
  const { tips, dismissTip, hasTips } = useSmartTips({
    page: currentPage,
    featureId,
    userProgress,
    maxTips,
  });

  if (!enabled || !hasTips) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {/* Render tips in a fixed position container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {tips.map((tip) => (
          <SmartTip
            key={tip.id}
            tip={tip}
            onDismiss={dismissTip}
            position="top"
            variant="compact"
          />
        ))}
      </div>
    </>
  );
};

export default SmartTipProvider;

