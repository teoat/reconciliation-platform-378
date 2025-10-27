# 🧹 DOCKER CLEANUP PLAN
## Remove Duplicates & Keep Best Versions

**Analysis Date**: January 2025

---

## 📋 **CURRENT DOCKER FILES**

### **Docker Compose Files Found**:
1. `docker-compose.yml` (root) - Main compose
2. `docker-compose.prod.yml` (root) - Production
3. `docker-compose.production.yml` (root) - Duplicate production
4. `docker-compose.simple.yml` (root) - Simple version
5. `docker-compose.staging.yml` (root) - Staging
6. `infrastructure/docker/docker-compose.yml` - Infrastructure version
7. `infrastructure/docker/docker-compose.dev.yml` - Development
8. `infrastructure/docker/docker-compose.prod.yml` - Production
9. `docker-compose.optimized.yml` (root) - **NEW OPTIMIZED VERSION**

### **Dockerfile Files Found**:
1. `backend/Dockerfile` - Backend Dockerfile
2. `infrastructure/docker/Dockerfile.backend` - Alternative
3. `infrastructure/docker/Dockerfile.rust` - Another variant
4. `infrastructure/docker/Dockerfile.frontend` - Frontend
5. `infrastructure/docker/Dockerfile.database` - Database
6. `infrastructure/docker/Dockerfile.redis` - Redis
7. `infrastructure/docker/Dockerfile` - Generic
8. `Dockerfile.backend.optimized` (root) - **NEW OPTIMIZED**
9. `Dockerfile.frontend.optimized` (root) - **NEW OPTIMIZED**

---

## 🎯 **CLEANUP STRATEGY**

### **Keep (Best Versions)**:
✅ `docker-compose.optimized.yml` - Latest optimized version
✅ `Dockerfile.backend.optimized` - Optimized backend
✅ `Dockerfile.frontend.optimized` - Optimized frontend

### **Remove (Duplicates)**:
❌ `docker-compose.yml` - Replaced by optimized
❌ `docker-compose.prod.yml` - Duplicate of production
❌ `docker-compose.production.yml` - Duplicate
❌ `docker-compose.simple.yml` - Simplified version
❌ `docker-compose.staging.yml` - Can use optimized with env vars
❌ `infrastructure/docker/docker-compose.yml` - Old version
❌ `infrastructure/docker/docker-compose.dev.yml` - Old version
❌ `infrastructure/docker/docker-compose.prod.yml` - Old version
❌ `infrastructure/docker/Dockerfile.backend` - Replaced by optimized
❌ `infrastructure/docker/Dockerfile.rust` - Replaced by optimized
❌ `infrastructure/docker/Dockerfile` - Generic/unused
❌ `backend/Dockerfile` - Replaced by optimized

### **Keep (Infrastructure)**:
✅ `infrastructure/docker/Dockerfile.frontend` - Keep as reference
✅ `infrastructure/docker/Dockerfile.database` - Keep for database
✅ `infrastructure/docker/Dockerfile.redis` - Keep for Redis

---

## 📝 **CLEANUP COMMANDS**

### **Step 1: Create Backup**
```bash
mkdir -p docker_backup_$(date +%Y%m%d)
cp docker-compose*.yml docker_backup_$(date +%Y%m%d)/
cp Dockerfile* docker_backup_$(date +%Y%m%d)/
```

### **Step 2: Remove Duplicate Compose Files**
```bash
rm docker-compose.yml
rm docker-compose.prod.yml
rm docker-compose.production.yml
rm docker-compose.simple.yml
rm docker-compose.staging.yml
rm infrastructure/docker/docker-compose.yml
rm infrastructure/docker/docker-compose.dev.yml
rm infrastructure/docker/docker-compose.prod.yml
```

### **Step 3: Remove Duplicate Dockerfiles**
```bash
rm backend/Dockerfile
rm infrastructure/docker/Dockerfile.backend
rm infrastructure/docker/Dockerfile.rust
rm infrastructure/docker/Dockerfile
```

### **Step 4: Rename Optimized Files**
```bash
mv docker-compose.optimized.yml docker-compose.yml
mv Dockerfile.backend.optimized          infrastructure/docker/Dockerfile.backend
mv Dockerfile.frontend.optimized          infrastructure/docker/Dockerfile.frontend
```

---

## ✅ **FINAL STRUCTURE**

### **Root Level**:
```
docker-compose.yml (main optimized compose)
```

### **infrastructure/docker/**:
```
Dockerfile.backend (optimized)
Dockerfile.frontend (optimized)
Dockerfile.database (existing)
Dockerfile.redis (existing)
nginx.conf
```

---

## 🎯 **RECOMMENDATION**

**Do you want me to execute this cleanup?**
- Creates backup first
- Removes duplicates
- Renames optimized files
- Keeps only best versions

