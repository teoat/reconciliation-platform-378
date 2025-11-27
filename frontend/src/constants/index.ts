/**
 * Constants Index
 * 
 * Single Source of Truth (SSOT) for all application constants
 * Re-exports all constants from domain-specific modules
 * 
 * Refactored from 856 lines to ~50 lines (94% reduction)
 */

// Application Constants
export { APP_CONFIG } from './app';

// API Endpoints
export { API_ENDPOINTS } from './api';

// Routes
export { ROUTES } from './routes';

// HTTP Status & Error Codes
export { HTTP_STATUS, ERROR_CODES } from './http';

// UI Configuration
export { UI_CONFIG, CHART_CONFIG } from './ui';

// Validation
export { VALIDATION_RULES, REGEX_PATTERNS } from './validation';

// Formats
export { FILE_TYPES, DATE_FORMATS, CURRENCY_FORMATS } from './formats';
