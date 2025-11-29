# SQL Data Synchronization Guide

**Last Updated**: January 2025  
**Status**: Active

## Overview

The SQL Data Synchronization system provides systematic integration and optimized synchronization of SQL data and tables. It supports full sync, incremental sync, conflict resolution, and multi-table orchestration.

## Features

- **Full Sync**: Replace all data in target table from source
- **Incremental Sync**: Only sync changed records using change tracking
- **Merge Sync**: Merge source and target data with conflict resolution
- **Conflict Resolution**: Multiple strategies (source wins, target wins, timestamp-based, manual)
- **Batch Processing**: Configurable batch sizes for efficient large-scale syncs
- **Scheduled Syncs**: Automatic synchronization on configurable intervals
- **Multi-Table Orchestration**: Coordinate multiple sync operations in sequence or parallel
- **Change Tracking**: Track changes to enable incremental syncs
- **Monitoring**: Track sync executions, statistics, and conflicts

## Architecture

### Components

1. **SyncService** (`backend/src/services/sync/core.rs`)
   - Core synchronization logic
   - Handles table-to-table sync operations
   - Supports full, incremental, and merge sync strategies

2. **SyncOrchestrator** (`backend/src/services/sync/orchestration.rs`)
   - Orchestrates multiple sync operations
   - Manages scheduled syncs
   - Coordinates parallel and sequential syncs

3. **ConflictResolver** (`backend/src/services/sync/conflict_resolution.rs`)
   - Detects and resolves conflicts
   - Supports multiple resolution strategies

4. **ChangeTracker** (`backend/src/services/sync/change_tracking.rs`)
   - Tracks changes to source tables
   - Enables incremental synchronization

### Database Schema

The sync system uses the following tables:

- `sync_configurations`: Sync configuration definitions
- `sync_executions`: Execution history and statistics
- `sync_change_tracking`: Change tracking for incremental syncs
- `sync_conflicts`: Conflict records requiring resolution

See migration: `backend/migrations/20250129000000_create_sync_metadata/up.sql`

## Usage

### Creating a Sync Configuration

```rust
use crate::services::sync::models::*;

let config = SyncConfiguration {
    name: "users_sync".to_string(),
    source_table: "users_source".to_string(),
    target_table: "users_target".to_string(),
    sync_strategy: SyncStrategy::Incremental,
    conflict_resolution: ConflictResolutionStrategy::Timestamp,
    batch_size: 1000,
    sync_interval_seconds: Some(3600), // 1 hour
    enabled: true,
    // ... other fields
};
```

### Executing a Sync

```rust
use crate::services::sync::SyncOrchestrator;

let orchestrator = SyncOrchestrator::new(db.clone());
let execution = orchestrator.execute_sync(config_id).await?;
```

### API Endpoints

#### Create Sync Configuration
```
POST /api/v1/sync/sql-sync/configurations
Content-Type: application/json

{
  "name": "users_sync",
  "source_table": "users_source",
  "target_table": "users_target",
  "sync_strategy": "incremental",
  "conflict_resolution": "timestamp",
  "batch_size": 1000,
  "sync_interval_seconds": 3600,
  "enabled": true
}
```

#### Execute Sync
```
POST /api/v1/sync/sql-sync/configurations/{id}/execute
```

#### List Sync Configurations
```
GET /api/v1/sync/sql-sync/configurations
```

#### Get Sync Execution
```
GET /api/v1/sync/sql-sync/executions/{id}
```

#### List Sync Conflicts
```
GET /api/v1/sync/sql-sync/conflicts
```

#### Resolve Conflict
```
POST /api/v1/sync/sql-sync/conflicts/{id}/resolve
```

## Sync Strategies

### Full Sync
- Replaces all data in target table
- Optionally truncates target table before sync
- Best for initial sync or complete data refresh

### Incremental Sync
- Only syncs changed records
- Uses change tracking to identify modifications
- Efficient for large tables with infrequent changes

### Merge Sync
- Merges source and target data
- Resolves conflicts using configured strategy
- Best for bi-directional sync scenarios

## Conflict Resolution

### Source Wins
- Source data always overwrites target
- Simple and fast
- May lose target modifications

### Target Wins
- Target data is preserved
- Source changes are ignored
- Useful for read-only targets

### Timestamp-Based
- Compares `updated_at` timestamps
- Newer data wins
- Requires timestamp columns

### Manual
- Conflicts are flagged for manual review
- Requires human intervention
- Most accurate but slower

## Best Practices

1. **Batch Size**: Use appropriate batch sizes (500-5000) based on record size and network latency
2. **Sync Frequency**: Balance freshness with performance (hourly/daily for most use cases)
3. **Conflict Resolution**: Choose strategy based on data criticality and update patterns
4. **Monitoring**: Regularly review sync executions and resolve conflicts promptly
5. **Testing**: Test sync configurations with sample data before production use
6. **Backup**: Always backup target tables before full syncs

## Performance Optimization

- Use incremental sync for large tables
- Configure appropriate batch sizes
- Schedule syncs during low-traffic periods
- Monitor sync execution times and adjust intervals
- Use indexes on sync key columns
- Consider parallel syncs for independent tables

## Troubleshooting

### Sync Fails with Connection Error
- Verify database URLs are correct
- Check network connectivity
- Ensure database credentials are valid

### High Conflict Rate
- Review conflict resolution strategy
- Check for concurrent updates
- Consider adjusting sync frequency

### Slow Sync Performance
- Reduce batch size
- Add indexes on sync key columns
- Use incremental sync instead of full sync
- Check network latency between databases

## Related Documentation

- [Database Migration Guide](../operations/DATABASE_MIGRATION_GUIDE.md)
- [Database Index Discovery](../diagnostics/DATABASE_INDEX_DISCOVERY.md)
- [Performance Optimization](../architecture/PERFORMANCE_OPTIMIZATION.md)

