# Database Performance Optimization

## Overview

This guide covers database performance optimization strategies for the Reconciliation Platform, including query optimization, indexing, caching with Redis, and best practices.

## Table of Contents

1. [Query Optimization](#query-optimization)
2. [Indexing Strategy](#indexing-strategy)
3. [Redis Caching](#redis-caching)
4. [Connection Pooling](#connection-pooling)
5. [Performance Monitoring](#performance-monitoring)
6. [Migrations](#migrations)

## Query Optimization

### Query Analyzer

Use PostgreSQL's `EXPLAIN ANALYZE` to understand query performance:

```sql
EXPLAIN ANALYZE 
SELECT r.*, p.name as project_name
FROM reconciliations r
JOIN projects p ON r.project_id = p.id
WHERE r.status = 'pending'
AND r.created_at > NOW() - INTERVAL '7 days'
ORDER BY r.created_at DESC
LIMIT 100;
```

### Query Optimization Tips

1. **Use appropriate joins:**
```sql
-- Bad: Implicit join with WHERE
SELECT * FROM orders, customers WHERE orders.customer_id = customers.id;

-- Good: Explicit JOIN
SELECT * FROM orders
INNER JOIN customers ON orders.customer_id = customers.id;
```

2. **Avoid SELECT *:**
```sql
-- Bad
SELECT * FROM reconciliations WHERE status = 'pending';

-- Good
SELECT id, reference, amount, status, created_at 
FROM reconciliations WHERE status = 'pending';
```

3. **Use EXISTS instead of IN for large sets:**
```sql
-- Bad
SELECT * FROM reconciliations 
WHERE project_id IN (SELECT id FROM projects WHERE archived = false);

-- Good
SELECT r.* FROM reconciliations r
WHERE EXISTS (SELECT 1 FROM projects p WHERE p.id = r.project_id AND p.archived = false);
```

4. **Batch operations:**
```sql
-- Bad: Multiple single inserts
INSERT INTO audit_logs (action, user_id) VALUES ('login', 1);
INSERT INTO audit_logs (action, user_id) VALUES ('view', 1);

-- Good: Batch insert
INSERT INTO audit_logs (action, user_id) VALUES 
  ('login', 1),
  ('view', 1),
  ('update', 1);
```

## Indexing Strategy

### Index Types

```sql
-- B-tree index (default, good for equality and range queries)
CREATE INDEX idx_reconciliations_status ON reconciliations(status);

-- Partial index (only index relevant rows)
CREATE INDEX idx_reconciliations_pending ON reconciliations(created_at)
WHERE status = 'pending';

-- Composite index (for multi-column queries)
CREATE INDEX idx_reconciliations_project_status ON reconciliations(project_id, status);

-- Covering index (includes all columns needed for query)
CREATE INDEX idx_reconciliations_covering ON reconciliations(status, created_at)
INCLUDE (reference, amount);

-- GIN index (for JSONB and full-text search)
CREATE INDEX idx_reconciliations_metadata ON reconciliations USING GIN(metadata);

-- BRIN index (for large sequential data)
CREATE INDEX idx_audit_logs_created ON audit_logs USING BRIN(created_at);
```

### Recommended Indexes

```sql
-- Performance indexes for reconciliation queries
CREATE INDEX CONCURRENTLY idx_reconciliations_project_id ON reconciliations(project_id);
CREATE INDEX CONCURRENTLY idx_reconciliations_status ON reconciliations(status);
CREATE INDEX CONCURRENTLY idx_reconciliations_created_at ON reconciliations(created_at DESC);
CREATE INDEX CONCURRENTLY idx_reconciliations_status_created ON reconciliations(status, created_at DESC);

-- Foreign key indexes
CREATE INDEX CONCURRENTLY idx_reconciliation_items_reconciliation_id 
ON reconciliation_items(reconciliation_id);

-- User lookup indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_org_id ON users(organization_id);

-- Audit log indexes
CREATE INDEX CONCURRENTLY idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY idx_audit_logs_created ON audit_logs(created_at DESC);
```

### Index Maintenance

```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT 
  schemaname || '.' || tablename as table,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname NOT LIKE '%_pkey';

-- Reindex bloated indexes
REINDEX INDEX CONCURRENTLY idx_reconciliations_status;
```

## Redis Caching

### Caching Strategy

```rust
// Redis cache configuration
pub struct CacheConfig {
    pub default_ttl: u64,       // Default TTL in seconds
    pub max_connections: u32,   // Connection pool size
    pub connection_timeout: u64, // Timeout in ms
}

// Cache patterns
pub enum CachePattern {
    CacheAside,      // Read from cache, fallback to DB
    WriteThrough,    // Write to cache and DB simultaneously
    WriteBack,       // Write to cache, async write to DB
    ReadThrough,     // Read from cache, auto-populate from DB
}
```

### Implementation

```rust
use redis::AsyncCommands;

pub struct ReconciliationCache {
    redis: redis::Client,
    ttl: u64,
}

impl ReconciliationCache {
    // Cache-aside pattern implementation
    pub async fn get_reconciliation(&self, id: &str) -> Result<Option<Reconciliation>> {
        let mut conn = self.redis.get_async_connection().await?;
        
        // Try cache first
        let cached: Option<String> = conn.get(format!("recon:{}", id)).await?;
        
        if let Some(data) = cached {
            return Ok(Some(serde_json::from_str(&data)?));
        }
        
        // Cache miss - fetch from database
        let recon = self.db.get_reconciliation(id).await?;
        
        if let Some(ref r) = recon {
            // Populate cache
            let _: () = conn.set_ex(
                format!("recon:{}", id),
                serde_json::to_string(r)?,
                self.ttl
            ).await?;
        }
        
        Ok(recon)
    }
    
    // Invalidate cache on update
    pub async fn invalidate(&self, id: &str) -> Result<()> {
        let mut conn = self.redis.get_async_connection().await?;
        let _: () = conn.del(format!("recon:{}", id)).await?;
        Ok(())
    }
}
```

### Cache Keys Convention

```
# Reconciliation data
recon:{id}                    # Single reconciliation
recon:list:project:{id}       # List by project
recon:count:status:{status}   # Count by status

# User data
user:{id}                     # User profile
user:session:{token}          # Session data
user:permissions:{id}         # User permissions

# Configuration
config:rules:{id}             # Rule configuration
config:settings               # System settings

# Rate limiting
ratelimit:{ip}:{endpoint}     # API rate limiting
```

### Cache Invalidation

```rust
// Invalidation strategies
pub async fn on_reconciliation_update(&self, id: &str) -> Result<()> {
    let mut conn = self.redis.get_async_connection().await?;
    
    // Delete specific cache
    let _: () = conn.del(format!("recon:{}", id)).await?;
    
    // Invalidate related list caches
    let pattern = format!("recon:list:*");
    let keys: Vec<String> = conn.keys(&pattern).await?;
    if !keys.is_empty() {
        let _: () = conn.del(keys).await?;
    }
    
    Ok(())
}
```

## Connection Pooling

### Configuration

```rust
// Database connection pool
use sqlx::postgres::{PgPoolOptions, PgPool};

pub async fn create_pool(database_url: &str) -> Result<PgPool> {
    PgPoolOptions::new()
        .max_connections(20)           // Maximum pool size
        .min_connections(5)            // Minimum maintained connections
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .connect(database_url)
        .await
}

// Redis connection pool
use deadpool_redis::{Pool, Runtime};

pub async fn create_redis_pool(redis_url: &str) -> Result<Pool> {
    let cfg = deadpool_redis::Config::from_url(redis_url);
    cfg.create_pool(Some(Runtime::Tokio1))
}
```

### Best Practices

1. **Size pool appropriately:**
   - Too small: Connection starvation
   - Too large: Resource waste, DB overload
   - Rule of thumb: `connections = (CPU cores * 2) + disk spindles`

2. **Monitor pool health:**
```rust
// Expose pool metrics
pub async fn pool_stats(pool: &PgPool) -> PoolStats {
    PoolStats {
        size: pool.size(),
        idle: pool.num_idle(),
        active: pool.size() - pool.num_idle(),
    }
}
```

## Performance Monitoring

### Key Metrics

```sql
-- Slow queries
SELECT 
  query,
  calls,
  mean_time,
  max_time,
  total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Table statistics
SELECT 
  relname,
  seq_scan,
  idx_scan,
  n_live_tup,
  n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Cache hit ratio
SELECT 
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
FROM pg_statio_user_tables;
```

### Prometheus Metrics

```rust
// Database metrics exporter
pub struct DbMetrics {
    query_duration: Histogram,
    query_count: Counter,
    connection_pool_size: Gauge,
    cache_hit_ratio: Gauge,
}

impl DbMetrics {
    pub fn record_query(&self, duration: f64, query_type: &str) {
        self.query_duration
            .with_label_values(&[query_type])
            .observe(duration);
        self.query_count
            .with_label_values(&[query_type])
            .inc();
    }
}
```

## Migrations

### Flyway Migrations

```bash
# Run migrations
flyway -configFiles=config/migrations/flyway.conf migrate

# Check status
flyway -configFiles=config/migrations/flyway.conf info

# Rollback last migration
flyway -configFiles=config/migrations/flyway.conf undo
```

### Migration Best Practices

1. **Make migrations reversible:**
```sql
-- V1__add_status_column.sql
ALTER TABLE reconciliations ADD COLUMN new_status VARCHAR(50);

-- U1__add_status_column.sql (undo)
ALTER TABLE reconciliations DROP COLUMN new_status;
```

2. **Use CONCURRENTLY for indexes:**
```sql
-- Avoid locking tables
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

3. **Test in isolated environments:**
```bash
# Create test database
createdb reconciliation_migration_test

# Run migrations
flyway -url=jdbc:postgresql://localhost/reconciliation_migration_test migrate

# Validate
flyway validate

# Clean up
dropdb reconciliation_migration_test
```

## Performance Checklist

- [ ] EXPLAIN ANALYZE on slow queries
- [ ] Appropriate indexes for common queries
- [ ] Connection pool properly sized
- [ ] Redis caching for frequently accessed data
- [ ] Query pagination implemented
- [ ] N+1 queries eliminated
- [ ] Prepared statements used
- [ ] Database vacuum running regularly
- [ ] Index bloat monitored
- [ ] Query timeout configured
- [ ] Slow query logging enabled
