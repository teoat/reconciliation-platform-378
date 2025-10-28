# 🚀 30-Minute Developer Quick Start Guide
## 378 Reconciliation Platform - Get Running Fast

**Target Audience:** New developers joining the project  
**Time Investment:** 30 minutes  
**Prerequisites:** Docker installed

---

## Part 1: Clone & Start (7 minutes)

### Step 1: Clone Repository (2 min)
```bash
git clone https://github.com/yourorg/reconciliation-platform.git
cd reconciliation-platform
```

### Step 2: Start Services (5 min)
```bash
# One command to rule them all
docker-compose up --build

# Services starting:
# - Backend:  http://localhost:2000
# - Frontend: http://localhost:1000
# - Database: localhost:5432
# - Redis:    localhost:6379
```

**Verify Everything Works:**
```bash
# Check backend health
curl http://localhost:2000/api/health

# Should return: {"status":"ok", ...}
```

---

## Part 2: Review Key Files (10 minutes)

### Critical Files to Understand

**1. Frontend Configuration (2 min)**
```bash
# Main app config
frontend/src/config/AppConfig.ts
```
- API endpoints, theme, constants
- **Key:** All API URLs centralized here

**2. Backend Main Entry (2 min)**
```bash
# Server startup
backend/src/main.rs
```
- Service initialization, routes, middleware
- **Key:** Security middleware, request ID tracing

**3. Database Schema (3 min)**
```bash
# Data models
backend/src/models/schema.rs
```
- All database tables and relations
- **Key:** `reconciliation_jobs`, `users`, `projects`

**4. API Handlers (3 min)**
```bash
# Request handlers
backend/src/handlers.rs
```
- All API endpoint implementations
- **Key:** Authorization checks, input validation

---

## Part 3: Make Your First Change (10 minutes)

### Task: Add a New API Endpoint

**Example:** Create a "Quick Stats" endpoint

**Step 1: Add Handler (3 min)**
```rust
// backend/src/handlers.rs
pub async fn get_quick_stats(
    db: web::Data<Database>,
) -> Result<HttpResponse, AppError> {
    let stats = serde_json::json!({
        "total_jobs": 42,
        "active_jobs": 3,
        "total_matches": 15420
    });
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(stats),
        message: None,
        error: None,
    }))
}
```

**Step 2: Register Route (2 min)**
```rust
// backend/src/main.rs (line ~157)
.route("/stats", web::get().to(handlers::get_quick_stats))
```

**Step 3: Test It (2 min)**
```bash
curl http://localhost:2000/api/stats

# Should return:
# {"success":true,"data":{"total_jobs":42,"active_jobs":3,"total_matches":15420}}
```

**Step 4: Update Frontend Config (3 min)**
```typescript
// frontend/src/config/AppConfig.ts
export const API_ENDPOINTS = {
  // ... existing endpoints
  STATS: '/stats',
}
```

---

## Part 4: Architecture Overview (3 minutes)

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   React Frontend │  HTTP   │  Rust Backend   │
│   (Port 1000)    │ ◄──────►│  (Port 2000)    │
└─────────────────┘         └────────┬────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
              ┌──────────┐      ┌──────────┐     ┌──────────┐
              │PostgreSQL│      │  Redis   │     │    S3    │
              │  :5432   │      │  :6379   │     │ Backups  │
              └──────────┘      └──────────┘     └──────────┘
```

### Key Services

**Backend Services:**
- `AuthService` - Authentication & JWT
- `UserService` - User management
- `ReconciliationService` - Core reconciliation engine
- `FileService` - File uploads/downloads
- `MonitoringService` - Metrics & health

**Frontend Services:**
- `apiService` - API client wrapper
- `authService` - Login/logout
- `projectService` - Project management

---

## Common Tasks

### Adding a New Feature

1. Define data model in `backend/src/models/schema.rs`
2. Create service in `backend/src/services/`
3. Add handler in `backend/src/handlers.rs`
4. Register route in `backend/src/main.rs`
5. Add frontend API call in `frontend/src/services/`
6. Create UI component in `frontend/src/components/`

### Debugging

**Backend Logs:**
```bash
docker-compose logs -f backend
```

**Frontend Console:**
```bash
# Open browser DevTools (F12)
# Check Console tab
```

**Database Queries:**
```bash
docker-compose exec database psql -U reconciliation_user -d reconciliation_app
```

### Running Tests

**Backend:**
```bash
cd backend
cargo test
```

**Frontend:**
```bash
cd frontend
npm test
```

---

## Next Steps

1. **Read Full Documentation:** See `docs/` folder
2. **Review API Endpoints:** Check `frontend/src/config/AppConfig.ts`
3. **Explore Services:** Browse `backend/src/services/`
4. **Join Team Slack:** #reconciliation-platform
5. **Schedule Onboarding:** Contact dev lead

---

## Quick Reference

**Important Commands:**
```bash
# Start services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up --build

# Run tests
cargo test  # Backend
npm test    # Frontend
```

**Important URLs:**
- Frontend: http://localhost:1000
- Backend API: http://localhost:2000
- API Health: http://localhost:2000/api/health
- API Docs: http://localhost:2000/docs (if enabled)

**Important Files:**
- Frontend config: `frontend/src/config/AppConfig.ts`
- Backend entry: `backend/src/main.rs`
- Database schema: `backend/src/models/schema.rs`

---

**Time Remaining:** ~30 minutes ✅  
**Next Step:** Make your first feature contribution!

