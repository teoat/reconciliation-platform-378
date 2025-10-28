# 🚀 HOW TO START THE APPLICATION

## Current Status
- ✅ **PostgreSQL**: Running in Docker (port 5432)
- ✅ **Redis**: Running in Docker (port 6379)
- ⏳ **Backend**: Compiling...
- ⏳ **Frontend**: Ready to start

---

## 🎯 **EASIEST WAY TO START**

### Method 1: Use Start Scripts (Recommended)

**Terminal 1 - Start Backend:**
```bash
cd /Users/Arief/Desktop/378
./start-backend.sh
```

**Terminal 2 - Start Frontend:**
```bash
cd /Users/Arief/Desktop/378
./start-frontend.sh
```

### Method 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
export DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=dev-secret-key
export PORT=2000
cargo run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
export VITE_API_URL=http://localhost:2000/api
npm run dev
```

---

## 🌐 **ACCESS YOUR APP**

Once both are running:

- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000/api
- **Health Check**: http://localhost:2000/health
- **Database**: postgresql://localhost:5432/reconciliation_app
- **Redis**: redis://localhost:6379

---

## ✅ **VERIFY SERVICES**

Check if everything is running:

```bash
# Check Docker services
docker compose ps

# Should show:
# - reconciliation-postgres (running)
# - reconciliation-redis (running)
```

---

## 🔧 **TROUBLESHOOTING**

### Backend won't start
```bash
cd backend
cargo clean
cargo build
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules
npm install
```

### Database connection error
```bash
# Restart database
docker compose restart postgres
```

---

## 📚 **NEXT STEPS**

1. Start backend: `./start-backend.sh`
2. Start frontend: `./start-frontend.sh` (in new terminal)
3. Open browser: http://localhost:1000
4. Start developing! 🎉

---

**Status**: Ready to start! 🚀

