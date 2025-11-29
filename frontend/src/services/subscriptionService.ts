// Subscription Service - Frontend interface for billing
import { logger } from '@/services/logger';
// Manages subscription tiers and payment flows

import { apiClient } from './apiClient';

export enum SubscriptionTier {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  billingCycle: 'monthly' | 'yearly';
  startsAt: Date;
  endsAt?: Date;
  cancelAtPeriodEnd: boolean;
}

export interface UsageMetrics {
  reconciliationCount: number;
  reconciliationLimit?: number;
  storageBytes: number;
  storageLimitBytes: number;
  projectCount: number;
  projectLimit?: number;
}

export interface BillingInfo {
  customerId: string;
  email: string;
  paymentMethod: {
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
  };
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

const TIER_FEATURES = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    features: ['1 Project', '10 Reconciliations/month', '1 GB Storage', 'Basic Support'],
  },
  [SubscriptionTier.STARTER]: {
    name: 'Starter',
    price: { monthly: 29, yearly: 278 },
    features: [
      '5 Projects',
      '100 Reconciliations/month',
      '10 GB Storage',
      'Email Support',
      'Basic Analytics',
    ],
  },
  [SubscriptionTier.PROFESSIONAL]: {
    name: 'Professional',
    price: { monthly: 99, yearly: 950 },
    features: [
      '50 Projects',
      '1,000 Reconciliations/month',
      '100 GB Storage',
      'Priority Support',
      'Advanced Analytics',
      'API Access',
      'Custom Integrations',
    ],
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: 'Enterprise',
    price: { monthly: 499, yearly: 4790 },
    features: [
      'Unlimited Projects',
      'Unlimited Reconciliations',
      '1 TB Storage',
      'Dedicated Support',
      'Advanced Analytics',
      'API Access',
      'Custom Integrations',
      '99.9% SLA',
    ],
  },
};

/**
 * Subscription Service
 * Handles subscription management and billing
 */
export class SubscriptionService {
  private subscription: Subscription | null = null;
  private usageMetrics: UsageMetrics | null = null;
  private listeners: Set<(subscription: Subscription | null) => void> = new Set();

  /**
   * Load current subscription
   */
  async loadSubscription(): Promise<Subscription | null> {
    try {
      const response = await apiClient.get('/subscriptions/current');
      if (response.success && response.data) {
        this.subscription = response.data as Subscription;
        this.notifyListeners();
        return this.subscription;
      }
    } catch (error) {
      logger.error('Failed to load subscription:', error);
    }
    return null;
  }

  /**
   * Get current subscription
   */
  getCurrentSubscription(): Subscription | null {
    return this.subscription;
  }

  /**
   * Check if user has active subscription
   */
  hasActiveSubscription(): boolean {
    return this.subscription !== null && this.subscription.status === 'active';
  }

  /**
   * Get tier features
   */
  getTierFeatures(tier: SubscriptionTier) {
    return TIER_FEATURES[tier];
  }

  /**
   * Create checkout session for subscription upgrade
   */
  async createCheckoutSession(
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<string> {
    const response = await apiClient.post('/billing/checkout', {
      tier,
      billingCycle,
    });

    if (response.success && response.data) {
      return (response.data as { url?: string })?.url || '';
    }

    throw new Error('Failed to create checkout session');
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(immediately: boolean = false): Promise<void> {
    if (!this.subscription) throw new Error('No active subscription');

    await apiClient.post(`/subscriptions/${this.subscription.id}/cancel`, {
      immediately,
    });

    this.subscription = null;
    this.notifyListeners();
  }

  /**
   * Load usage metrics
   */
  async loadUsageMetrics(): Promise<UsageMetrics> {
    const response = await apiClient.get('/subscriptions/usage');

    if (response.success && response.data) {
      this.usageMetrics = response.data as UsageMetrics;
      return this.usageMetrics;
    }

    throw new Error('Failed to load usage metrics');
  }

  /**
   * Get usage metrics
   */
  getUsageMetrics(): UsageMetrics | null {
    return this.usageMetrics;
  }

  /**
   * Check if usage is within limits
   */
  isWithinLimits(): boolean {
    if (!this.usageMetrics) return true;

    const reconciliationOk =
      !this.usageMetrics.reconciliationLimit ||
      this.usageMetrics.reconciliationCount <= this.usageMetrics.reconciliationLimit;

    const storageOk = this.usageMetrics.storageBytes <= this.usageMetrics.storageLimitBytes;

    const projectOk =
      !this.usageMetrics.projectLimit ||
      this.usageMetrics.projectCount <= this.usageMetrics.projectLimit;

    return reconciliationOk && storageOk && projectOk;
  }

  /**
   * Subscribe to subscription updates
   */
  subscribe(callback: (subscription: Subscription | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.subscription);
      } catch (error) {
        logger.error('Error notifying listener:', error);
      }
    });
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
