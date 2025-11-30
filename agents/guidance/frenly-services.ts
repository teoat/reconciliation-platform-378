/**
 * Frenly Guidance Agent - Service Integration
 */

// import { logger } from '../../frontend/src/services/logger'; // Unused

// Import services for integration
let helpContentService: any = null;
let onboardingService: any = null;
let aiService: any = null;
let nluService: any = null;
let mcpIntegrationService: any = null;

// Lazy load services to avoid circular dependencies
export const getHelpContentService = async () => {
  if (!helpContentService) {
    const module = await import('../../frontend/src/services/helpContentService');
    helpContentService = module.helpContentService;
  }
  return helpContentService;
};

export const getOnboardingService = async () => {
  if (!onboardingService) {
    const module = await import('../../frontend/src/services/onboardingService');
    onboardingService = module.onboardingService;
  }
  return onboardingService;
};

export const getAIService = async () => {
  if (!aiService) {
    const module = await import('../../frontend/src/services/aiService');
    aiService = module.aiService;
  }
  return aiService;
};

export const getNLUService = async () => {
  if (!nluService) {
    const module = await import('../../frontend/src/services/nluService');
    nluService = module.nluService;
  }
  return nluService;
};

export const getMCPIntegrationService = async () => {
  if (!mcpIntegrationService) {
    const module = await import('../../frontend/src/services/mcpIntegrationService');
    mcpIntegrationService = module.mcpIntegrationService;
  }
  return mcpIntegrationService;
};
