/**
 * Skip Link Component
 * Provides keyboard navigation shortcuts to skip to main content areas
 * Essential for WCAG 2.1 AA compliance
 */

import React, { useEffect, useState, useRef } from 'react';

export interface SkipLinkProps {
  href: string;
  label?: string;
  className?: string;
}

/**
 * SkipLink - Allows keyboard users to skip repetitive navigation
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  label = 'Skip to main content',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show skip link when user presses Tab
      if (e.key === 'Tab' && !isVisible) {
        setIsVisible(true);
      }
    };

    const handleClick = () => {
      // Hide skip link after click
      setTimeout(() => setIsVisible(false), 100);
    };

    window.addEventListener('keydown', handleKeyDown);
    const link = linkRef.current;
    if (link) {
      link.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (link) {
        link.removeEventListener('click', handleClick);
      }
    };
  }, [isVisible]);

  return (
    <a
      ref={linkRef}
      href={href}
      className={`
        skip-link
        ${isVisible ? 'skip-link-visible' : 'skip-link-hidden'}
        ${className}
      `}
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          (target as HTMLElement).focus();
        }
        setIsVisible(false);
      }}
      onBlur={() => setIsVisible(false)}
    >
      {label}
    </a>
  );
};

export default SkipLink;
