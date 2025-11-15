# Console Usage Replacement Guide

**Date**: 2025-10-31  
**Purpose**: Replace console usage with logger utility

## ✅ Logger Utility

**Location**: `frontend/src/services/logger.ts`

**Features**:
- Structured logging with levels
- Environment-aware (only logs errors in production)
- Multiple destinations (console, external services)
- Context support

## 🔄 Migration Pattern

### Before (Console)
```typescript
console.log('User logged in', userId);
console.error('Failed to load data', error);
console.warn('API rate limit approaching');
```

### After (Logger)
```typescript
import { logger } from '@/services/logger';

logger.info('User logged in', { userId });
logger.error('Failed to load data', { error });
logger.warn('API rate limit approaching');
```

## 📋 Files to Update

### High Priority
1. `frontend/src/pages/ProjectPage.tsx`
2. `frontend/src/components/monitoring/PerformanceDashboard.tsx`
3. Any API client files
4. Any service files

### Lower Priority
- Test files (can keep console for debugging)
- Build scripts
- Utility scripts

## 🎯 Replacement Examples

### Example 1: Simple Log
```typescript
// Before
console.log('Processing file', filename);

// After
logger.info('Processing file', { filename });
```

### Example 2: Error Logging
```typescript
// Before
console.error('API call failed', error);

// After
logger.error('API call failed', { error, endpoint });
```

### Example 3: Warning
```typescript
// Before
console.warn('Deprecated API used');

// After
logger.warn('Deprecated API used', { 
  deprecatedEndpoint,
  recommendedEndpoint 
});
```

### Example 4: Debug (Development Only)
```typescript
// Before
console.log('Debug info', data);

// After
if (process.env.NODE_ENV === 'development') {
  logger.debug('Debug info', { data });
}
```

## 📊 Progress Tracking

**Total console instances**: 53  
**Replaced**: 0  
**Remaining**: 53

**Target**: <10 instances (only in tests or build scripts)

## 🔧 ESLint Rule

Added ESLint rule to prevent new console usage:
- File: `frontend/.eslintrc.security.js`
- Rule: `'no-console': ['warn', { allow: ['warn', 'error'] }]`

