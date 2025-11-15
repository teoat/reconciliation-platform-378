/**
 * Onboarding Service
 * 
 * Centralized service for managing onboarding experiences,
 * progress tracking, and analytics.
 */

import { logger } from './logger';

export type UserRole = 'admin' | 'analyst' | 'viewer';
export type OnboardingType = 'initial' | 'feature_tour' | 'contextual_help' | 'empty_state';

interface OnboardingProgress {
  userId?: string;
  completedOnboarding: boolean;
  completedSteps: string[];
  currentStep?: string;
  startedAt?: Date;
  completedAt?: Date;
  skippedAt?: Date;
  remindLaterAt?: Date;
  role?: UserRole;
}

export interface OnboardingAnalytics {
  stepId: string;
  stepName: string;
  duration: number;
  timestamp: Date;
  action?: string;
  completed: boolean;
}

class OnboardingService {
  private static instance: OnboardingService;
  private progress: Map<string, OnboardingProgress> = new Map();
  private analytics: OnboardingAnalytics[] = [];
  private readonly maxAnalyticsHistory = 1000;

  private constructor() {
    this.loadProgress();
  }

  static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  /**
   * Load persisted progress from localStorage
   */
  private loadProgress(): void {
    try {
      const persisted = localStorage.getItem('onboarding_progress');
      if (persisted) {
        const data = JSON.parse(persisted);
        Object.entries(data).forEach(([key, value]) => {
          this.progress.set(key, value as OnboardingProgress);
        });
      }
    } catch (error) {
      logger.error('Failed to load onboarding progress:', error);
    }
  }

  /**
   * Save progress to localStorage
   */
  private saveProgress(): void {
    try {
      const data = Object.fromEntries(this.progress);
      localStorage.setItem('onboarding_progress', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save onboarding progress:', error);
    }
  }

  /**
   * Check if user has completed onboarding
   */
  hasCompletedOnboarding(type: OnboardingType = 'initial'): boolean {
    const key = `onboarding_${type}`;
    const progress = this.progress.get(key);
    return progress?.completedOnboarding || false;
  }

  /**
   * Get onboarding progress
   */
  getProgress(type: OnboardingType = 'initial'): OnboardingProgress | null {
    const key = `onboarding_${type}`;
    return this.progress.get(key) || null;
  }

  /**
   * Start onboarding
   */
  startOnboarding(type: OnboardingType = 'initial', role?: UserRole): void {
    const key = `onboarding_${type}`;
    const progress: OnboardingProgress = {
      completedOnboarding: false,
      completedSteps: [],
      startedAt: new Date(),
      role,
    };

    this.progress.set(key, progress);
    this.saveProgress();

    // Track analytics
    this.trackEvent({
      stepId: 'start',
      stepName: `Started ${type} onboarding`,
      duration: 0,
      timestamp: new Date(),
      completed: false,
    });

    logger.info(`Onboarding ${type} started`, { role });
  }

  /**
   * Complete onboarding step
   */
  completeStep(
    stepId: string,
    stepName: string,
    duration: number,
    type: OnboardingType = 'initial'
  ): void {
    const key = `onboarding_${type}`;
    const progress = this.progress.get(key) || {
      completedOnboarding: false,
      completedSteps: [],
    };

    if (!progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
      progress.currentStep = stepId;
    }

    this.progress.set(key, progress);
    this.saveProgress();

    // Track analytics
    this.trackEvent({
      stepId,
      stepName,
      duration,
      timestamp: new Date(),
      completed: true,
    });

    logger.info(`Onboarding step completed: ${stepId}`, { duration });
  }

  /**
   * Complete onboarding
   */
  completeOnboarding(type: OnboardingType = 'initial'): void {
    const key = `onboarding_${type}`;
    const progress = this.progress.get(key);
    
    if (progress) {
      progress.completedOnboarding = true;
      progress.completedAt = new Date();
      this.progress.set(key, progress);
      this.saveProgress();

      // Track analytics
      this.trackEvent({
        stepId: 'complete',
        stepName: `Completed ${type} onboarding`,
        duration: 0,
        timestamp: new Date(),
        completed: true,
      });

      logger.info(`Onboarding ${type} completed`);
    }
  }

  /**
   * Skip onboarding
   */
  skipOnboarding(type: OnboardingType = 'initial', remindLater: boolean = false): void {
    const key = `onboarding_${type}`;
    const progress = this.progress.get(key);
    
    if (progress) {
      if (remindLater) {
        progress.remindLaterAt = new Date();
      } else {
        progress.skippedAt = new Date();
      }
      this.progress.set(key, progress);
      this.saveProgress();

      logger.info(`Onboarding ${type} skipped`, { remindLater });
    }
  }

  /**
   * Reset onboarding progress
   */
  resetOnboarding(type: OnboardingType = 'initial'): void {
    const key = `onboarding_${type}`;
    this.progress.delete(key);
    this.saveProgress();

    // Clear localStorage
    localStorage.removeItem(`onboarding_${type}_progress`);
    localStorage.removeItem(`onboarding_${type}_completed`);

    logger.info(`Onboarding ${type} reset`);
  }

  /**
   * Track analytics event
   */
  trackEvent(event: OnboardingAnalytics): void {
    this.analytics.push(event);

    // Trim history
    if (this.analytics.length > this.maxAnalyticsHistory) {
      this.analytics.shift();
    }

    // Send to analytics service
    try {
      // Import monitoring service dynamically to avoid circular dependencies
      import('../services/monitoring').then(({ monitoringService }) => {
        monitoringService.trackEvent('onboarding_step', {
          stepId: event.stepId,
          stepName: event.stepName,
          duration: event.duration,
          completed: event.completed,
          action: event.action,
          timestamp: event.timestamp.toISOString(),
        });
      }).catch((err) => {
        logger.debug('Failed to send onboarding analytics to monitoring service', err);
      });
    } catch (err) {
      logger.debug('Onboarding analytics event (monitoring service unavailable)', event);
    }

    logger.debug('Onboarding analytics event', event);
  }

  /**
   * Get analytics data
   */
  getAnalytics(stepId?: string): OnboardingAnalytics[] {
    if (stepId) {
      return this.analytics.filter((e) => e.stepId === stepId);
    }
    return [...this.analytics];
  }

  /**
   * Get drop-off analysis
   */
  getDropoffAnalysis(type: OnboardingType = 'initial'): {
    totalStarted: number;
    totalCompleted: number;
    completionRate: number;
    dropoffSteps: Array<{ stepId: string; dropoffCount: number }>;
    averageDuration: number;
  } {
    const started = this.analytics.filter((e) => e.stepId === 'start').length;
    const completed = this.analytics.filter((e) => e.stepId === 'complete').length;
    const steps = this.analytics.filter((e) => e.stepId !== 'start' && e.stepId !== 'complete');
    
    const stepDropoffs = new Map<string, number>();
    steps.forEach((event) => {
      if (!event.completed) {
        stepDropoffs.set(event.stepId, (stepDropoffs.get(event.stepId) || 0) + 1);
      }
    });

    const dropoffSteps = Array.from(stepDropoffs.entries())
      .map(([stepId, dropoffCount]) => ({ stepId, dropoffCount }))
      .sort((a, b) => b.dropoffCount - a.dropoffCount);

    const averageDuration = steps.length > 0
      ? steps.reduce((sum, e) => sum + e.duration, 0) / steps.length
      : 0;

    return {
      totalStarted: started,
      totalCompleted: completed,
      completionRate: started > 0 ? (completed / started) * 100 : 0,
      dropoffSteps,
      averageDuration,
    };
  }

  /**
   * Should show onboarding
   */
  shouldShowOnboarding(type: OnboardingType = 'initial'): boolean {
    const key = `onboarding_${type}`;
    const progress = this.progress.get(key);

    // Don't show if completed
    if (progress?.completedOnboarding) {
      return false;
    }

    // Don't show if skipped (unless remind later)
    if (progress?.skippedAt && !progress.remindLaterAt) {
      return false;
    }

    // Show if remind later and 24 hours passed
    if (progress?.remindLaterAt) {
      const hoursSince = (Date.now() - new Date(progress.remindLaterAt).getTime()) / (1000 * 60 * 60);
      return hoursSince >= 24;
    }

    // Show if not started
    return !progress?.startedAt;
  }
}

export const onboardingService = OnboardingService.getInstance();

