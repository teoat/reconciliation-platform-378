/**
 * Dashboard Components
 * 
 * Centralized exports for all dashboard components
 */

export { default as Dashboard } from './Dashboard';
export { default as AnalyticsDashboard } from './AnalyticsDashboard';
export { default as SmartDashboard } from './SmartDashboard';

// Re-export dashboard widgets
export * from '../charts/DashboardWidgets';
