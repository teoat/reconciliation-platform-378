/**
 * Empty State Detection Utility
 * 
 * Detects empty states in components and provides contextual information
 * for triggering EmptyStateGuidance component.
 * 
 * @example
 * ```typescript
 * import { detectEmptyData, shouldShowEmptyStateGuidance } from '@/utils/emptyStateDetection';
 * 
 * const result = detectEmptyData(projects, 'projects');
 * if (result.isEmpty && shouldShowEmptyStateGuidance('projects')) {
 *   return <EmptyStateGuidance type="projects" />;
 * }
 * ```
 */

export type EmptyStateType =
  | 'projects'
  | 'data_sources'
  | 'reconciliation_jobs'
  | 'results'
  | 'matches'
  | 'discrepancies'
  | 'exports';

export interface EmptyStateDetectionResult {
  isEmpty: boolean;
  type: EmptyStateType;
  count: number;
  element?: HTMLElement;
}

/**
 * Detect if a list/table component is empty
 */
export function detectEmptyList(
  containerSelector: string,
  itemSelector: string,
  type: EmptyStateType
): EmptyStateDetectionResult {
  const container = document.querySelector(containerSelector);
  if (!container) {
    return { isEmpty: false, type, count: 0 };
  }

  const items = container.querySelectorAll(itemSelector);
  const count = items.length;

  return {
    isEmpty: count === 0,
    type,
    count,
    element: container as HTMLElement,
  };
}

/**
 * Detect empty state from data array
 */
export function detectEmptyData<T>(
  data: T[] | null | undefined,
  type: EmptyStateType
): EmptyStateDetectionResult {
  const isEmpty = !data || data.length === 0;
  return {
    isEmpty,
    type,
    count: data?.length || 0,
  };
}

/**
 * Detect empty state from API response
 */
export function detectEmptyFromResponse<T>(
  response: { data?: T[]; items?: T[]; results?: T[] } | null | undefined,
  type: EmptyStateType
): EmptyStateDetectionResult {
  const data = response?.data || response?.items || response?.results;
  return detectEmptyData(data, type);
}

/**
 * Auto-detect empty state type from current route
 */
export function detectEmptyStateFromRoute(): EmptyStateType | null {
  const path = window.location.pathname;

  if (path.includes('/projects')) {
    if (path.includes('/reconciliation')) {
      return 'reconciliation_jobs';
    }
    if (path.includes('/results')) {
      return 'results';
    }
    return 'projects';
  }

  if (path.includes('/data-sources') || path.includes('/data-sources')) {
    return 'data_sources';
  }

  if (path.includes('/matches')) {
    return 'matches';
  }

  if (path.includes('/discrepancies')) {
    return 'discrepancies';
  }

  if (path.includes('/exports')) {
    return 'exports';
  }

  return null;
}

/**
 * Check if empty state guidance should be shown
 * (not shown if user has dismissed it or completed setup)
 */
export function shouldShowEmptyStateGuidance(
  type: EmptyStateType,
  userId?: string
): boolean {
  const key = `empty_state_dismissed_${type}${userId ? `_${userId}` : ''}`;
  const dismissed = localStorage.getItem(key);
  
  if (dismissed) {
    const dismissedTime = parseInt(dismissed, 10);
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    // Show again after 7 days
    return daysSinceDismissed > 7;
  }

  return true;
}

/**
 * Mark empty state guidance as dismissed
 */
export function dismissEmptyStateGuidance(
  type: EmptyStateType,
  userId?: string
): void {
  const key = `empty_state_dismissed_${type}${userId ? `_${userId}` : ''}`;
  localStorage.setItem(key, Date.now().toString());
}

/**
 * Track empty state action completion
 */
export function trackEmptyStateAction(
  type: EmptyStateType,
  actionId: string,
  userId?: string
): void {
  const key = `empty_state_action_${type}_${actionId}${userId ? `_${userId}` : ''}`;
  localStorage.setItem(key, Date.now().toString());
  
  // Also mark as dismissed since user took action
  dismissEmptyStateGuidance(type, userId);
}

