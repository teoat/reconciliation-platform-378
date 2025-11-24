/**
 * Dashboard Components
 * 
 * Centralized exports for all dashboard-related components
 */

export { default as Dashboard } from '../../pages/DashboardPage';
export { Dashboard as DashboardComponent } from '../Dashboard';
export { default as AnalyticsDashboard } from '../AnalyticsDashboard';
export { default as SmartDashboard } from '../SmartDashboard';

// Re-export chart components used in dashboards
export { DashboardWidgets } from '../charts/DashboardWidgets';


