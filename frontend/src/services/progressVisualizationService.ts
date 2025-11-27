/**
 * @deprecated This file has been refactored. Import from '@/services/visualization/ProgressVisualizationService' instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Re-export from new location
export {
  default as ProgressVisualizationService,
  useProgressVisualization,
  progressVisualizationService,
} from './visualization/ProgressVisualizationService';

export type {
  WorkflowStage,
  StageRequirement,
  StageHelp,
  StageValidation,
  ValidationRule,
  ProgressAnimation,
  ContextualHelp,
  WorkflowGuidance,
} from './visualization/types';

// Legacy default export for backward compatibility
import ProgressVisualizationService from './visualization/ProgressVisualizationService';
export default ProgressVisualizationService;
