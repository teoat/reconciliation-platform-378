# 🤖 Agent 1 Prompt: Backend Infrastructure & Integration

## Your Mission

You are Agent 1, specializing in **Backend Infrastructure & Integration**. Your goal is to wire up all backend monitoring, integration, and core service components.

---

## 📋 Your Assigned Tasks (Items T-001 to T-012)

### Critical Path Items

#### T-001: Wire Up Integrations Module (30min) ⚡ IMMEDIATE
**Current**: `backend/src/integrations.rs` created but not imported  
**Action**:
1. Add to `backend/src/lib.rs`: `pub mod integrations;`
2. Add to `main.rs`: Import and call `initialize_integrations()`
3. Ensure sentry_guard and metrics_registry are used

**Acceptance**: Integration module compiles and initializes

#### T-002: Integrate Metrics Middleware (45min) ⚡ IMMEDIATE
**Current**: Metrics middleware created, not added to server  
**Action**:
1. Add `MetricsMiddleware` to Actix App middleware chain
2. Ensure metrics are accessible at `/metrics` endpoint
3. Test metrics collection

**Acceptance**: Metrics visible in Prometheus

#### T-003: Connect GDPR Endpoints to Routes (30min) ⚡ IMMEDIATE
**Current**: GDPR endpoints exist in `backend/src/api/gdpr.rs`, not routed  
**Action**:
1. Add routes to `main.rs`:
   - `GET /api/v1/users/{id}/export`
   - `DELETE /api/v1/users/{id}`
   - `POST /api/v1/consent`
2. Import gdpr module properly

**Acceptance**: GDPR endpoints respond

#### T-004: Add Monitoring Config Import (15min) ⚡ IMMEDIATE
**Current**: MonitoringConfig not imported in main  
**Action**:
1. Add `use crate::config::monitoring::MonitoringConfig;`
2. Initialize config on startup
3. Use config values throughout

**Acceptance**: Monitoring config available

#### T-005: Wire Up Sentry Middleware (30min) ⚡ IMMEDIATE
**Current**: Sentry init exists but middleware not added abruptly  
**Action**:
1. Add sentry-actix middleware to app
2. Test error capture
3. Verify Sentry works

**Acceptance**: Errors captured in Sentry

#### T-007: Add Cargo Dependencies (15min) ⚡ IMMEDIATE
**Current**: Monitoring deps not in Cargo.toml  
**Action**:
1. Add to Cargo.toml or run:
   ```bash
   cargo add prometheus --features histogram
   cargo add sentry sentry-actix
   cargo add tracing tracing-actix-web tracing-subscriber
   ```
2. Verify compilation

**Acceptance**: Backend compiles with monitoring deps

---

### High Priority Items

#### T-006: Connect Billing Service to API (1h)
**Action**: Create HTTP handlers for billing endpoints and route them

#### T-009: WebSocket Provider Audit (1h)
**Action**: Review WebSocket implementation for issues

#### T-012: Error Handling Integration (1h)
**Action**: Use ErrorStandardization throughout backend

---

## 🎯 Execution Instructions

### Step 1: Start with Dependencies
```bash
cd backend
cargo add prometheus --features histogram
cargo add sentry sentry-actix
```

### Step 2: Update lib.rs
Add:
```rust
pub mod integrations;
```

### Step 3: Update main.rs
Import and initialize all modules

### Step 4: Test
Run: `cargo build` and verify no errors

---

## ✅ Success Criteria

- [ ] Backend compiles with zero errors
- [ ] All integrations initialized on startup
- [ ] Metrics endpoint accessible
- [ ] GDPR endpoints responding
- [ ] Sentry capturing errors
- [ ] Monitoring config active

---

**Execute immediately and report completion.**

