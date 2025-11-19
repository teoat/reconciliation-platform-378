/**
 * Helper utility for type-safe access to ariaLiveRegionsService
 * Used across multiple components to avoid `any` types
 */

import ariaLiveRegionsServiceModule from '../services/ariaLiveRegionsService';

// Type-safe access to ariaLiveRegionsService
export const getAriaLiveRegionsService = () => {
  if ('ariaLiveRegionsService' in ariaLiveRegionsServiceModule) {
    return (ariaLiveRegionsServiceModule as { ariaLiveRegionsService: typeof ariaLiveRegionsServiceModule }).ariaLiveRegionsService;
  }
  if ('default' in ariaLiveRegionsServiceModule && typeof (ariaLiveRegionsServiceModule as { default?: { getInstance?: () => unknown } }).default?.getInstance === 'function') {
    return (ariaLiveRegionsServiceModule as { default: { getInstance: () => typeof ariaLiveRegionsServiceModule } }).default.getInstance();
  }
  return ariaLiveRegionsServiceModule;
};

export const ariaLiveRegionsService = getAriaLiveRegionsService();

