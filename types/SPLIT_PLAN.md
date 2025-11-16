# Types Split Plan

## Current State
- types/index.ts: 2104 lines (MASSIVE!)

## Target State
Split into domain-specific files:

### 1. types/user/index.ts (~150 lines)
- User
- UserRole, Permission
- UserPreferences
- DashboardLayout

### 2. types/project/index.ts (~300 lines)
- Project
- ProjectStatus, ProjectType
- ProjectSettings
- DataRetentionPolicy
- CustomField
- ProjectData
- ProjectAnalytics
- PerformanceMetrics
- QualityMetrics
- TrendAnalysis
- PredictiveAnalytics

### 3. types/ingestion/index.ts (~400 lines)
- IngestionData
- DataQualityMetrics
- UploadedFile
- IngestionJob
- FileStatus, FileMetadata
- ProcessedData
- RecordType, RecordQuality
- DataTransformation
- TransformationTypes
- ValidationRule, ValidationResult
- DataError

### 4. types/reconciliation/index.ts (~600 lines)
- ReconciliationData
- ReconciliationRecord
- ReconciliationStatus
- ReconciliationSource
- MatchingRule, MatchingCriteria
- MatchingResult
- ReconciliationMetrics
- ReconciliationBatch
- BatchStatus, BatchMetrics
- AuditEntry, AuditAction
- RecordMetadata

### 5. types/websocket/index.ts (~200 lines)
- All WebSocket message types
- ReconciliationProgressMessage
- ConnectionStatusMessage
- etc.

### 6. types/data/index.ts (~200 lines)
- Generic data types
- DataSource
- DataMapping
- DataTransfer

### 7. types/common/index.ts (~100 lines)
- Shared utility types
- BaseTypes
- CommonEnums

### 8. New types/index.ts (~50 lines)
```typescript
// Re-export all types for backwards compatibility
export * from './user';
export * from './project';
export * from './ingestion';
export * from './reconciliation';
export * from './websocket';
export * from './data';
export * from './common';
```

## Benefits
✅ Better organization (find types easily)
✅ Faster IDE performance (smaller files)
✅ Easier maintenance (focused domains)
✅ Clearer dependencies (explicit imports)
✅ Better testability (isolated concerns)
✅ +5-8 health score points

## Execution
Manual splitting recommended to ensure:
1. No circular dependencies
2. Correct type relationships
3. Proper exports
4. All imports updated

**Estimated time**: 20-30 minutes
**Impact**: High value, low risk
