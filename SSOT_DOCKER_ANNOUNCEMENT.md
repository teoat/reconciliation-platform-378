# ✅ Docker SSOT Locked - Single Source of Truth

**Date**: January 2025  
**Status**: ✅ **LOCKED**

---

## 🎯 **SINGLE SOURCE OF TRUTH (SSOT)**

### **Active Files**
1. ✅ **docker-compose.yml** - Main SSOT (LOCKED)
2. ✅ **Dockerfile** - All-in-one build
3. ✅ **Dockerfile.backend** - Backend only
4. ✅ **Dockerfile.frontend** - Frontend only
5. ✅ **.dockerignore** - Build optimization

---

## 🗑️ **DELETED FILES**

The following redundant docker-compose files were removed:
1. ❌ docker-compose.production.yml
2. ❌ docker-compose.optimized.yml
3. ❌ infrastructure/docker/docker-compose.yml
4. ❌ docker_backup/* (backup only)

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

## 📁 **BACKUP LOCATION**

Old docker files moved to: `docker_backup/` (for reference only)

---

**SSOT Established**: ✅ **COMPLETE**

