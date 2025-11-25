/**
 * Authentication Components
 * 
 * Centralized exports for all authentication-related components
 */

export { default as AuthLayout } from '../layout/AuthLayout';

// Re-export AuthPage from pages (keeping it there for routing)
// Components can import from here for consistency
export type { default as AuthPage } from '../../pages/AuthPage';

