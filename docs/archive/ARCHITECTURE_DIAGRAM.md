# 🏗️ System Architecture Diagram
## 378 Reconciliation Platform

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Architecture Type:** Microservices-Ready Monolith

---

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │
│  │   Web Browser  │  │   PWA Client   │  │   Desktop (Future) │    │
│  │   (Primary)    │  │   (Offline)    │  │                    │    │
│  └────────┬───────┘  └────────┬───────┘  └─────────┬──────────┘    │
│           │                   │                     │                │
│           └───────────────────┼─────────────────────┘                │
│                               │                                      │
│                          HTTPS/WSS                                  │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   NGINX LOAD BALANCER  │
                    │  - SSL Termination     │
                    │  - Rate Limiting       │
                    │  - Static Asset Serving│
                    └───────────┬────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
┌────────▼────────┐   ┌─────────▼──────────┐  ┌──────▼──────────┐
│  FRONTEND APP   │   │  BACKEND API       │  │  WEBSOCKET      │
│  (React + Vite) │   │  (Rust + Actix)    │  │  (Real-time)    │
│                 │   │                    │  │                 │
│  - UI Components│   │  - REST Handlers   │  │  - Job Progress │
│  - State Mgt    │◄──┼──  - Auth Service  │  │  - Notifications│
│  - API Client   │   │  - File Service    │  │  - Collaboration│
│  - WebSocket    │   │  - Reconciliation  │  │                 │
└─────────────────┘   │  - Analytics       │  └─────────────────┘
                      └─────────┬──────────┘
                                │
                  ┌─────────────┼─────────────┐
                  │             │             │
         ┌────────▼────────┐   │   ┌─────────▼──────────┐
         │   DATABASE      │   │   │   REDIS CACHE      │
         │   PostgreSQL    │   │   │   (Multi-Level)    │
         │                 │   │   │                    │
         │  - User Data    │   │   │  - Session Store   │
         │  - Projects     │   │   │  - API Cache       │
         │  - Reconciliation│  │   │  - Job Queue       │
         │  - Results      │   │   │  - Pub/Sub         │
         └─────────────────┘   │   └────────────────────┘
                               │
                      ┌────────▼──────────┐
                      │  EXTERNAL APIS    │
                      │                   │
                      │  - Email Service  │
                      │  - Monitoring     │
                      │  - Error Tracking │
                      └───────────────────┘
```

---

## Backend Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │實際 HANDLERS (API Endpoints)                            │ │
│  │  - auth_handlers.rs                                    │ │
│  │  - project_handlers.rs                                 │ │
│  │  - reconciliation_handlers.rs                          │ │
│  │  - file_handlers.rs                                    │ │
│  │  - analytics_handlers.rs                               │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      MIDDLEWARE LAYER                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  - AuthMiddleware (JWT validation)                    │ │
│  │  - SecurityMiddleware (CORS, CSRF, Rate Limiting)     │ │
│  │  - RequestIdMiddleware (Tracing)                       │ │
│  │  - LoggerMiddleware (Structured logging)               │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ SERVICES (Core Logic)                                   │ │
│  │  ┌────────────────┐  ┌────────────────┐               │ │
│  │  │ AuthService    │  │ UserService    │               │ │
│  │  └────────────────┘  └────────────────┘               │ │
│  │  ┌────────────────┐  ┌────────────────┐               │ │
│  │  │ ProjectService │  │ FileService    │               │ │
│  │  └────────────────┘  └────────────────┘               │ │
│  │  ┌────────────────┐  ┌────────────────┐               │ │
│  │  │ Reconciliation │  │ Analytics      │               │ │
│  │  │ Service        │  │ Service        │               │ │
│  │  └────────────────┘  └────────────────┘               │ │
│  │  ┌────────────────┐  ┌────────────────┐               │ │
│  │  │ CacheService   │  │ EmailService   │               │ │
│  │  └────────────────┘  └────────────────┘               │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      DATA ACCESS LAYER                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ DATABASE (Diesel ORM)                                   │ │
│  │  - User models                                          │ │
│  │  - Project models                                       │ │
│  │  - Reconciliation models                                │ │
│  │  - Transaction management                               │ │
│  │                                                          │ │
│  │ REDIS (Cache & Pub/Sub)                                 │ │
│  │  - Session storage                                      │ │
│  │  - API caching                                          │ │
│  │  - Real-time messaging                                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      UI LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  Components  │  │    Layouts   │     │
│  │              │  │              │  │              │     │
│  │ - Dashboard  │  │ - DataTable  │  │ - AppShell   │     │
│  │ - Projects   │  │ - Forms      │  │ - Nav        │     │
│  │ - Reconciliation│ - Buttons   │  │ - Modals     │     │
│  │ - Analytics  │  │ - Cards      │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                    STATE LAYER                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  REDUX (Global State)                                   │ │
│  │  - Auth state                                           │ │
│  │  - UI state                                             │ │
│  │  - Project state                                        │ │
│  │                                                          │ │
│  │  REACT QUERY (Server State)                             │ │
│  │  - API data caching                                     │ │
│  │  - Stale-while-revalidate                               │ │
│  │  - Optimistic updates                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────┬──────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                  SERVICE LAYER                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Client (Unified)                                   │ │
│  │  WebSocket Service                                      │ │
│  │  Cache Service                                          │ │
│  │  Error Handler                                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Reconciliation Process

```
1. USER UPLOAD
   ┌─────────────┐
   │ Upload File │
   └──────┬──────┘
          │
          ▼
   ┌──────────────────┐
   │ Validate & Parse │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────┐
   │ Store in DB      │
   └──────┬───────────┘
          │
          ▼
2. RECONCILIATION JOB CREATION
   ┌──────────────────────┐
   │ Create Job Record    │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Add to Lounge Queue  │
   └──────┬───────────────┘
          │
          ▼
3. ASYNC PROCESSING (Background)
   ┌────────────────────────┐
   │ Extract Records        │
   └──────┬─────────────────┘
          │
          ▼
   ┌────────────────────────┐
   │ Find Matches           │
   │ (Exact, Fuzzy, ML)     │
   └──────┬─────────────────┘
          │
          ▼
   ┌────────────────────────┐
   │ Calculate Confidence   │
   └──────┬─────────────────┘
          │
          ▼
   ┌────────────────────────┐
   │ Store Results          │
   └──────┬─────────────────┘
          │
          ▼
4. REAL-TIME UPDATES (WebSocket)
   ┌─────────────────────┐
   │ Broadcast Progress  │
   └──────┬──────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Client Updates      │
   └─────────────────────┘
```

---

## Deployment Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  KUBERNETES CLUSTER                                 │ │
│  │  ┌──────────────────┐  ┌──────────────────┐       │ │
│  │  │  Frontend Pod    │  │  Backend Pod     │       │ │
│  │  │  - 3 Replicas    │  │  - 3 Replicas    │ Around│ │
│  │  │  - Auto-scaling  │  │  - Auto-scaling  │       │ │
│  │  └──────────────────┘  └──────────────────┘       │ │
│  │  ┌──────────────────┐  ┌──────────────────┐       │ │
│  │  │  PostgreSQL      │  │  Redis           │       │ │
│  │  │  - Primary       │  │  - Sentinel      │       │ │
│  │  │  - Replicas (2)  │  │  - Cluster       │       │ │
│  │  └──────────────────┘  └──────────────────┘       │ │
│  │  ┌────────────────────────────────────────────┐   │ │
│  │  │  Monitoring Stack                          │   │ │
│  │  │  - Prometheus (Metrics)                    │   │ │
│  │  │  - Grafana (Dashboards)                    │   │ │
│  │  │  - Sentry (Error Tracking)                 │   │ │
│  │  └────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework:** React 18.3.0
- **Language:** TypeScript 5.2
- **Build Tool:** Vite 5.0
- **Styling:** Tailwind CSS 3.3
- **State:** Redux Toolkit + React Query
- **Routing:** React Router 6.8
- **UI Components:** Lucide React (icons)

### Backend
- **Language:** Rust 1.75
- **Web Framework:** Actix-Web 4.4
- **Async Runtime:** Tokio
- **ORM:** Diesel 2.1
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Security:** JWT + Bcrypt

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Orchestration:** Kubernetes (ready)
- **Load Balancer:** Nginx
- **Monitoring:** Prometheus + Grafana
- **Error Tracking:** Sentry (configured)

---

## Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Response Time | <200ms (P95) | ~150ms | ✅ PASS |
| Database Query | <10ms | ~5ms | ✅ PASS |
| Frontend Load | <500ms | ~1000ms | ⚠️ OPTIMIZE |
| Uptime | ≥99.9% | TBD | ⏳ MONITOR |
| Cache Hit Rate | >80% | ~85% | ✅ PASS |

---

## Security Layers

```
┌─────────────────────────────────────┐
│  APPLICATION SECURITY               │
│  - JWT Authentication               │
│  - Bcrypt Password Hashing          │
│  - Role-Based Access Control        │
│  - Input Validation & Sanitization  │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  NETWORK SECURITY                   │
│  - HTTPS/TLS                        │
│  - CORS Configuration               │
│  - CSRF Protection                  │
│  - Rate Limiting                    │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  INFRASTRUCTURE SECURITY            │
│  - Docker Security Scanning         │
│  - Secrets Management               │
│  - Network Isolation                │
│  - Backup Encryption                │
└─────────────────────────────────────┘
```

---

**Architecture Version:** 1.0  
**Designed By:** System Architecture Team  
**Last Reviewed:** January 2025  
**Next Review:** After scaling to 10,000 users

