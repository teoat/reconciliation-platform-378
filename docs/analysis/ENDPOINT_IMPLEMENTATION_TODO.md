# Endpoint Implementation TODO

**Last Updated**: 2025-01-15  
**Status**: Database Integration Phase

## Priority 1: Database Schema & Models (CRITICAL)

### 1.1 Create Database Migrations

- [ ] **Visualization Domain**
  - [ ] Create `charts` table migration
  - [ ] Create `dashboards` table migration
  - [ ] Create `reports` table migration
  - [ ] Add foreign keys and indexes

- [ ] **Notifications Domain**
  - [ ] Create `notifications` table migration
  - [ ] Create `notification_preferences` table migration
  - [ ] Add indexes on `user_id` and `read` status

- [ ] **Teams Domain**
  - [ ] Create `teams` table migration
  - [ ] Create `team_members` table migration
  - [ ] Add foreign keys and unique constraints

- [ ] **Workflows Domain**
  - [ ] Create `workflows` table migration
  - [ ] Create `workflow_instances` table migration
  - [ ] Create `workflow_rules` table migration
  - [ ] Add JSON columns for definitions

- [ ] **Cashflow Domain**
  - [ ] Create `cashflow_categories` table migration
  - [ ] Create `cashflow_transactions` table migration
  - [ ] Create `cashflow_discrepancies` table migration

- [ ] **Adjudication Domain**
  - [ ] Create `adjudication_cases` table migration
  - [ ] Create `adjudication_decisions` table migration
  - [ ] Create `adjudication_workflows` table migration

- [ ] **Ingestion Domain**
  - [ ] Create `ingestion_jobs` table migration
  - [ ] Create `ingestion_results` table migration
  - [ ] Create `ingestion_errors` table migration

### 1.2 Create Diesel Models

- [ ] **Visualization Models**
  - [ ] `Chart` model in `backend/src/models/visualization.rs`
  - [ ] `Dashboard` model
  - [ ] `Report` model
  - [ ] Update `models/mod.rs`

- [ ] **Notification Models**
  - [ ] `Notification` model in `backend/src/models/notification.rs`
  - [ ] `NotificationPreferences` model
  - [ ] Update `models/mod.rs`

- [ ] **Team Models**
  - [ ] `Team` model in `backend/src/models/team.rs`
  - [ ] `TeamMember` model
  - [ ] Update `models/mod.rs`

- [ ] **Workflow Models**
  - [ ] `Workflow` model in `backend/src/models/workflow.rs`
  - [ ] `WorkflowInstance` model
  - [ ] `WorkflowRule` model
  - [ ] Update `models/mod.rs`

- [ ] **Cashflow Models**
  - [ ] `CashflowCategory` model in `backend/src/models/cashflow.rs`
  - [ ] `CashflowTransaction` model
  - [ ] `CashflowDiscrepancy` model
  - [ ] Update `models/mod.rs`

- [ ] **Adjudication Models**
  - [ ] `AdjudicationCase` model in `backend/src/models/adjudication.rs`
  - [ ] `AdjudicationDecision` model
  - [ ] `AdjudicationWorkflow` model
  - [ ] Update `models/mod.rs`

- [ ] **Ingestion Models**
  - [ ] `IngestionJob` model in `backend/src/models/ingestion.rs`
  - [ ] `IngestionResult` model
  - [ ] `IngestionError` model
  - [ ] Update `models/mod.rs`

## Priority 2: Service Layer Implementation (HIGH)

### 2.1 Create Service Modules

- [ ] **VisualizationService**
  - [ ] Create `backend/src/services/visualization.rs`
  - [ ] Implement CRUD operations for charts
  - [ ] Implement CRUD operations for dashboards
  - [ ] Implement CRUD operations for reports
  - [ ] Add caching for expensive operations

- [ ] **NotificationService**
  - [ ] Create `backend/src/services/notification.rs`
  - [ ] Implement notification creation and retrieval
  - [ ] Implement mark as read/unread
  - [ ] Implement bulk operations
  - [ ] Implement preferences management

- [ ] **TeamService**
  - [ ] Create `backend/src/services/team.rs`
  - [ ] Implement team CRUD operations
  - [ ] Implement member management
  - [ ] Implement permission checks

- [ ] **WorkflowService**
  - [ ] Create `backend/src/services/workflow.rs`
  - [ ] Implement workflow CRUD operations
  - [ ] Implement instance management
  - [ ] Implement rule evaluation

- [ ] **CashflowService**
  - [ ] Create `backend/src/services/cashflow.rs`
  - [ ] Implement category management
  - [ ] Implement transaction processing
  - [ ] Implement discrepancy tracking
  - [ ] Implement analysis calculations

- [ ] **AdjudicationService**
  - [ ] Create `backend/src/services/adjudication.rs`
  - [ ] Implement case management
  - [ ] Implement decision tracking
  - [ ] Implement workflow execution

- [ ] **IngestionService**
  - [ ] Create `backend/src/services/ingestion.rs`
  - [ ] Implement job management
  - [ ] Implement data processing
  - [ ] Implement validation logic
  - [ ] Implement transformation logic

### 2.2 Update Service Registry

- [ ] Update `services/mod.rs` to export new services
- [ ] Add service initialization in `main.rs`
- [ ] Configure service dependencies

## Priority 3: Handler Integration (HIGH)

### 3.1 Replace TODO Comments with Database Queries

- [ ] **Visualization Handlers** (16 endpoints)
  - [ ] Implement `list_charts` database query
  - [ ] Implement `create_chart` database insert
  - [ ] Implement `get_chart` database query
  - [ ] Implement `update_chart` database update
  - [ ] Implement `delete_chart` database delete
  - [ ] Repeat for dashboards and reports

- [ ] **Notification Handlers** (10 endpoints)
  - [ ] Implement notification listing with filters
  - [ ] Implement notification creation
  - [ ] Implement mark as read/unread
  - [ ] Implement bulk operations
  - [ ] Implement preferences management

- [ ] **Team Handlers** (9 endpoints)
  - [ ] Implement team CRUD operations
  - [ ] Implement member management
  - [ ] Implement permission checks

- [ ] **Workflow Handlers** (13 endpoints)
  - [ ] Implement workflow CRUD operations
  - [ ] Implement instance management
  - [ ] Implement rule evaluation

- [ ] **Cashflow Handlers** (19 endpoints)
  - [ ] Implement category management
  - [ ] Implement transaction processing
  - [ ] Implement discrepancy tracking

- [ ] **Adjudication Handlers** (19 endpoints)
  - [ ] Implement case management
  - [ ] Implement decision tracking
  - [ ] Implement workflow execution

- [ ] **Ingestion Handlers** (9 endpoints)
  - [ ] Implement job management
  - [ ] Implement data processing
  - [ ] Implement validation and transformation

### 3.2 Connect Handlers to Services

- [ ] Update all handlers to use service layer
- [ ] Remove direct database access from handlers
- [ ] Add proper error handling
- [ ] Implement pagination correctly

## Priority 4: Type Safety & Validation (MEDIUM)

### 4.1 Create Proper Request/Response Types

- [ ] **Visualization Types**
  - [ ] Replace `serde_json::Value` with proper types
  - [ ] Add validation using serde
  - [ ] Update `handlers/types.rs`

- [ ] **Notification Types**
  - [ ] Create `CreateNotificationRequest`
  - [ ] Create `UpdateNotificationRequest`
  - [ ] Create `NotificationResponse`

- [ ] **Team Types**
  - [ ] Create `CreateTeamRequest`
  - [ ] Create `UpdateTeamRequest`
  - [ ] Create `TeamResponse`

- [ ] **Workflow Types**
  - [ ] Create workflow definition types
  - [ ] Create instance state types
  - [ ] Create rule condition types

- [ ] **Cashflow Types**
  - [ ] Create transaction types
  - [ ] Create category types
  - [ ] Create discrepancy types

- [ ] **Adjudication Types**
  - [ ] Create case types
  - [ ] Create decision types
  - [ ] Create workflow types

- [ ] **Ingestion Types**
  - [ ] Create job types
  - [ ] Create result types
  - [ ] Create error types

### 4.2 Add Validation

- [ ] Add serde validation attributes
- [ ] Add custom validators where needed
- [ ] Add input sanitization
- [ ] Add business rule validation

## Priority 5: Testing (MEDIUM)

### 5.1 Unit Tests

- [ ] Test visualization handlers
- [ ] Test notification handlers
- [ ] Test team handlers
- [ ] Test workflow handlers
- [ ] Test cashflow handlers
- [ ] Test adjudication handlers
- [ ] Test ingestion handlers

### 5.2 Integration Tests

- [ ] Test complete workflows
- [ ] Test error scenarios
- [ ] Test authentication/authorization
- [ ] Test pagination
- [ ] Test filtering and search

### 5.3 E2E Tests

- [ ] Test critical user journeys
- [ ] Test API contracts
- [ ] Test performance

## Priority 6: Documentation & Polish (LOW)

### 6.1 API Documentation

- [ ] Add OpenAPI annotations to all endpoints
- [ ] Update API documentation
- [ ] Add request/response examples
- [ ] Document error codes

### 6.2 Code Documentation

- [ ] Add doc comments to all functions
- [ ] Document complex business logic
- [ ] Add usage examples

### 6.3 Performance Optimization

- [ ] Add caching where appropriate
- [ ] Optimize database queries
- [ ] Add connection pooling
- [ ] Implement rate limiting

## Quick Wins (Can be done immediately)

1. **Create basic database models** - Start with one domain (e.g., notifications)
2. **Implement one complete CRUD flow** - Use as template for others
3. **Add proper types** - Replace `serde_json::Value` incrementally
4. **Fix unused variable warnings** - Quick cleanup

## Estimated Effort

- **Database Schema**: 2-3 days
- **Service Layer**: 3-4 days
- **Handler Integration**: 2-3 days
- **Type Safety**: 1-2 days
- **Testing**: 2-3 days
- **Documentation**: 1 day

**Total**: ~11-16 days of focused development

## Notes

- All endpoint structures are complete and follow existing patterns
- Authentication and authorization are properly implemented
- The main work remaining is database integration
- Consider implementing one domain completely as a template
- Prioritize based on business needs

