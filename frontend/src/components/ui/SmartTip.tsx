/**
 * Smart Tip Component
 *
 * Context-aware tip system that provides intelligent tips based on:
 * - User progress and onboarding state
 * - Current page/feature context
 * - User behavior patterns
 * - Feature usage analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Lightbulb, ChevronRight, Sparkles } from 'lucide-react';
import { onboardingService } from '@/services/onboardingService';

export type TipPriority = 'low' | 'medium' | 'high' | 'critical';
export type TipCategory = 'feature' | 'shortcut' | 'optimization' | 'best-practice' | 'new-feature';

export interface SmartTipData {
  id: string;
  title: string;
  content: string;
  category: TipCategory;
  priority: TipPriority;
  targetFeature?: string;
  targetPage?: string;
  requiredProgress?: string[];
  dismissible?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  showOnce?: boolean;
  expiresAt?: Date;
  icon?: React.ReactNode;
}

export interface SmartTipProps {
  tip: SmartTipData;
  onDismiss?: (tipId: string) => void;
  onAction?: (tipId: string) => void;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'compact' | 'expanded';
}

/**
 * Smart Tip Component
 */
export const SmartTip: React.FC<SmartTipProps> = ({
  tip,
  onDismiss,
  onAction,
  className = '',
  position = 'bottom',
  variant = 'default',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(variant === 'expanded');

  // Check if tip should be shown based on user progress
  const shouldShow = useCallback(() => {
    if (tip.requiredProgress && tip.requiredProgress.length > 0) {
      const progress = onboardingService.getProgress('initial');
      const hasRequiredProgress = tip.requiredProgress.every((step) =>
        progress.completedSteps.includes(step)
      );
      if (!hasRequiredProgress) {
        return false;
      }
    }

    // Check if tip was already dismissed (showOnce)
    if (tip.showOnce) {
      const dismissed = localStorage.getItem(`tip_dismissed_${tip.id}`);
      if (dismissed) {
        return false;
      }
    }

    // Check expiration
    if (tip.expiresAt && new Date() > tip.expiresAt) {
      return false;
    }

    return true;
  }, [tip]);

  useEffect(() => {
    if (!shouldShow()) {
      setIsVisible(false);
    }
  }, [shouldShow]);

  const handleDismiss = useCallback(() => {
    if (tip.showOnce) {
      localStorage.setItem(`tip_dismissed_${tip.id}`, 'true');
    }
    setIsVisible(false);
    onDismiss?.(tip.id);
  }, [tip, onDismiss]);

  const handleAction = useCallback(() => {
    onAction?.(tip.id);
    tip.onAction?.();
  }, [tip, onAction]);

  if (!isVisible) {
    return null;
  }

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const variantClasses = {
    default: 'p-4',
    compact: 'p-2',
    expanded: 'p-4',
  };

  const priorityColors = {
    low: 'bg-blue-50 border-blue-200 text-blue-900',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    high: 'bg-orange-50 border-orange-200 text-orange-900',
    critical: 'bg-red-50 border-red-200 text-red-900',
  };

  return (
    <div
      className={`smart-tip ${positionClasses[position]} ${variantClasses[variant]} ${priorityColors[tip.priority]} border rounded-lg shadow-lg max-w-sm z-50 ${className}`}
      data-tip-id={tip.id}
      data-tip-category={tip.category}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {tip.icon || (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1">{tip.title}</h4>
              {isExpanded && <p className="text-sm text-gray-700 mb-2">{tip.content}</p>}
              {tip.category === 'new-feature' && (
                <span className="inline-flex items-center gap-1 text-xs text-purple-700 mb-2">
                  <Sparkles className="w-3 h-3" />
                  New Feature
                </span>
              )}
            </div>
            {tip.dismissible !== false && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss tip"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {variant === 'compact' && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
            >
              Learn more
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {tip.actionLabel && (
            <button
              onClick={handleAction}
              className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {tip.actionLabel}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Smart Tip Provider Hook
 */
export interface UseSmartTipsOptions {
  page?: string;
  featureId?: string;
  userProgress?: string[];
  maxTips?: number;
}

export const useSmartTips = (options: UseSmartTipsOptions = {}) => {
  const { page, featureId, userProgress, maxTips = 3 } = options;
  const [tips, setTips] = useState<SmartTipData[]>([]);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadTips = () => {
      const allTips: SmartTipData[] = [];

      // Page-specific tips
      if (page === 'dashboard' && userProgress?.includes('welcome')) {
        allTips.push({
          id: 'dashboard-shortcuts',
          title: 'Keyboard Shortcuts',
          content: 'Press "?" to see all available keyboard shortcuts for faster navigation.',
          category: 'shortcut',
          priority: 'medium',
          targetPage: 'dashboard',
          requiredProgress: ['welcome'],
          showOnce: true,
        });
      }

      if (page === 'reconciliation' && userProgress?.includes('upload-files')) {
        allTips.push({
          id: 'reconciliation-bulk-actions',
          title: 'Bulk Actions',
          content:
            'Select multiple records to perform bulk actions like approve, reject, or export.',
          category: 'feature',
          priority: 'high',
          targetPage: 'reconciliation',
          requiredProgress: ['upload-files'],
        });
      }

      // Feature-specific tips
      if (featureId === 'analytics' && userProgress?.includes('visualize-results')) {
        allTips.push({
          id: 'analytics-export',
          title: 'Export Analytics',
          content: 'You can export your analytics data as CSV or PDF for reporting purposes.',
          category: 'feature',
          priority: 'medium',
          targetFeature: 'analytics',
          requiredProgress: ['visualize-results'],
        });
      }

      // Filter tips based on requirements
      const filteredTips = allTips.filter((tip) => {
        if (dismissedTips.has(tip.id)) {
          return false;
        }

        if (tip.requiredProgress && tip.requiredProgress.length > 0) {
          const hasRequiredProgress = tip.requiredProgress.every((step) =>
            userProgress?.includes(step)
          );
          if (!hasRequiredProgress) {
            return false;
          }
        }

        if (tip.targetPage && tip.targetPage !== page) {
          return false;
        }

        if (tip.targetFeature && tip.targetFeature !== featureId) {
          return false;
        }

        return true;
      });

      // Sort by priority and limit
      const sortedTips = filteredTips
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, maxTips);

      setTips(sortedTips);
    };

    loadTips();
  }, [page, featureId, userProgress, dismissedTips, maxTips]);

  const dismissTip = useCallback((tipId: string) => {
    setDismissedTips((prev) => new Set([...prev, tipId]));
    setTips((prev) => prev.filter((tip) => tip.id !== tipId));
  }, []);

  return {
    tips,
    dismissTip,
    hasTips: tips.length > 0,
  };
};

export default SmartTip;
