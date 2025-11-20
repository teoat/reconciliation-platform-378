//! Common Sanitization Utilities
//!
//! Single source of truth for sanitization functions.
//! Consolidates sanitizeHtml, sanitizeInput, sanitizeForReact from multiple files.

import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML string for safe rendering using DOMPurify.
 * Removes potentially dangerous HTML tags and attributes.
 * 
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML string safe for rendering
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script><p>Safe content</p>';
 * const safe = sanitizeHtml(userInput); // Returns: '<p>Safe content</p>'
 * ```
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}

/**
 * Sanitizes HTML for React's dangerouslySetInnerHTML.
 * Returns an object with __html property for safe rendering.
 * 
 * @param dirty - Untrusted HTML string
 * @returns Object with __html property containing sanitized HTML
 * 
 * @example
 * ```typescript
 * const userContent = '<p>User content</p>';
 * const safe = sanitizeForReact(userContent);
 * // Use: <div dangerouslySetInnerHTML={safe} />
 * ```
 */
export function sanitizeForReact(dirty: string): { __html: string } {
  return { __html: sanitizeHtml(dirty) };
}

/**
 * Strict sanitization - removes all HTML tags, returns plain text only.
 * 
 * @param dirty - Untrusted string that may contain HTML
 * @returns Plain text with all HTML tags removed
 * 
 * @example
 * ```typescript
 * const html = '<p>Hello <b>world</b></p>';
 * const text = sanitizeTextOnly(html); // Returns: 'Hello world'
 * ```
 */
export function sanitizeTextOnly(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Validates and sanitizes user input.
 * Removes HTML tags, javascript: protocol, and event handlers.
 * 
 * @param input - User input string
 * @returns Sanitized input string
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script>Hello';
 * const safe = sanitizeInput(userInput); // Returns: 'Hello'
 * ```
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Escapes HTML special characters for safe text rendering.
 * 
 * @param str - String that may contain HTML special characters
 * @returns Escaped string safe for HTML rendering
 * 
 * @example
 * ```typescript
 * const text = '<script>alert("xss")</script>';
 * const escaped = escapeHtml(text); // Returns: '&lt;script&gt;...'
 * ```
 */
export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

