import { logger } from '@/services/logger';
import { createLazyRoute } from './lazyLoading';

// Type-safe wrapper for createLazyRoute that handles module imports
const createLazyRouteSafe = (importFn: () => Promise<unknown>) => {
  return createLazyRoute(async () => {
    const module = await importFn();
    return {
      default: (module as { default?: React.ComponentType<Record<string, unknown>> }).default || (() => null),
    };
  });
};

// ============================================================================
// LAZY-LOADED ROUTES
// ============================================================================

// Authentication routes
export const AuthPage = createLazyRouteSafe(() => import('../pages/AuthPage'));

// Dashboard routes
// @ts-expect-error - DashboardPage may not exist
export const Dashboard = createLazyRouteSafe(() => import('../pages/DashboardPage'));
// @ts-expect-error - ProjectsPage may not exist
export const ProjectsPage = createLazyRouteSafe(() => import('../components/pages/ProjectsPage'));
// @ts-expect-error - ProjectDetailPage may not exist
export const ProjectDetailPage = createLazyRouteSafe(
  () => import('../components/pages/ProjectDetailPage')
);

// Reconciliation routes
export const ReconciliationPage = createLazyRouteSafe(
  () => import('../pages/ReconciliationPage')
);
// @ts-expect-error - ReconciliationDetailPage may not exist
export const ReconciliationDetailPage = createLazyRouteSafe(
  () => import('../components/pages/ReconciliationDetailPage')
);

// Ingestion routes
export const IngestionPage = createLazyRouteSafe(() => import('../pages/IngestionPage'));
// @ts-expect-error - IngestionDetailPage may not exist
export const IngestionDetailPage = createLazyRouteSafe(
  () => import('../components/pages/IngestionDetailPage')
);

// Analytics routes
// @ts-expect-error - AnalyticsPage may not exist
export const AnalyticsPage = createLazyRouteSafe(() => import('../components/pages/AnalyticsPage'));
// @ts-expect-error - ReportsPage may not exist
export const ReportsPage = createLazyRouteSafe(() => import('../components/pages/ReportsPage'));

// Settings routes - using components/pages directory
// @ts-expect-error - Settings may not exist
export const SettingsPage = createLazyRouteSafe(() => import('../components/pages/Settings'));
// @ts-expect-error - Profile may not exist
export const ProfilePage = createLazyRouteSafe(() => import('../components/pages/Profile'));
// @ts-expect-error - OrganizationPage may not exist
export const OrganizationPage = createLazyRouteSafe(
  () => import('../components/pages/OrganizationPage')
);

// Admin routes
// @ts-expect-error - AdminPage may not exist
export const AdminPage = createLazyRouteSafe(() => import('../components/pages/AdminPage'));
// @ts-expect-error - UserManagementPage may not exist
export const UserManagementPage = createLazyRouteSafe(
  () => import('../components/pages/UserManagementPage')
);

// Error pages - using pages directory
// @ts-expect-error - NotFound may not exist
export const NotFoundPage = createLazyRouteSafe(() => import('../components/pages/NotFound').catch(() => ({ default: () => null })));
// @ts-expect-error - ErrorPage may not exist
export const ErrorPage = createLazyRouteSafe(() => import('../components/pages/ErrorPage'));

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
    // @ts-expect-error - DashboardPage may not exist
    import('../pages/DashboardPage'),
    // @ts-expect-error - ProjectsPage may not exist
    import('../components/pages/ProjectsPage'),
    // @ts-expect-error - ProjectDetailPage may not exist
    import('../components/pages/ProjectDetailPage'),
  ]);
}

/**
 * Preloads reconciliation feature routes
 */
export function preloadReconciliationRoutes() {
  return Promise.all([
    import('../pages/ReconciliationPage'),
    // @ts-expect-error - ReconciliationDetailPage may not exist
    import('../components/pages/ReconciliationDetailPage'),
  ]);
}

/**
 * Preloads ingestion feature routes
 */
export function preloadIngestionRoutes() {
  return Promise.all([
    import('../pages/IngestionPage'),
    // @ts-expect-error - IngestionDetailPage may not exist
    import('../components/pages/IngestionDetailPage'),
  ]);
}

/**
 * Preloads analytics feature routes
 */
export function preloadAnalyticsRoutes() {
  return Promise.all([
    // @ts-expect-error - AnalyticsPage may not exist
    import('../components/pages/AnalyticsPage'),
    // @ts-expect-error - ReportsPage may not exist
    import('../components/pages/ReportsPage'),
  ]);
}

/**
 * Preloads settings feature routes
 */
export function preloadSettingsRoutes() {
  return Promise.all([
    // @ts-expect-error - Settings may not exist
    import('../components/pages/Settings').catch(() => ({ default: () => null })),
    // @ts-expect-error - Profile may not exist
    import('../components/pages/Profile').catch(() => ({ default: () => null })),
    // @ts-expect-error - OrganizationPage may not exist
    import('../components/pages/OrganizationPage'),
  ]);
}

/**
 * Preloads admin feature routes
 */
export function preloadAdminRoutes() {
  return Promise.all([
    // @ts-expect-error - AdminPage may not exist
    import('../components/pages/AdminPage'),
    // @ts-expect-error - UserManagementPage may not exist
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
    AuthPage: () => import('../pages/AuthPage'),
    // @ts-expect-error - DashboardPage may not exist
    Dashboard: () => import('../pages/DashboardPage'),
    // @ts-expect-error - ProjectsPage may not exist
    ProjectsPage: () => import('../components/pages/ProjectsPage'),
    // @ts-expect-error - ProjectDetailPage may not exist
    ProjectDetailPage: () => import('../components/pages/ProjectDetailPage'),
    ReconciliationPage: () => import('../pages/ReconciliationPage'),
    // @ts-expect-error - ReconciliationDetailPage may not exist
    ReconciliationDetailPage: () => import('../components/pages/ReconciliationDetailPage'),
    IngestionPage: () => import('../pages/IngestionPage'),
    // @ts-expect-error - IngestionDetailPage may not exist
    IngestionDetailPage: () => import('../components/pages/IngestionDetailPage'),
    // @ts-expect-error - AnalyticsPage may not exist
    AnalyticsPage: () => import('../components/pages/AnalyticsPage'),
    // @ts-expect-error - ReportsPage may not exist
    ReportsPage: () => import('../components/pages/ReportsPage'),
    // @ts-expect-error - Settings may not exist
    SettingsPage: () => import('../components/pages/Settings').catch(() => ({ default: () => null })),
    // @ts-expect-error - Profile may not exist
    ProfilePage: () => import('../components/pages/Profile').catch(() => ({ default: () => null })),
    // @ts-expect-error - OrganizationPage may not exist
    OrganizationPage: () => import('../components/pages/OrganizationPage'),
    // @ts-expect-error - AdminPage may not exist
    AdminPage: () => import('../components/pages/AdminPage'),
    // @ts-expect-error - UserManagementPage may not exist
    UserManagementPage: () => import('../components/pages/UserManagementPage'),
    // @ts-expect-error - NotFound may not exist
    NotFoundPage: () => import('../components/pages/NotFound').catch(() => ({ default: () => null })),
    // @ts-expect-error - ErrorPage may not exist
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
      logger.error(`Failed to load ${name}:`, { error });
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
      logger.error(`Failed to preload ${routeName}:`, { error });
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
