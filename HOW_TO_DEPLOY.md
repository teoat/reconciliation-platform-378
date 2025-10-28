# How to Deploy - Quick Guide
## 378 Reconciliation Platform

---

## ✅ Current Status: Infrastructure Ready!

Your deployment infrastructure is ready:
- ✅ PostgreSQL running on port 5432
- ✅ Redis running on port 6379
- ✅ Environment files configured
- ✅ Backend compiles successfully
- ✅ Frontend configured

---

## 🚀 Simple Deployment (Choose One Method)

### Method 1: Manual Start (Recommended for Development)

Open **two terminals**:

**Terminal 1 - Backend:**
```bash
cd /Users/Arief/Desktop/378/backend
cargo run
```

**Terminal 2 - Frontend:**
```bash
cd /Users/Arief/Desktop/378/frontend
npm run dev
```

**That's it!** Your app will be running at:
- Frontend: http://localhost:1000
- Backend: http://localhost:2000

---

### Method 2: Docker Compose

```bash
cd /Users/Arief/Desktop/378

# Start backend and frontend
docker compose up -d backend frontend

# Check status
docker compose ps

# View logs
docker compose logs -f backend
```

---

## 🔧 Fix Database Configuration

The backend `.env` file needs to match the database name.

**Update `backend/.env`:**
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/reconciliation_app
DB_PASSWORD=password
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
HOST=0.0.0.0
PORT=2000
RUST_LOG=info
CORS_ORIGINS=http://localhost:1000
ENABLE_RATE_LIMITING=true
ENABLE_METRICS=true
```

---

## ✅ Verification

Once services start, test:

```bash
# Health check
curl http://localhost:2000/health

# Should return JSON with status
```

---

## 📊 Summary

**What's Ready:**
- ✅ Infrastructure (Postgres, Redis)
- ✅ Code (compiles successfully)
- ✅ Configuration files

**What to Do:**
1. Update `backend/.views` database URL
2. Start backend (`cargo run`)
3. Start frontend (`npm run dev`)
4. Access http://localhost:1000

---

## 🆘 Troubleshooting

**Backend won't start?**
```bash
cd backend
cargo clean
cargo run
```

**Frontend won't start?**
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

**Database connection error?**
Check the `DATABASE_URL` in `backend/.env` matches:
`postgresql://postgres:password@localhost:5432/reconciliation_app`

---

**You're ready to deploy!** Follow Method 1 above.

