# HSG Implementation Plan - Critical Fixes & Remaining Phases
**378 Reconciliation Platform - Action Items**

---

## ✅ COMPLETED

### Phase 0: North Star
- Business Value Proposition defined
- User Personas identified (3 personas)
- Core User Journeys mapped (3 CUJs)

### Phase 1: Codebase Pruning
- ✅ Deleted `handlers_old.rs` (1857 lines)
- ✅ Deleted `main_graceful_shutdown.rs`
- ✅ Deleted `services/cache_old.rs`
- ✅ Deleted `middleware/security_old.rs`
- ⚠️ `handlers_modules_backup/` - Archive needed
- ⚠️ `schema.rs` (root) - Consolidation needed (subscriptions table)

---

## 🔧 CRITICAL FIXES NEEDED

### Phase 2 & 4: Transaction Boundaries (HIGH PRIORITY)

#### Fix 1: Reconciliation Job Creation with Data Source Verification

**File**: `backend/src/services/reconciliation.rs`  
**Function**: `create_reconciliation_job` (line 985)  
**Issue**: Job created without verifying data sources exist  
**Risk**: Orphaned jobs if data sources are invalid

**Solution**:
```rust
pub async fn create_reconciliation_job(
    &self,
    user_id: Uuid,
    request: CreateReconciliationJobRequest,
) -> AppResult<ReconciliationJobStatus> {
    // Use transaction to ensure atomicity
    crate::database::transaction::with_transaction(self.db.get_pool(), |tx| {
        // 1. Verify data sources exist and belong to project
        let source_a = data_sources::table
            .filter(data_sources::id.eq(request.source_a_id))
            .filter(data_sources::project_id.eq(request.project_id))
            .first::<DataSource>(tx)
            .optional()
            .map_err(AppError::Database)?;
        
        if source_a.is_none() {
            return Err(AppError::NotFound(
                format!("Data source {} not found or doesn't belong to project", request.source_a_id)
            ));
        }
        
        let source_b = data_sources::table
            .filter(data_sources::id.eq(request.source_b_id))
            .filter(data_sources::project_id.eq(request.project_id))
            .first::<DataSource>(tx)
            .optional()
            .map_err(AppError::Database)?;
        
        if source_b.is_none() {
            return Err(AppError::NotFound(
                format!("Data source {} not found or doesn't belong to project", request.source_b_id)
            ));
        }
        
        // 2. Create job within same transaction
        let job_id = Uuid::new_v4();
        let settings_json = serde_json::to_value(&request.matching_rules)
            .map_err(|e| AppError::Serialization(e))?;
        
        let new_job = NewReconciliationJob {
            project_id: request.project_id,
            name: request.name.clone(),
            description: request.description.clone(),
            status: "pending".to_string(),
            source_a_id: request.source_a_id,
            source_b_id: request.source_b_id,
            created_by: user_id,
            confidence_threshold: Some(request.confidence_threshold),
            settings: Some(crate::models::JsonValue(settings_json)),
        };
        
        diesel::insert_into(reconciliation_jobs::table)
            .values(&new_job)
            .execute(tx)
            .map_err(AppError::Database)?;
        
        Ok(ReconciliationJobStatus {
            id: job_id,
            name: request.name,
            status: "pending".to_string(),
            progress: 0,
            total_records: None,
            processed_records: 0,
            matched_records: 0,
            unmatched_records: 0,
            started_at: None,
            completed_at: None,
        })
    }).await
}
```

#### Fix 2: Match Approval with Record Status Updates

**File**: Need to create/update match approval endpoint  
**Issue**: Match approval updates match status and record statuses separately (non-atomic)  
**Risk**: Inconsistent state if one update fails

**Solution**: Create batch approval endpoint with transaction
```rust
pub async fn batch_approve_matches(
    &self,
    matches: Vec<MatchApprovalRequest>,
) -> AppResult<BatchApprovalResult> {
    crate::database::transaction::with_transaction(self.db.get_pool(), |tx| {
        let mut approved = 0;
        let mut rejected = 0;
        let mut errors = Vec::new();
        
        for match_req in matches {
            match self.approve_match_in_transaction(tx, match_req) {
                Ok(approved_flag) => {
                    if approved_flag {
                        approved += 1;
                    } else {
                        rejected += 1;
                    }
                }
                Err(e) => {
                    errors.push(e.to_string());
                }
            }
        }
        
        Ok(BatchApprovalResult {
            approved,
            rejected,
            errors: if errors.is_empty() { None } else { Some(errors) },
        })
    }).await
}
```

---

## 🚀 PHASE 5: BFF ENDPOINTS (HIGH PRIORITY)

### Endpoint 1: Reconciliation View (Aggregated)

**Route**: `GET /api/projects/:id/reconciliation/view`  
**Purpose**: Single endpoint for CUJ 1, Step 4 (Review Results)  
**Serves**: Persona 1 (Financial Analyst)

**Implementation**: Add to `backend/src/handlers/projects.rs`
```rust
/// Get reconciliation view for project (BFF endpoint)
pub async fn get_project_reconciliation_view(
    project_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id_val = project_id.into_inner();
    
    // Check permissions
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id_val)?;
    
    // Check cache first
    let cache_key = format!("project:{}:reconciliation:view", project_id_val);
    if let Some(cached) = cache.get::<serde_json::Value>(&cache_key).await? {
        return Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(cached),
            message: None,
            error: None,
        }));
    }
    
    // Build aggregated view
    let reconciliation_service = ReconciliationService::new(data.get_ref().clone());
    let project_service = ProjectService::new(data.get_ref().clone());
    let analytics_service = AnalyticsService::new(data.get_ref().clone());
    
    let jobs = reconciliation_service.get_jobs_for_project(project_id_val).await?;
    let matches_summary = reconciliation_service.get_matches_summary(project_id_val).await?;
    let project_info = project_service.get_project_by_id(project_id_val).await?;
    let stats = analytics_service.get_project_reconciliation_stats(project_id_val).await?;
    
    let view = serde_json::json!({
        "project": project_info,
        "jobs": jobs,
        "matches_summary": matches_summary,
        "stats": stats,
    });
    
    // Cache for 60 seconds
    cache.set(&cache_key, &view, 60).await?;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(view),
        message: None,
        error: None,
    }))
}
```

### Endpoint 2: Batch Resolve Conflicts

**Route**: `POST /api/reconciliation/batch-resolve`  
**Purpose**: CUJ 1, Step 5 (Resolve Conflicts)  
**Serves**: Persona 1 (Financial Analyst)

**Implementation**: Add to `backend/src/handlers/reconciliation.rs`
```rust
/// Batch resolve reconciliation conflicts
pub async fn batch_resolve_conflicts(
    req: web::Json<BatchResolveRequest>,
    http_req: HttpRequest,
    data: web::Data<Database>,
    cache: web::Data<MultiLevelCache>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    
    let reconciliation_service = ReconciliationService::new(data.get_ref().clone());
    
    let result = reconciliation_service.batch_approve_matches(req.resolves.clone()).await?;
    
    // Invalidate cache
    for resolve in &req.resolves {
        let _ = cache.delete(&format!("match:{}", resolve.match_id)).await;
    }
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(result),
        message: Some(format!("Resolved {} matches", result.approved + result.rejected)),
        error: None,
    }))
}

#[derive(Deserialize)]
pub struct BatchResolveRequest {
    pub resolves: Vec<MatchResolve>,
}

#[derive(Deserialize)]
pub struct MatchResolve {
    pub match_id: Uuid,
    pub action: String, // "approve" or "reject"
    pub notes: Option<String>,
}
```

### Endpoint 3: Upload Status

**Route**: `GET /api/projects/:id/upload-status`  
**Purpose**: CUJ 1, Step 1 (Upload Files) progress tracking

**Implementation**: Add to `backend/src/handlers/files.rs`
```rust
/// Get upload status for project
pub async fn get_upload_status(
    project_id: web::Path<Uuid>,
    http_req: HttpRequest,
    data: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let user_id = extract_user_id(&http_req)?;
    let project_id_val = project_id.into_inner();
    
    crate::utils::check_project_permission(data.get_ref(), user_id, project_id_val)?;
    
    let file_service = FileService::new(data.get_ref().clone());
    let uploads = file_service.get_project_uploads(project_id_val).await?;
    
    let status = serde_json::json!({
        "uploads": uploads.iter().map(|u| serde_json::json!({
            "id": u.id,
            "filename": u.filename,
            "status": u.status,
            "progress": u.progress.unwrap_or(0),
            "record_count": u.record_count,
        })).collect::<Vec<_>>(),
        "total": uploads.len(),
        "completed": uploads.iter().filter(|u| u.status == "completed").count(),
    });
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(status),
        message: None,
        error: None,
    }))
}
```

---

## ⚠️ PHASE 3: ALGORITHM OPTIMIZATION

### Current: O(n²) Matching
### Target: O(n log n) with Indexing

**File**: `backend/src/services/reconciliation_engine.rs`  
**Strategy**: Hash-based exact matching first, then fuzzy for remaining

**Implementation**: Create indexed matcher
```rust
pub struct IndexedMatcher {
    exact_index: HashMap<String, Vec<Uuid>>, // field_value -> record_ids
    fuzzy_threshold: f64,
}

impl IndexedMatcher {
    pub fn build_index(records: &[ReconciliationRecord], key_field: &str) -> Self {
        let mut exact_index = HashMap::new();
        
        for record in records {
            if let Some(value) = record.fields.get(key_field) {
                let key = value.to_string();
                exact_index
                    .entry(key)
                    .or_insert_with(Vec::new)
                    .push(record.id);
            }
        }
        
        Self {
            exact_index,
            fuzzy_threshold: 0.8,
        }
    }
    
    pub fn find_matches(&self, record: &ReconciliationRecord, key_field: &str) -> Vec<Uuid> {
        // O(1) exact match lookup
        if let Some(value) = record.fields.get(key_field) {
            if let Some(matches) = self.exact_index.get(&value.to_string()) {
                return matches.clone();
            }
        }
        
        // Fall back to fuzzy matching for remaining (smaller set)
        // This is now O(m) where m << n
        Vec::new()
    }
}
```

---

## 📊 PHASE 4: DATABASE INDEXES

### Verify/Add Composite Indexes

**Migration**: `backend/migrations/YYYYMMDD_add_composite_indexes.sql`
```sql
-- Reconciliation records composite index
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_project_status 
ON reconciliation_records(project_id, status);

-- Reconciliation matches confidence score index
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_confidence 
ON reconciliation_matches(confidence_score) 
WHERE confidence_score IS NOT NULL;

-- Data sources project status index
CREATE INDEX IF NOT EXISTS idx_data_sources_project_status 
ON data_sources(project_id, status);
```

**Run**: `diesel migration run`

---

## 📝 REMAINING PHASES SUMMARY

### Phase 6: Docker & Deployment
- Create optimized multi-stage Dockerfiles
- Production docker-compose.yml
- Kubernetes manifests with health checks
- CI/CD pipeline with caching

### Phase 7: Testing
- Unit tests for transaction functions
- Journey tests for CUJs
- k6 load testing scripts

### Phase 8: Conflict Resolution
- Review all recommendations against North Star
- Resolve memory/performance trade-offs
- Align BFF endpoints with existing API structure

### Phase 9: Final Roadmap
- Documentation updates
- Monitoring dashboards
- Maintenance runbooks

### Phase 10: Post-Deployment
- Production log analysis
- Error tracking
- Performance monitoring

### Phase 11: Auto-Governance
- Prometheus queries
- CI/CD audit pipeline
- Governance spec JSON

---

**Status**: Implementation Plan Created  
**Next Steps**: Apply critical fixes (transactions, BFF endpoints)

