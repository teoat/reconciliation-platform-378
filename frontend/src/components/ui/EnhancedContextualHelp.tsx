/**
 * Enhanced Contextual Help Component
 *
 * Enhanced version of ContextualHelp integrated with HelpContentService.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { HelpCircle, X, ChevronRight, Lightbulb, BookOpen, Video, Search } from 'lucide-react';
import { helpContentService, HelpContent } from '../../services/helpContentService';
import { HelpSearch } from './HelpSearch';
import ariaLiveRegionsServiceModule from '../../services/ariaLiveRegionsService';

const ariaLiveRegionsService =
  (ariaLiveRegionsServiceModule as any).ariaLiveRegionsService ||
  (ariaLiveRegionsServiceModule as any).default?.getInstance?.() ||
  ariaLiveRegionsServiceModule;

export interface EnhancedContextualHelpProps {
  contentId?: string; // Help content ID from HelpContentService
  feature?: string; // Feature name to get help content
  trigger?: 'hover' | 'click' | 'focus' | 'always';
  position?: 'top' | 'bottom' | 'left' | 'right';
  onHelpRequest?: () => void;
  className?: string;
}

/**
 * Enhanced ContextualHelp integrated with HelpContentService
 */
export const EnhancedContextualHelp: React.FC<EnhancedContextualHelpProps> = ({
  contentId,
  feature,
  trigger = 'click',
  position = 'bottom',
  onHelpRequest,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [helpContent, setHelpContent] = useState<HelpContent | null>(null);
  const [relatedContent, setRelatedContent] = useState<HelpContent[]>([]);

  // Load help content
  useEffect(() => {
    let content: HelpContent | null = null;

    if (contentId) {
      content = helpContentService.getContent(contentId);
    } else if (feature) {
      const featureContent = helpContentService.getContentByFeature(feature);
      content = featureContent[0] || null;
    }

    if (content) {
      setHelpContent(content);

      // Track view (if method exists)
      if ('trackView' in helpContentService && typeof helpContentService.trackView === 'function') {
        (helpContentService as any).trackView(content.id);
      }

      // Load related content (if method exists)
      if ('getRelated' in helpContentService && typeof helpContentService.getRelated === 'function') {
        const related = (helpContentService as any).getRelated(content.id, 3);
        setRelatedContent(related || []);
      } else {
        // Fallback: get content by category
        const categoryContent = helpContentService.getContentByCategory(content.category);
        setRelatedContent(categoryContent.filter((c) => c.id !== content.id).slice(0, 3));
      }
    }
  }, [contentId, feature]);

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

  const handleFeedback = useCallback(
    (helpful: boolean) => {
      if (helpContent) {
        // helpContentService.trackFeedback(helpContent.id, helpful);
        // TODO: Implement trackFeedback method in HelpContentService
      }
    },
    [helpContent]
  );

  useEffect(() => {
    if (isOpen && helpContent && ariaLiveRegionsService?.announceStatus) {
      ariaLiveRegionsService.announceStatus(`Help: ${helpContent.title}`, {
        componentId: helpContent.id,
        action: 'help-opened',
      });
    }
  }, [isOpen, helpContent]);

  if (!helpContent) return null;

  return (
    <>
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
          aria-controls={`help-${helpContent.id}`}
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Help Content */}
        {shouldShow && (
          <div
            id={`help-${helpContent.id}`}
            className={`
              absolute z-50 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4
              ${position === 'top' ? 'bottom-full mb-2' : ''}
              ${position === 'bottom' ? 'top-full mt-2' : ''}
              ${position === 'left' ? 'right-full mr-2' : ''}
              ${position === 'right' ? 'left-full ml-2' : ''}
            `}
            role="tooltip"
            aria-live="polite"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <Lightbulb className="h-4 w-4 mr-1 text-yellow-500" aria-hidden="true" />
                {helpContent.title}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSearch(true)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="Search help"
                >
                  <Search className="h-4 w-4" />
                </button>
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
            </div>

            {/* Help Content */}
            <div className="text-sm text-gray-700 mb-3">{helpContent.content}</div>

            {/* Tips */}
            {/* TODO: Add tips property to HelpContent interface
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
            */}

            {/* Video Link */}
            {helpContent.videoUrl && (
              <div className="mb-3">
                <a
                  href={helpContent.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <Video className="h-3 w-3 mr-1" />
                  Watch Tutorial Video
                </a>
              </div>
            )}

            {/* Related Content */}
            {relatedContent.length > 0 && (
              <div className="mb-3 border-t border-gray-200 pt-3">
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Related Articles:</h4>
                <ul className="space-y-1">
                  {relatedContent.map((related) => (
                    <li key={related.id}>
                      <button
                        onClick={() => {
                          setHelpContent(related);
                          helpContentService.trackView(related.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {related.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Links */}
            {/* TODO: Add links property to HelpContent interface
            {helpContent.links && helpContent.links.length > 0 && (
              <div className="border-t border-gray-200 pt-3 mb-3">
                <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" aria-hidden="true" />
                  Learn More:
                </h4>
                <ul className="space-y-1">
                  {helpContent.links.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.url}
                        target={link.type === 'external' ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                      >
                        {link.title}
                        {link.type === 'external' && <ExternalLink className="h-3 w-3 ml-1" />}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            */}

            {/* Feedback */}
            <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Was this helpful?</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleFeedback(true)}
                  className="text-xs text-green-600 hover:text-green-800"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback(false)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Search Modal */}
      {showSearch && (
        <HelpSearch
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          onContentSelect={(content) => {
            setHelpContent(content);
            setShowSearch(false);
            setIsOpen(true);
          }}
        />
      )}
    </>
  );
};

export default EnhancedContextualHelp;
