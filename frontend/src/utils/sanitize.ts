/**
 * HTML sanitization utilities using DOMPurify
 * Protects against XSS attacks
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string for safe rendering
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

/**
 * Sanitize for React dangerouslySetInnerHTML
 * @param dirty - Untrusted HTML string
 * @returns Object with __html property
 */
export const sanitizeForReact = (dirty: string) => {
  return { __html: sanitizeHtml(dirty) };
};

/**
 * Strict sanitization - text only, no HTML
 * @param dirty - Untrusted string
 * @returns Plain text only
 */
export const sanitizeTextOnly = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};
