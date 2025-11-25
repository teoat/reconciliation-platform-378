/**
 * Contextual Help Component
 * Provides contextual help, tooltips, and guided assistance
 * Essential for Task 5.5: Comprehensive User Guidance
 */

import React, { useState, useCallback, useEffect } from 'react';
import { HelpCircle, X, ChevronRight, Lightbulb, BookOpen } from 'lucide-react';
// Import ariaLiveRegionsService with type-safe access
import { ariaLiveRegionsService } from '../../utils/ariaLiveRegionsHelper';

export interface HelpTip {
  id: string;
  title: string;
  content: string;
  category?: 'tip' | 'guide' | 'example';
  order?: number;
}

export interface HelpSection {
  id: string;
  title: string;
  content: string;
  tips?: HelpTip[];
  links?: { title: string; url: string }[];
}

export interface ContextualHelpProps {
  trigger?: 'hover' | 'click' | 'focus' | 'always';
  position?: 'top' | 'bottom' | 'left' | 'right';
  helpContent?: HelpSection;
  onHelpRequest?: () => void;
  className?: string;
}

/**
 * ContextualHelp - Provides contextual help and guidance
 */
export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  trigger = 'click',
  position = 'bottom',
  helpContent,
  onHelpRequest,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ariaExpandedValue = isOpen ? 'true' : 'false';

  const shouldShow =
    trigger === 'always' || (trigger === 'hover' && isHovered) || (trigger === 'click' && isOpen);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen && onHelpRequest) {
      onHelpRequest();
    }
  }, [isOpen, onHelpRequest]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    },
    [isOpen, handleToggle]
  );

  useEffect(() => {
    if (isOpen && helpContent && (ariaLiveRegionsService as any)?.announceStatus) {
      (ariaLiveRegionsService as any).announceStatus(`Help: ${helpContent.title}`, {
        componentId: helpContent.id,
        action: 'help-opened',
      });
    }
  }, [isOpen, helpContent]);

  if (!helpContent) return null;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Help Trigger Button */}
      <button
        type="button"
        onClick={trigger === 'click' ? handleToggle : undefined}
        onMouseEnter={trigger === 'hover' ? () => setIsHovered(true) : undefined}
        onMouseLeave={trigger === 'hover' ? () => setIsHovered(false) : undefined}
        onFocus={trigger === 'focus' ? () => setIsOpen(true) : undefined}
        onBlur={trigger === 'focus' ? () => setIsOpen(false) : undefined}
        onKeyDown={handleKeyDown}
        className="inline-flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        aria-label={`Get help: ${helpContent.title}`}
        aria-expanded={ariaExpandedValue}
        aria-controls={helpContent.id ? `help-${helpContent.id}` : 'help-content'}
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Help Content */}
      {shouldShow && (
        <div
          id={helpContent.id ? `help-${helpContent.id}` : 'help-content'}
          className={`
            absolute z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4
            ${position === 'top' ? 'bottom-full mb-2' : ''}
            ${position === 'bottom' ? 'top-full mt-2' : ''}
            ${position === 'left' ? 'right-full mr-2' : ''}
            ${position === 'right' ? 'left-full ml-2' : ''}
          `}
          role="tooltip"
          aria-live="polite"
        >
          {/* Close Button */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1 text-yellow-500" aria-hidden="true" />
              {helpContent.title}
            </h3>
            {trigger === 'click' && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label="Close help"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Help Content */}
          <div className="text-sm text-gray-700 mb-3">{helpContent.content}</div>

          {/* Tips */}
          {helpContent.tips && helpContent.tips.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Tips:</h4>
              <ul className="space-y-1">
                {helpContent.tips.map((tip) => (
                  <li key={tip.id} className="flex items-start text-xs">
                    <ChevronRight
                      className="h-3 w-3 mr-1 text-gray-400 mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>{tip.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Links */}
          {helpContent.links && helpContent.links.length > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center">
                <BookOpen className="h-3 w-3 mr-1" aria-hidden="true" />
                Learn More:
              </h4>
              <ul className="space-y-1">
                {helpContent.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContextualHelp;
