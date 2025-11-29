# System Architecture

**Last Updated**: January 2025  
**Status**: Active  
**Version**: 2.0.0

---

## Overview

The Reconciliation Platform follows a modern microservices architecture with clear separation of concerns, implementing Single Source of Truth (SSOT) principles and CQRS patterns for scalability and maintainability.

## Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Rust)        │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │   Redis Cache   │    │   File Storage  │
│   Assets        │    │   Session       │    │   Uploads       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### Frontend (React + TypeScript)
- **Location**: `frontend/`
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **Code Organization**: SSOT-compliant structure (see [SSOT Guidance](./SSOT_GUIDANCE.md))

### Backend (Rust)
- **Location**: `backend/`
- **Framework**: Actix-Web
- **Database**: Diesel ORM + PostgreSQL
- **Authentication**: JWT tokens with password management (see [Password System](../analysis/PASSWORD_SYSTEM_RESOLUTION.md))
- **Real-time**: WebSocket support
- **Architecture**: CQRS pattern with event-driven architecture (see [CQRS and Event-Driven Architecture](./CQRS_AND_EVENT_DRIVEN_ARCHITECTURE.md))

#### Backend Service Modules

The backend contains **76+ service modules** organized by domain:

**Core Services:**
- `auth` - Authentication and authorization
- `user` - User management
- `project` - Project management (with sub-modules: models, crud, queries, analytics, permissions, aggregations)
- `reconciliation` - Reconciliation engine (modular structure)
- `file` - File upload and processing
- `data_source` - Data source management
- `analytics` - Analytics and reporting

**Infrastructure Services:**
- `cache` - Caching layer (with warming and analytics sub-modules)
- `database_sharding` - Database sharding support
- `shard_aware_db` - Shard-aware database operations
- `database_migration` - Database migration management
- `backup_recovery` - Backup and disaster recovery
- `realtime` - Real-time notifications and collaboration

**Security & Compliance:**
- `security` - Security services
- `security_monitor` - Security monitoring
- `security_event_logging` - Security event logging
- `compliance_reporting` - Compliance reporting
- `secrets` - Secret management
- `secret_manager` - Secret manager service
- `password_manager` - Password manager (with utilities sub-module)

**Performance & Monitoring:**
- `performance` - Performance optimization (with query tuning sub-module)
- `monitoring` - System monitoring
- `metrics` - Metrics collection
- `advanced_metrics` - Advanced metrics and analytics
- `query_optimizer` - Query optimization

**Error Handling & Resilience:**
- `error_translation` - Error translation service
- `error_logging` - Error logging service
- `error_recovery` - Error recovery mechanisms
- `resilience` - Resilience patterns (circuit breakers, graceful degradation)

**User Experience:**
- `internationalization` - i18n support (with models and data sub-modules)
- `accessibility` - Accessibility services
- `offline_persistence` - Offline data persistence
- `optimistic_ui` - Optimistic UI updates

**Advanced Features:**
- `ai` - AI/ML services
- `api_versioning` - API versioning management
- `validation` - Data validation services
- `structured_logging` - Structured logging
- `billing` - Billing and subscription management
- `sync` - Data synchronization services
- `registry` - Service registry
- `critical_alerts` - Critical alert management
- `email` - Email service

**Service Organization:**
- Services are organized in `backend/src/services/`
- Each service has a single responsibility
- Services follow SSOT principles (see [SSOT Guidance](./SSOT_GUIDANCE.md))
- Services are testable and modular

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions
- **Deployment**: Production-ready Docker setup

## Data Flow
1. **Upload**: Files uploaded via frontend
2. **Processing**: Backend processes and stores data
3. **Reconciliation**: AI-powered matching algorithms
4. **Collaboration**: Real-time updates via WebSocket
5. **Export**: Results exported in multiple formats

## Recent Improvements

### SSOT Consolidation
- **Status**: ✅ Complete (Phases 1-3)
- **Impact**: Reduced code duplication, improved maintainability
- **Migration Guide**: See [SSOT Migration Guide](../development/SSOT_MIGRATION_GUIDE.md)

### CQRS & Event-Driven Architecture
- **Status**: ✅ Implemented
- **Benefits**: Better separation of concerns, scalability
- **Documentation**: See [CQRS and Event-Driven Architecture](./CQRS_AND_EVENT_DRIVEN_ARCHITECTURE.md)

### Password System Consolidation
- **Status**: ✅ Complete
- **SSOT Location**: `backend/src/services/auth/password.rs`
- **Documentation**: See [Password System Resolution](../analysis/PASSWORD_SYSTEM_RESOLUTION.md)

### User Experience Enhancements (Phase 3)
- **Status**: ✅ Implemented
- **Features**: 
  - Contextual help expansion (see [Contextual Help Expansion Plan](../features/onboarding/CONTEXTUAL_HELP_EXPANSION_PLAN.md))
  - Progressive feature disclosure (see [Progressive Feature Disclosure Guide](../features/onboarding/PROGRESSIVE_FEATURE_DISCLOSURE_GUIDE.md))
  - Smart tip system (see [Smart Tip System Guide](../features/onboarding/SMART_TIP_SYSTEM_GUIDE.md))
- **Benefits**: Improved user onboarding, feature discovery, and productivity

## Related Documentation

- [SSOT Guidance](./SSOT_GUIDANCE.md) - Single Source of Truth principles
- [Infrastructure](./INFRASTRUCTURE.md) - Infrastructure design
- [CQRS and Event-Driven Architecture](./CQRS_AND_EVENT_DRIVEN_ARCHITECTURE.md) - CQRS patterns
- [SSOT Migration Guide](../development/SSOT_MIGRATION_GUIDE.md) - Migration guide

---

**Last Updated**: January 2025  
**Maintainer**: Architecture Team
