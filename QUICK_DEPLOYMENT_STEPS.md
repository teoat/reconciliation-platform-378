# ⚡ QUICK DEPLOYMENT STEPS

## 🎯 For 378 Reconciliation Platform

---

## ✅ PRE-FLIGHT CHECK

1. ✅ All critical TODOs complete
2. ✅ Environment files needed
3. ✅ Docker available

---

## 🚀 DEPLOYMENT (3 Steps)

### Step 1: Create Environment Files

**Backend** (`backend/.env`):
```bash
DATABASE_URL=postgresql://postgres:reconciliation_pass@postgres:5432/reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=reconciliation_pass
POSTGRES_DB=reconciliation_app
REDIS_URL=redis://redis:6379
JWT_SECRET=change-this-to-a-very-secure-secret-in-production
HOST=0.0.0.0
PORT=2000
CORS_ORIGINS=http://localhost:1000,http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
RUST_LOG=warn,reconciliation_backend=info
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ENV=production
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:2000
VITE_WS_URL=ws://localhost:2000
VITE_ENV=production
```

### Step 2: Start Services

**Option A: Docker Compose (v2)**
```bash
cd /Users/Arief/Desktop/378
docker compose up -d
```

**Option B: Docker Compose (v1)**
```bash
docker-compose up -d
```

### Step 3: Verify

```bash
# Check services
docker compose ps

# Check backend
curl http://localhost:2000/health

# Check frontend
curl http://localhost:1000

# View logs
docker compose logs -f
```

---

## 🎉 DONE!

**Access your application at:**
- Frontend: http://localhost:1000
- Backend API: http://localhost:2000
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090

---

## 🔧 TROUBLESHOOTING

### If services don't start:
```bash
# Check what's running
docker ps -a

# View logs
docker compose logs backend
docker compose logs frontend

# Restart
docker compose restart
```

### Database issues:
```bash
# Check database
docker compose exec postgres pg_isready

# Run migrations (if needed)
docker compose exec backend diesel migration run
```

---

## 📝 NOTES

- Default database: `reconciliation_app`
- JWT secret: Change in production!
- All services run on localhost
- Check `docker compose ps` for status

