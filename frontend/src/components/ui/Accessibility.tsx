import React, { memo, useEffect, useState, useId, useRef } from 'react';

/**
 * Accessibility Components
 * Consolidated accessibility utilities for screen readers and keyboard navigation
 */

// ============================================================================
// Skip Link Component
// ============================================================================

/**
 * Skip Link Component
 * Provides keyboard navigation shortcuts to key content areas
 * Improves accessibility for screen reader users
 */
export interface SkipLinkProps {
  /** Additional skip links to include */
  additionalLinks?: Array<{ href: string; label: string }>;
}

export const SkipLink: React.FC<SkipLinkProps> = memo(({ additionalLinks = [] }) => {
  const defaultLinks = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#search', label: 'Skip to search' },
  ];

  const allLinks = [...defaultLinks, ...additionalLinks];

  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50 focus-within:flex focus-within:flex-col focus-within:gap-2">
      {allLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="sr-only focus:not-sr-only focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          aria-label={link.label}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
});

SkipLink.displayName = 'SkipLink';

// ============================================================================
// Status Announcer Component
// ============================================================================

export interface StatusAnnouncerProps {
  /** Status message to announce */
  message: string;
  /** Type of status */
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  /** Whether to announce immediately */
  announce?: boolean;
}

/**
 * Status Announcer Component
 * Announces status changes to screen readers
 * Helps users understand application state changes
 */
export const StatusAnnouncer: React.FC<StatusAnnouncerProps> = memo(
  ({ message, type = 'info', announce = true }) => {
    const [announceMessage, setAnnounceMessage] = useState('');

    useEffect(() => {
      if (announce && message) {
        setAnnounceMessage(`${type}: ${message}`);
        // Clear after announcement
        const timer = setTimeout(() => setAnnounceMessage(''), 1000);
        return () => clearTimeout(timer);
      }
    }, [message, type, announce]);

    return (
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {announceMessage}
      </div>
    );
  }
);

StatusAnnouncer.displayName = 'StatusAnnouncer';

// ============================================================================
// ARIA Live Region Component
// ============================================================================

export interface ARIALiveRegionProps {
  /** Message to announce */
  message?: string;
  /** Priority level: polite (default) or assertive */
  priority?: 'polite' | 'assertive';
  /** Component ID for reference */
  id?: string;
  /** Auto-clear message after delay (ms) */
  clearAfter?: number;
}

/**
 * ARIA Live Region Component
 * Announces dynamic content changes to screen readers
 * Improves accessibility for users with assistive technologies
 */
export const ARIALiveRegion: React.FC<ARIALiveRegionProps> = memo(
  ({ message = '', priority = 'polite', id, clearAfter = 5000 }) => {
    const componentId = useId();
    const finalId = id || `aria-live-region-${componentId}`;
    const [displayMessage, setDisplayMessage] = useState('');
    const [announceKey, setAnnounceKey] = useState(0);

    useEffect(() => {
      if (message) {
        setDisplayMessage(message);
        setAnnounceKey((prev) => prev + 1);

        // Auto-clear message after delay
        if (clearAfter > 0) {
          const timer = setTimeout(() => {
            setDisplayMessage('');
          }, clearAfter);

          return () => clearTimeout(timer);
        }
      }
    }, [message, clearAfter]);

    return (
      <div
        id={finalId}
        role="status"
        // eslint-disable-next-line jsx-a11y/aria-props
        aria-live={priority === 'assertive' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className="sr-only"
        key={announceKey}
      >
        {displayMessage}
      </div>
    );
  }
);

ARIALiveRegion.displayName = 'ARIALiveRegion';

/**
 * Hook for using ARIA Live Region
 */
export const useARIALiveRegion = () => {
  const [message, setMessage] = useState<string>('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = (text: string, level: 'polite' | 'assertive' = 'polite') => {
    setPriority(level);
    setMessage(text);
  };

  const clear = () => {
    setMessage('');
  };

  return {
    announce,
    clear,
    LiveRegion: <ARIALiveRegion message={message} priority={priority} id="use-aria-live-region" />,
  };
};

// ============================================================================
// Contextual Help Component
// ============================================================================

export interface ContextualHelpProps {
  /** Help content to display */
  content: string;
  /** Help title */
  title?: string;
  /** Position of the help tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Children to wrap with help */
  children: React.ReactNode;
}

/**
 * Contextual Help Component
 * Provides inline help tooltips for better UX
 * Helps users understand complex features
 */
export const ContextualHelp: React.FC<ContextualHelpProps> = memo(
  ({ content, title, position = 'top', children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => setIsVisible(true);
    const hideTooltip = () => setIsVisible(false);

    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };

    return (
      <div className="relative inline-block">
        <div
          ref={triggerRef}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          className="inline-flex items-center cursor-help"
          tabIndex={0}
          role="button"
          aria-describedby={isVisible ? 'contextual-help-tooltip' : undefined}
        >
          {children}
        </div>

        {isVisible && (
          <div
            ref={tooltipRef}
            id="contextual-help-tooltip"
            role="tooltip"
            className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg max-w-xs ${positionClasses[position]}`}
          >
            {title && <div className="font-semibold mb-1">{title}</div>}
            <div>{content}</div>
            <div
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                position === 'top'
                  ? 'top-full left-1/2 -translate-x-1/2 -mt-1'
                  : position === 'bottom'
                    ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1'
                    : position === 'left'
                      ? 'left-full top-1/2 -translate-y-1/2 -ml-1'
                      : 'right-full top-1/2 -translate-y-1/2 -mr-1'
              }`}
            />
          </div>
        )}
      </div>
    );
  }
);

ContextualHelp.displayName = 'ContextualHelp';

export default { SkipLink, ARIALiveRegion, ContextualHelp, useARIALiveRegion };
