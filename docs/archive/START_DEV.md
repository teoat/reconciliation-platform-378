# 🚀 START DEVELOPMENT SERVER
## Reconciliation Platform - Quick Start

**Status**: Core services running ✅  
**Next**: Start application services

---

## ⚡ **QUICK START (Recommended)**

### Terminal 1: Backend
```bash
cd backend
export DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=dev-secret-key-change-in-production
export PORT=2000

cargo run
```

### Terminal 2: Frontend
```bash
cd frontend
export VITE_API_URL=http://localhost:2000/api
export VITE_WS_URL=ws://localhost:2000

npm run dev
```

---

## 🎯 **ACCESS YOUR APP**

Once both are running:
- **Frontend**: http://localhost:1000
- **Backend API**: http://localhost:2000
- **Health Check**: http://localhost:2000/health

---

## ✅ **PREREQUISITES CHECK**

Run these to verify everything is ready:

```bash
# Check database is running
docker compose ps

# Check you have Rust
cargo --version

# Check you have Node
node --version
npm --version
```

---

## 🛠️ **ALTERNATIVE: ONE COMMAND START**

Save this as `start-dev.sh`:

```bash
#!/bin/bash
cd backend && cargo run &
cd frontend && npm run dev
```

Then run: `chmod +x start-dev.sh && ./start-dev.sh`

---

**Ready? Follow the Quick Start above!** 🚀

