// Smart Filter Presets & AI Field Mapping Service
// DEPRECATED: This file has been refactored into modular structure.
// Use: import { smartFilterService } from './smartFilter'
//
// This file is kept only for backward compatibility and will be removed in v2.0.0
// All functionality has been moved to ./smartFilter module

import { smartFilterService as service } from './smartFilter'

/**
 * @deprecated Use `import { smartFilterService } from './smartFilter'` instead
 * This export will be removed in v2.0.0
 */
export { service as default, service as smartFilterService }

/**
 * @deprecated Use `import { ... } from './smartFilter'` instead
 * This export will be removed in v2.0.0
 */
export * from './smartFilter'
