# Immediate Action Plan - Backend Development

## Current Status

✅ **Compilation**: Clean build achieved  
✅ **Test Utilities**: Consolidated  
✅ **Agent Coordination**: Verified  
🔄 **Tests**: Running (establishing baseline)

## Priority 1: Address Warnings (Easy Wins)

### Automated Fixes

```bash
# Auto-fix unused imports and variables
cd backend
cargo fix --lib --allow-dirty
cargo fix --tests --allow-dirty
cargo fmt
```

### Manual Fixes Required

1. **Never Type Fallback in cache.rs** (Lines 436, 468, 483, 561, 586, 604)

   ```rust
   // Current:
   .query_async(&mut *conn)
   
   // Fixed:
   .query_async::<_, ()>(&mut *conn)
   ```

2. **Deprecated RawValue in api/v2/models/user.rs** (Line 59)

   ```rust
   // Current:
   fn from_sql(bytes: diesel::backend::RawValue<'_, diesel::pg::Pg>) -> deserialize::Result<Self>
   
   // Fixed:
   fn from_sql(bytes: <diesel::pg::Pg as diesel::backend::Backend>::RawValue<'_>) -> deserialize::Result<Self>
   ```

3. **Unknown Lint Configuration**
   - Update `Cargo.toml` to use `rust_2018_idioms` instead of `rust_2021_idioms`

## Priority 2: Implement Placeholder Handlers

### 1. `handlers/users.rs` - `get_user_activity`

```rust
pub async fn get_user_activity(
    path: web::Path<Uuid>,
    query: web::Query<PaginationParams>,
    data: web::Data<Arc<Database>>,
) -> Result<HttpResponse, AppError> {
    let user_id = path.into_inner();
    let pagination = query.into_inner();
    
    let mut conn = data.get_connection()?;
    
    let activities = web::block(move || -> Result<Vec<UserActivity>, diesel::result::Error> {
        use crate::models::schema::user_activities;
        
        user_activities::table
            .filter(user_activities::user_id.eq(user_id))
            .order(user_activities::timestamp.desc())
            .limit(pagination.limit)
            .offset(pagination.offset)
            .load::<UserActivity>(&mut conn)
    })
    .await
    .map_err(|e| AppError::InternalServerError(format!("Operation failed: {}", e)))?
    .map_err(AppError::Database)?;
    
    let total = /* count query */;
    
    Ok(HttpResponse::Ok().json(PaginatedResponse {
        data: activities,
        page: pagination.page(),
        limit: pagination.limit,
        total,
        total_pages: (total as f64 / pagination.limit as f64).ceil() as i32,
    }))
}
```

### 2. `handlers/security.rs` - `update_policy`

```rust
pub async fn update_policy(
    path: web::Path<Uuid>,
    body: web::Json<UpdatePolicyRequest>,
    data: web::Data<Arc<Database>>,
) -> Result<HttpResponse, AppError> {
    let policy_id = path.into_inner();
    let update_data = body.into_inner();
    
    let mut conn = data.get_connection()?;
    
    let updated_policy = web::block(move || -> Result<SecurityPolicy, diesel::result::Error> {
        use crate::models::schema::security_policies;
        
        diesel::update(security_policies::table.find(policy_id))
            .set((
                security_policies::name.eq(update_data.name),
                security_policies::description.eq(update_data.description),
                security_policies::rules.eq(update_data.rules),
                security_policies::updated_at.eq(chrono::Utc::now()),
            ))
            .get_result(&mut conn)
    })
    .await
    .map_err(|e| AppError::InternalServerError(format!("Operation failed: {}", e)))?
    .map_err(AppError::Database)?;
    
    Ok(HttpResponse::Ok().json(updated_policy))
}
```

### 3. `handlers/system.rs` - `get_logs`

```rust
pub async fn get_logs(
    query: web::Query<LogQueryParams>,
    data: web::Data<Arc<Database>>,
) -> Result<HttpResponse, AppError> {
    let params = query.into_inner();
    
    let mut conn = data.get_connection()?;
    
    let logs = web::block(move || -> Result<Vec<SystemLog>, diesel::result::Error> {
        use crate::models::schema::system_logs;
        
        let mut query = system_logs::table.into_boxed();
        
        if let Some(level) = params.level {
            query = query.filter(system_logs::level.eq(level));
        }
        
        if let Some(start_date) = params.start_date {
            query = query.filter(system_logs::timestamp.ge(start_date));
        }
        
        if let Some(end_date) = params.end_date {
            query = query.filter(system_logs::timestamp.le(end_date));
        }
        
        query
            .order(system_logs::timestamp.desc())
            .limit(params.limit.unwrap_or(100))
            .load(&mut conn)
    })
    .await
    .map_err(|e| AppError::InternalServerError(format!("Operation failed: {}", e)))?
    .map_err(AppError::Database)?;
    
    Ok(HttpResponse::Ok().json(logs))
}
```

## Priority 3: Test Fixes

### Strategy

1. **Wait for test results** to identify failing tests
2. **Categorize failures**:
   - Database schema issues
   - Missing test data
   - Assertion errors
   - Configuration problems

3. **Fix systematically**:
   - Start with simple assertion fixes
   - Move to schema/migration issues
   - Handle complex integration test problems

### Common Test Fixes

```rust
// Fix: Missing test database setup
#[actix_web::test]
async fn test_something() {
    let db = create_test_db().await;
    cleanup_test_data(&db).await.unwrap();
    // ... test code
}

// Fix: Ignored auth tests
// Remove #[ignore] after implementing proper auth setup
#[actix_web::test]
async fn test_login() {
    let app = create_integration_test_app().await;
    // ... test code
}
```

## Priority 4: Code Quality

### Run Analysis Tools

```bash
# Linting
cargo clippy -- -D warnings

# Formatting
cargo fmt --check

# Security audit
cargo audit

# Dependency check
cargo tree --duplicates
```

### Documentation

```bash
# Generate docs
cargo doc --no-deps --open

# Check for missing docs
cargo rustdoc -- -D missing_docs
```

## Priority 5: Performance

### Add Benchmarks

```rust
//benches/reconciliation_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn reconciliation_benchmark(c: &mut Criterion) {
    c.bench_function("reconcile 1000 records", |b| {
        b.iter(|| {
            // benchmark code
        })
    });
}

criterion_group!(benches, reconciliation_benchmark);
criterion_main!(benches);
```

### Profile Critical Paths

```bash
# Install flamegraph
cargo install flamegraph

# Run profiling
cargo flamegraph --test integration_tests
```

## Timeline

### Today

- [x] Consolidate test utilities
- [x] Verify agent coordination
- [ ] Wait for test results
- [ ] Fix critical warnings

### Tomorrow

- [ ] Implement 2-3 placeholder handlers
- [ ] Fix failing tests
- [ ] Run cargo clippy and address issues

### This Week

- [ ] Complete all placeholder implementations
- [ ] Achieve >90% test pass rate
- [ ] Zero critical warnings
- [ ] Documentation updates

## Success Metrics

- ✅ Compilation: PASS
- ⏳ Tests: Pending results
- 🎯 Warning Count: 42 → 0 (target)
- 🎯 Test Pass Rate: TBD → >95% (target)
- 🎯 Code Coverage: TBD → >80% (target)

## Notes

- Keep commits atomic and well-documented
- Run tests after each significant change
- Update documentation as you go
- Ask for review on complex changes
