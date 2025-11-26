/**
 * Onboarding Service
 *
 * Centralized service for managing onboarding experiences,
 * progress tracking, and analytics.
 */

import { logger } from './logger';
import { apiClient } from './apiClient';

export type UserRole = 'admin' | 'analyst' | 'viewer' | 'user';
export type OnboardingType = 'initial' | 'feature_tour' | 'contextual_help' | 'empty_state';

export interface OnboardingProgress {
  userId?: string;
  completedOnboarding: boolean;
  completedSteps: string[];
  currentStep?: string;
  startedAt?: Date;
  completedAt?: Date;
  skippedAt?: Date;
  remindLaterAt?: Date;
  role?: UserRole;
  deviceId?: string;
}

interface OnboardingProgressRequest {
  onboarding_type: string;
  completed_onboarding: boolean;
  completed_steps: string[];
  current_step?: string;
  started_at?: string;
  completed_at?: string;
  skipped_at?: string;
  remind_later_at?: string;
  role?: string;
  device_id?: string;
}

export interface OnboardingAnalytics {
  stepId: string;
  stepName: string;
  duration: number;
  timestamp: Date;
  action?: string;
  completed: boolean;
  skipped?: boolean;
}

class OnboardingService {
  private static instance: OnboardingService;
  private progress: Map<string, OnboardingProgress> = new Map();
  private analytics: OnboardingAnalytics[] = [];
  private readonly maxAnalyticsHistory = 1000;
  private deviceId: string | null = null;
  private syncEnabled: boolean = true;
  private syncInProgress: Set<string> = new Set();

  private constructor() {
    this.initializeDeviceId();
    this.loadProgress();
    // Load from server on initialization
    this.loadFromServer().catch((err) => {
      logger.debug('Failed to load onboarding progress from server', err);
    });
  }

  /**
   * Initialize or retrieve device ID for cross-device continuity
   */
  private initializeDeviceId(): void {
    try {
      let storedDeviceId = localStorage.getItem('device_id');
      if (!storedDeviceId) {
        // Generate a new device ID
        storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('device_id', storedDeviceId);
      }
      this.deviceId = storedDeviceId;

      // Register device with server
      this.registerDevice().catch((err) => {
        logger.debug('Failed to register device', err);
      });
    } catch (error: unknown) {
      logger.error('Failed to initialize device ID:', { error });
      this.deviceId = `device_${Date.now()}`;
    }
  }

  /**
   * Register device with server for cross-device continuity
   */
  private async registerDevice(): Promise<void> {
    if (!this.deviceId || !this.syncEnabled) return;

    try {
      const deviceName = navigator.platform || 'Unknown Device';
      const deviceType = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
        ? 'mobile'
        : 'desktop';

      await apiClient.makeRequest('/onboarding/devices', {
        method: 'POST',
        body: JSON.stringify({
          device_id: this.deviceId,
          device_name: deviceName,
          device_type: deviceType,
          user_agent: navigator.userAgent,
        }),
      });
    } catch (error: unknown) {
      logger.debug('Device registration failed (non-critical)', { error });
    }
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
    } catch (error: unknown) {
      logger.error('Failed to load onboarding progress:', { error });
    }
  }

  /**
   * Save progress to localStorage
   */
  private saveProgress(): void {
    try {
      const data = Object.fromEntries(this.progress);
      localStorage.setItem('onboarding_progress', JSON.stringify(data));
    } catch (error: unknown) {
      logger.error('Failed to save onboarding progress:', { error });
    }
  }

  /**
   * Sync progress to server
   */
  public async syncToServer(type: OnboardingType): Promise<void> {
    if (!this.syncEnabled || this.syncInProgress.has(type)) return;

    const key = `onboarding_${type}`;
    const progress = this.progress.get(key);
    if (!progress) return;

    this.syncInProgress.add(type);

    try {
      const request: OnboardingProgressRequest = {
        onboarding_type: type,
        completed_onboarding: progress.completedOnboarding,
        completed_steps: progress.completedSteps,
        current_step: progress.currentStep,
        started_at: progress.startedAt?.toISOString(),
        completed_at: progress.completedAt?.toISOString(),
        skipped_at: progress.skippedAt?.toISOString(),
        remind_later_at: progress.remindLaterAt?.toISOString(),
        role: progress.role,
        device_id: this.deviceId || undefined,
      };

      await apiClient.makeRequest('/onboarding/progress', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      logger.debug(`Onboarding progress synced for ${type}`);
    } catch (error: unknown) {
      logger.debug(`Failed to sync onboarding progress for ${type}`, { error });
      // Don't throw - local storage is still updated
    } finally {
      this.syncInProgress.delete(type);
    }
  }

  /**
   * Load progress from server
   */
  private async loadFromServer(): Promise<void> {
    if (!this.syncEnabled) return;

    try {
      // Load all onboarding types
      const types: OnboardingType[] = ['initial', 'feature_tour', 'contextual_help', 'empty_state'];

      for (const type of types) {
        try {
          const response = await apiClient.makeRequest<{
            user_id: string;
            onboarding_type: string;
            completed_onboarding: boolean;
            completed_steps: string[];
            current_step?: string;
            started_at?: string;
            completed_at?: string;
            skipped_at?: string;
            remind_later_at?: string;
            role?: string;
            device_id?: string;
            synced_at: string;
          }>(`/onboarding/progress?type=${type}`, { method: 'GET' });

          if (response.success && response.data) {
            const data = response.data;
            const key = `onboarding_${type}`;
            const progress: OnboardingProgress = {
              userId: data.user_id,
              completedOnboarding: data.completed_onboarding,
              completedSteps: data.completed_steps || [],
              currentStep: data.current_step,
              startedAt: data.started_at ? new Date(data.started_at) : undefined,
              completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
              skippedAt: data.skipped_at ? new Date(data.skipped_at) : undefined,
              remindLaterAt: data.remind_later_at ? new Date(data.remind_later_at) : undefined,
              role: data.role as UserRole | undefined,
              deviceId: data.device_id,
            };

            // Merge with local progress (server takes precedence for completed steps)
            const localProgress = this.progress.get(key);
            if (
              localProgress &&
              localProgress.completedSteps.length > progress.completedSteps.length
            ) {
              // Keep local progress if it has more steps
              progress.completedSteps = localProgress.completedSteps;
            }

            this.progress.set(key, progress);
            this.saveProgress();
          }
        } catch (error: unknown) {
          logger.debug(`Failed to load ${type} progress from server`, { error });
        }
      }
    } catch (error: unknown) {
      logger.debug('Failed to load onboarding progress from server', { error });
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

    // Sync to server
    this.syncToServer(type).catch((err) => {
      logger.debug('Failed to sync onboarding start', err);
    });

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

    // Sync to server
    this.syncToServer(type).catch((err) => {
      logger.debug('Failed to sync step completion', err);
    });

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
   * Skip onboarding step
   */
  skipStep(stepId: string, type: OnboardingType = 'initial'): void {
    const key = `onboarding_${type}`;
    const progress = this.progress.get(key) || {
      completedOnboarding: false,
      completedSteps: [],
    };

    // Mark step as skipped (we'll track this in analytics)
    progress.currentStep = stepId;

    this.progress.set(key, progress);
    this.saveProgress();

    // Track analytics for skipped step
    this.trackEvent({
      stepId,
      stepName: 'skipped',
      duration: 0,
      timestamp: new Date(),
      completed: false,
      skipped: true,
    });

    logger.info(`Onboarding step skipped: ${stepId}`);
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

      // Sync to server
      this.syncToServer(type).catch((err) => {
        logger.debug('Failed to sync onboarding completion', err);
      });

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

      // Sync to server
      this.syncToServer(type).catch((err) => {
        logger.debug('Failed to sync onboarding skip', err);
      });

      logger.info(`Onboarding ${type} skipped`, { remindLater });
    }
  }

  /**
   * Manually sync all progress to server
   */
  async syncAllProgress(): Promise<void> {
    const types: OnboardingType[] = ['initial', 'feature_tour', 'contextual_help', 'empty_state'];
    await Promise.all(types.map((type) => this.syncToServer(type)));
  }

  /**
   * Enable or disable server sync
   */
  setSyncEnabled(enabled: boolean): void {
    this.syncEnabled = enabled;
  }

  /**
   * Get device ID
   */
  getDeviceId(): string | null {
    return this.deviceId;
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
      import('../services/monitoring')
        .then(({ monitoringService }) => {
          monitoringService.trackEvent('onboarding_step', {
            stepId: event.stepId,
            stepName: event.stepName,
            duration: event.duration,
            completed: event.completed,
            action: event.action,
            timestamp: event.timestamp.toISOString(),
          } as Record<string, unknown>);
        })
        .catch((err: unknown) => {
          logger.debug('Failed to send onboarding analytics to monitoring service', { error: err });
        });
    } catch (err: unknown) {
      logger.debug('Onboarding analytics event (monitoring service unavailable)', {
        event,
        error: err,
      });
    }

    logger.debug('Onboarding analytics event', { event });
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
  getDropoffAnalysis(_type: OnboardingType = 'initial'): {
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

    const averageDuration =
      steps.length > 0 ? steps.reduce((sum, e) => sum + e.duration, 0) / steps.length : 0;

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
      const hoursSince =
        (Date.now() - new Date(progress.remindLaterAt).getTime()) / (1000 * 60 * 60);
      return hoursSince >= 24;
    }

    // Show if not started
    return !progress?.startedAt;
  }
}

export const onboardingService = OnboardingService.getInstance();
