# ✅ Docker SSOT Locked - Single Source of Truth

**Date**: January 2025  
**Status**: ✅ **LOCKED**

---

## 🎯 **SINGLE SOURCE OF TRUTH (SSOT)**

### **Active Files (SSOT)**
1. ✅ **docker-compose.yml** - Main SSOT (LOCKED) - Development/Staging
2. ✅ **docker-compose.prod.yml** - Production overlay (LOCKED)
3. ✅ **infrastructure/docker/Dockerfile.backend** - Backend build (LOCKED)
4. ✅ **infrastructure/docker/Dockerfile.frontend** - Frontend build (LOCKED)

---

## 🗑️ **REMOVED/ARCHIVED FILES**

The following outdated files have been removed/archived:
1. ❌ Dockerfile (root) - Removed
2. ❌ Dockerfile.backend (root) - Removed
3. ❌ Dockerfile.frontend (root) - Removed
4. ❌ docker_backup/* - Archived
5. ❌ All duplicate docker-compose files - Archived

---

## 🚀 **USAGE**

### Standard Deployment
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

### Individual Services
```bash
# Backend only
docker-compose up -d backend postgres redis

# Frontend only (requires backend)
docker-compose up -d frontend backend
```

---

## 📋 **SERVICES**

| Service | Port | Image |
|---------|------|-------|
| Frontend | 1000 | Nginx (React) |
| Backend | 2000 | Rust (Actix) |
| PostgreSQL | 5432 | postgres:15-alpine |
| Redis | 6379 | redis:7-alpine |
| Prometheus | 9090 | prom/prometheus |
| Grafana | 3000 | grafana/grafana |

---

## 🔒 **LOCK STATUS**

- **docker-compose.yml**: ✅ **LOCKED** - DO NOT MODIFY
- **Contact**: Platform team for changes
- **Reason**: Maintain consistency and prevent conflicts

---

## 📁 **ARCHIVE LOCATION**

Old docker files moved to: `archive/docker_files/` (for reference only)

---

**SSOT Established**: ✅ **COMPLETE**

