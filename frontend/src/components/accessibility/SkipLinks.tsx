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
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link sr-only focus:not-sr-only">
        Skip to navigation
      </a>
      <a href="#footer" className="skip-link sr-only focus:not-sr-only">
        Skip to footer
      </a>
    </div>
  );
};

