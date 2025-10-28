// Subscription Management Component
// UI for managing subscriptions and viewing usage

import React, { useState, useEffect } from 'react'
import { Check, CreditCard, AlertTriangle, TrendingUp, Calendar } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import StatusBadge from '../ui/StatusBadge'
import { subscriptionService, Subscription, SubscriptionTier, UsageMetrics } from '../../services/subscriptionService'
import ProgressBar from '../ui/ProgressBar'

export const SubscriptionManagement: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sub, usageData] = await Promise.all([
        subscriptionService.loadSubscription(),
        subscriptionService.loadUsageMetrics()
      ])
      setSubscription(sub)
      setUsage(usageData)
    } catch (error) {
      console.error('Failed to load subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier: SubscriptionTier, billingCycle: 'monthly' | 'yearly') => {
    try {
      const checkoutUrl = await subscriptionService.createCheckoutSession(tier, billingCycle)
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Failed to create checkout session:', error)
    }
  }

  const handleCancel = async () => {
    if (!subscription) return
    
    const confirmed = window.confirm(
      subscription.cancelAtPeriodEnd
        ? 'Your subscription will remain active until the end of the billing period.'
        : 'Are you sure you want to cancel your subscription immediately?'
    )
    
    if (confirmed) {
      await subscriptionService.cancelSubscription(false)
      await loadData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Current Subscription</h2>
          {subscription && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel Subscription
            </Button>
          )}
        </div>

        {subscription ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <StatusBadge status={subscription.status} />
              <span className="text-2xl font-bold text-gray-900">
                {subscriptionService.getTierFeatures(subscription.tier).name}
              </span>
              <span className="text-gray-600 capitalize">• {subscription.billingCycle}</span>
            </div>

            {subscription.endsAt && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  {subscription.cancelAtPeriodEnd
                    ? `Renews on ${new Date(subscription.endsAt).toLocaleDateString()}`
                    : `Valid until ${new Date(subscription.endsAt).toLocaleDateString()}`
                  }
                </span>
              </div>
            )}

            {subscription.cancelAtPeriodEnd && (
              <div className="flex items-center space-x-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span>Subscription will cancel at period end</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No active subscription</p>
            <Button variant="primary" onClick={() => handleUpgrade(SubscriptionTier.STARTER, 'monthly')}>
              Start Subscription
            </Button>
          </div>
        )}
      </Card>

      {/* Usage Metrics */}
      {usage && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Usage</h2>
          
          <div className="space-y-6">
            {/* Reconciliations */}
            {usage.reconciliationLimit && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Reconciliations</span>
                  <span className="font-medium text-gray-900">
                    {usage.reconciliationCount} / {usage.reconciliationLimit}
                  </span>
                </div>
                <ProgressBar
                  value={usage.reconciliationCount}
                  max={usage.reconciliationLimit}
                  variant={usage.reconciliationCount >= usage.reconciliationLimit * 0.9 ? 'warning' : 'default'}
                />
              </div>
            )}

            {/* Storage */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Storage</span>
                <span className="font-medium text-gray-900">
                  {(usage.storageBytes / 1_000_000_000).toFixed(2)} GB / {(usage.storageLimitBytes / 1_000_000_000).toFixed(1)} GB
                </span>
              </div>
              <ProgressBar
                value={usage.storageBytes}
                max={usage.storageLimitBytes}
                variant={usage.storageBytes >= usage.storageLimitBytes * 0.9 ? 'warning' : 'default'}
              />
            </div>

            {/* Projects */}
            {usage.projectLimit && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Projects</span>
                  <span className="font-medium text-gray-900">
                    {usage.projectCount} / {usage.projectLimit}
                  </span>
                </div>
                <ProgressBar
                  value={usage.projectCount}
                  max={usage.projectLimit}
                  variant={usage.projectCount >= usage.projectLimit * 0.9 ? 'warning' : 'default'}
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tier Comparison */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(SubscriptionTier).map(tier => {
            const features = subscriptionService.getTierFeatures(tier)
            const isCurrent = subscription?.tier === tier
            
            return (
              <div
                key={tier}
                className={`p-6 rounded-lg border-2 ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{features.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${features.price.monthly}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ${features.price.yearly / 12}/month billed annually
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {features.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isCurrent ? 'outline' : 'primary'}
                  onClick={() => handleUpgrade(tier, 'monthly')}
                  className="w-full"
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${features.name}`}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export default SubscriptionManagement

