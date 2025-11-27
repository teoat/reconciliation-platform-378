/**
 * Route Preloader
 * 
 * Preloads routes on hover/focus to improve perceived performance
 * Reduces load times by starting downloads before user clicks
 */

import { logger } from '@/services/logger';

interface RoutePreloader {
  preload: (route: string) => Promise<void>;
  preloadOnHover: (element: HTMLElement, route: string) => void;
  preloadOnFocus: (element: HTMLElement, route: string) => void;
  isPreloaded: (route: string) => boolean;
  clearCache: () => void;
}

class RoutePreloaderImpl implements RoutePreloader {
  private preloadedRoutes = new Set<string>();
  private preloadingRoutes = new Set<string>();

  /**
   * Preload a route by dynamically importing it
   */
  async preload(route: string): Promise<void> {
    // Skip if already preloaded or currently preloading
    if (this.preloadedRoutes.has(route) || this.preloadingRoutes.has(route)) {
      return;
    }

    this.preloadingRoutes.add(route);

    try {
      // Map route names to their import paths
      const routeMap: Record<string, () => Promise<unknown>> = {
        dashboard: () => import('../components/dashboard/Dashboard'),
        reconciliation: () => import('../pages/ReconciliationPage'),
        'quick-reconciliation': () => import('../pages/QuickReconciliationWizard'),
        analytics: () => import('../components/dashboard/AnalyticsDashboard'),
        users: () => import('../components/UserManagement'),
        'api-status': () => import('../components/api/ApiIntegrationStatus'),
        'api-tester': () => import('../components/api/ApiTester'),
        'api-docs': () => import('../components/api/ApiDocumentation'),
        projects: () => import('../components/pages/ProjectsPage'),
        'project-create': () => import('../components/pages/ProjectCreate'),
        'project-detail': () => import('../components/pages/ProjectDetail'),
        'project-edit': () => import('../components/pages/ProjectEdit'),
        'file-upload': () => import('../components/pages/FileUpload'),
        settings: () => import('../components/pages/Settings'),
        profile: () => import('../components/pages/Profile'),
        ingestion: () => import('../pages/IngestionPage'),
        adjudication: () => import('../pages/AdjudicationPage'),
        visualization: () => import('../pages/VisualizationPage'),
        summary: () => import('../pages/SummaryPage'),
        security: () => import('../pages/SecurityPage'),
        'cashflow-evaluation': () => import('../pages/CashflowEvaluationPage'),
        presummary: () => import('../pages/PresummaryPage'),
      };

      const importFn = routeMap[route];
      if (!importFn) {
        logger.warn(`Route preloader: Unknown route "${route}"`);
        return;
      }

      // Preload the route
      await importFn();
      this.preloadedRoutes.add(route);
      logger.debug(`Route preloaded: ${route}`);
    } catch (error) {
      logger.error(`Failed to preload route "${route}":`, error);
    } finally {
      this.preloadingRoutes.delete(route);
    }
  }

  /**
   * Preload route when element is hovered
   */
  preloadOnHover(element: HTMLElement, route: string): void {
    const handleMouseEnter = () => {
      this.preload(route);
      element.removeEventListener('mouseenter', handleMouseEnter);
    };

    element.addEventListener('mouseenter', handleMouseEnter, { once: true });
  }

  /**
   * Preload route when element receives focus
   */
  preloadOnFocus(element: HTMLElement, route: string): void {
    const handleFocus = () => {
      this.preload(route);
      element.removeEventListener('focus', handleFocus);
    };

    element.addEventListener('focus', handleFocus, { once: true });
  }

  /**
   * Check if a route is already preloaded
   */
  isPreloaded(route: string): boolean {
    return this.preloadedRoutes.has(route);
  }

  /**
   * Clear preloaded routes cache
   */
  clearCache(): void {
    this.preloadedRoutes.clear();
    this.preloadingRoutes.clear();
  }
}

// Singleton instance
let routePreloaderInstance: RoutePreloader | null = null;

/**
 * Get the route preloader instance
 */
export function getRoutePreloader(): RoutePreloader {
  if (!routePreloaderInstance) {
    routePreloaderInstance = new RoutePreloaderImpl();
  }
  return routePreloaderInstance;
}

/**
 * Preload route on link hover/focus
 * Use this hook in navigation components
 */
export function useRoutePreloader() {
  const preloader = getRoutePreloader();

  return {
    preload: preloader.preload.bind(preloader),
    preloadOnHover: (element: HTMLElement | null, route: string) => {
      if (element) {
        preloader.preloadOnHover(element, route);
      }
    },
    preloadOnFocus: (element: HTMLElement | null, route: string) => {
      if (element) {
        preloader.preloadOnFocus(element, route);
      }
    },
    isPreloaded: preloader.isPreloaded.bind(preloader),
  };
}

/**
 * Preload critical routes on app initialization
 */
export async function preloadCriticalRoutes(): Promise<void> {
  const preloader = getRoutePreloader();
  
  // Preload most commonly accessed routes
  const criticalRoutes = ['dashboard', 'projects', 'settings', 'profile'];
  
  await Promise.all(
    criticalRoutes.map((route) => preloader.preload(route))
  );
  
  logger.info('Critical routes preloaded');
}

