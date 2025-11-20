import { lazy } from 'react';
import { logger } from '@/services/logger';
import { createLazyRoute } from './lazyLoading';

// ============================================================================
// LAZY-LOADED ROUTES
// ============================================================================

// Authentication routes
export const AuthPage = createLazyRoute(() => import('../components/pages/AuthPage'));

// Dashboard routes
export const Dashboard = createLazyRoute(() => import('../components/pages/Dashboard'));
export const ProjectsPage = createLazyRoute(() => import('../components/pages/ProjectsPage'));
export const ProjectDetailPage = createLazyRoute(
  () => import('../components/pages/ProjectDetailPage')
);

// Reconciliation routes
export const ReconciliationPage = createLazyRoute(
  () => import('../components/pages/ReconciliationPage')
);
export const ReconciliationDetailPage = createLazyRoute(
  () => import('../components/pages/ReconciliationDetailPage')
);

// Ingestion routes
export const IngestionPage = createLazyRoute(() => import('../components/pages/IngestionPage'));
export const IngestionDetailPage = createLazyRoute(
  () => import('../components/pages/IngestionDetailPage')
);

// Analytics routes
export const AnalyticsPage = createLazyRoute(() => import('../components/pages/AnalyticsPage'));
export const ReportsPage = createLazyRoute(() => import('../components/pages/ReportsPage'));

// Settings routes
export const SettingsPage = createLazyRoute(() => import('../components/pages/SettingsPage'));
export const ProfilePage = createLazyRoute(() => import('../components/pages/ProfilePage'));
export const OrganizationPage = createLazyRoute(
  () => import('../components/pages/OrganizationPage')
);

// Admin routes
export const AdminPage = createLazyRoute(() => import('../components/pages/AdminPage'));
export const UserManagementPage = createLazyRoute(
  () => import('../components/pages/UserManagementPage')
);

// Error pages
export const NotFoundPage = createLazyRoute(() => import('../components/pages/NotFoundPage'));
export const ErrorPage = createLazyRoute(() => import('../components/pages/ErrorPage'));

// ============================================================================
// ROUTE GROUPS FOR OPTIMIZATION
// ============================================================================

// Core application routes (loaded together)
export const coreRoutes = {
  Dashboard,
  ProjectsPage,
  ProjectDetailPage,
};

// Reconciliation feature routes
export const reconciliationRoutes = {
  ReconciliationPage,
  ReconciliationDetailPage,
};

// Ingestion feature routes
export const ingestionRoutes = {
  IngestionPage,
  IngestionDetailPage,
};

// Analytics feature routes
export const analyticsRoutes = {
  AnalyticsPage,
  ReportsPage,
};

// Settings feature routes
export const settingsRoutes = {
  SettingsPage,
  ProfilePage,
  OrganizationPage,
};

// Admin feature routes
export const adminRoutes = {
  AdminPage,
  UserManagementPage,
};

// Error routes
export const errorRoutes = {
  NotFoundPage,
  ErrorPage,
};

// ============================================================================
// ROUTE PRELOADING STRATEGIES
// ============================================================================

/**
 * Preloads core application routes
 */
export function preloadCoreRoutes() {
  return Promise.all([
    import('../components/pages/Dashboard'),
    import('../components/pages/ProjectsPage'),
    import('../components/pages/ProjectDetailPage'),
  ]);
}

/**
 * Preloads reconciliation feature routes
 */
export function preloadReconciliationRoutes() {
  return Promise.all([
    import('../components/pages/ReconciliationPage'),
    import('../components/pages/ReconciliationDetailPage'),
  ]);
}

/**
 * Preloads ingestion feature routes
 */
export function preloadIngestionRoutes() {
  return Promise.all([
    import('../components/pages/IngestionPage'),
    import('../components/pages/IngestionDetailPage'),
  ]);
}

/**
 * Preloads analytics feature routes
 */
export function preloadAnalyticsRoutes() {
  return Promise.all([
    import('../components/pages/AnalyticsPage'),
    import('../components/pages/ReportsPage'),
  ]);
}

/**
 * Preloads settings feature routes
 */
export function preloadSettingsRoutes() {
  return Promise.all([
    import('../components/pages/SettingsPage'),
    import('../components/pages/ProfilePage'),
    import('../components/pages/OrganizationPage'),
  ]);
}

/**
 * Preloads admin feature routes
 */
export function preloadAdminRoutes() {
  return Promise.all([
    import('../components/pages/AdminPage'),
    import('../components/pages/UserManagementPage'),
  ]);
}

// ============================================================================
// ROUTE BUNDLE ANALYSIS
// ============================================================================

/**
 * Analyzes route bundle sizes
 */
export async function analyzeRouteBundles() {
  const routes = {
    AuthPage: () => import('../components/pages/AuthPage'),
    Dashboard: () => import('../components/pages/Dashboard'),
    ProjectsPage: () => import('../components/pages/ProjectsPage'),
    ProjectDetailPage: () => import('../components/pages/ProjectDetailPage'),
    ReconciliationPage: () => import('../components/pages/ReconciliationPage'),
    ReconciliationDetailPage: () => import('../components/pages/ReconciliationDetailPage'),
    IngestionPage: () => import('../components/pages/IngestionPage'),
    IngestionDetailPage: () => import('../components/pages/IngestionDetailPage'),
    AnalyticsPage: () => import('../components/pages/AnalyticsPage'),
    ReportsPage: () => import('../components/pages/ReportsPage'),
    SettingsPage: () => import('../components/pages/SettingsPage'),
    ProfilePage: () => import('../components/pages/ProfilePage'),
    OrganizationPage: () => import('../components/pages/OrganizationPage'),
    AdminPage: () => import('../components/pages/AdminPage'),
    UserManagementPage: () => import('../components/pages/UserManagementPage'),
    NotFoundPage: () => import('../components/pages/NotFoundPage'),
    ErrorPage: () => import('../components/pages/ErrorPage'),
  };

  const results: Record<string, number> = {};

  for (const [name, importFn] of Object.entries(routes)) {
    try {
      const startTime = performance.now();
      await importFn();
      const endTime = performance.now();
      results[name] = endTime - startTime;
    } catch (error) {
      logger.error(`Failed to load ${name}:`, error);
      results[name] = -1;
    }
  }

  return results;
}

// ============================================================================
// SMART ROUTE LOADING
// ============================================================================

/**
 * Creates a smart route loader that preloads related routes
 */
export function createSmartRouteLoader() {
  const loadedRoutes = new Set<string>();
  const preloadQueue = new Set<string>();

  const preloadRoute = async (routeName: string) => {
    if (loadedRoutes.has(routeName) || preloadQueue.has(routeName)) {
      return;
    }

    preloadQueue.add(routeName);

    try {
      // Preload the route
      switch (routeName) {
        case 'Dashboard':
          await preloadCoreRoutes();
          break;
        case 'ReconciliationPage':
          await preloadReconciliationRoutes();
          break;
        case 'IngestionPage':
          await preloadIngestionRoutes();
          break;
        case 'AnalyticsPage':
          await preloadAnalyticsRoutes();
          break;
        case 'SettingsPage':
          await preloadSettingsRoutes();
          break;
        case 'AdminPage':
          await preloadAdminRoutes();
          break;
      }

      loadedRoutes.add(routeName);
    } catch (error) {
      logger.error(`Failed to preload ${routeName}:`, error);
    } finally {
      preloadQueue.delete(routeName);
    }
  };

  const preloadOnHover = (routeName: string) => {
    return () => preloadRoute(routeName);
  };

  const preloadOnFocus = (routeName: string) => {
    return () => preloadRoute(routeName);
  };

  return {
    preloadRoute,
    preloadOnHover,
    preloadOnFocus,
    getLoadedRoutes: () => Array.from(loadedRoutes),
    isRouteLoaded: (routeName: string) => loadedRoutes.has(routeName),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Individual routes
  AuthPage,
  Dashboard,
  ProjectsPage,
  ProjectDetailPage,
  ReconciliationPage,
  ReconciliationDetailPage,
  IngestionPage,
  IngestionDetailPage,
  AnalyticsPage,
  ReportsPage,
  SettingsPage,
  ProfilePage,
  OrganizationPage,
  AdminPage,
  UserManagementPage,
  NotFoundPage,
  ErrorPage,

  // Route groups
  coreRoutes,
  reconciliationRoutes,
  ingestionRoutes,
  analyticsRoutes,
  settingsRoutes,
  adminRoutes,
  errorRoutes,

  // Preloading functions
  preloadCoreRoutes,
  preloadReconciliationRoutes,
  preloadIngestionRoutes,
  preloadAnalyticsRoutes,
  preloadSettingsRoutes,
  preloadAdminRoutes,

  // Utilities
  analyzeRouteBundles,
  createSmartRouteLoader,
};
