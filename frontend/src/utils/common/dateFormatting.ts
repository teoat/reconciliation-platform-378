//! Common Date Formatting Utilities
//!
//! Single source of truth for date formatting functions.
//! Consolidates duplicate "time ago" formatters from various components.

/**
 * Format a date/timestamp as a relative "time ago" string.
 * Examples: "Just now", "5m ago", "2h ago", "3d ago"
 *
 * @param date - Date object, timestamp string, or timestamp number
 * @param options - Formatting options
 * @returns Formatted "time ago" string
 *
 * @example
 * ```typescript
 * formatTimeAgo(new Date()); // "Just now"
 * formatTimeAgo(Date.now() - 300000); // "5m ago"
 * formatTimeAgo("2025-01-15T10:00:00Z"); // "2h ago"
 * ```
 */
export function formatTimeAgo(
  date: Date | string | number,
  options?: {
    /** Show "Just now" for times less than this many seconds (default: 60) */
    justNowThreshold?: number;
    /** Show full date for times older than this many days (default: 7) */
    fullDateThreshold?: number;
    /** Whether to show full date format when threshold is exceeded (default: true) */
    showFullDate?: boolean;
  }
): string {
  const now = new Date();
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const {
    justNowThreshold = 60,
    fullDateThreshold = 7,
    showFullDate = true,
  } = options || {};

  if (diffSeconds < justNowThreshold) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffDays < fullDateThreshold) {
    return `${diffDays}d ago`;
  }

  if (showFullDate) {
    return dateObj.toLocaleDateString();
  }

  return `${diffDays}d ago`;
}

/**
 * Format a timestamp for display (shorter version of formatTimeAgo).
 * Used in components like CollaborationPanel for "last seen" formatting.
 *
 * @param timestamp - Timestamp string or number
 * @returns Formatted timestamp string
 *
 * @example
 * ```typescript
 * formatTimestamp("2025-01-15T10:00:00Z"); // "5m ago" or date string
 * ```
 */
export function formatTimestamp(timestamp: string | number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

/**
 * Format a date as a simple time string (HH:mm format).
 *
 * @param date - Date object, timestamp string, or timestamp number
 * @returns Formatted time string (HH:mm)
 *
 * @example
 * ```typescript
 * formatTime(new Date()); // "14:30"
 * ```
 */
export function formatTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid time';
  }

  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format a date with a custom format string.
 * Supports: DD, MM, YYYY, HH, mm, ss
 *
 * @param date - Date object, timestamp string, or timestamp number
 * @param format - Format string (default: 'DD/MM/YYYY')
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate(new Date(), 'DD/MM/YYYY'); // "15/01/2025"
 * formatDate(new Date(), 'YYYY-MM-DD'); // "2025-01-15"
 * formatDate(new Date(), 'DD/MM/YYYY HH:mm'); // "15/01/2025 14:30"
 * ```
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  format: string = 'DD/MM/YYYY'
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year.toString())
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

