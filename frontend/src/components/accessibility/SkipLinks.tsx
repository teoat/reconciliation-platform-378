import React from 'react';

/**
 * SkipLinks Component
 *
 * Provides skip navigation links for keyboard users and screen readers.
 * Allows users to skip to main content or navigation without tabbing through
 * all elements.
 *
 * @example
 * ```tsx
 * <SkipLinks />
 * ```
 */

export const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      >
        Skip to navigation
      </a>
    </div>
  );
};
