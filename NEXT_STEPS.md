# ✅ Next Steps - Choose Your Deployment Method

## Current Situation
- ✅ All code is implemented
- ✅ PostgreSQL is running on your machine
- ⚠️  Using Windows PowerShell environment

---

## 🎯 Choose Your Method

### Method 1: Deploy with Docker (Recommended if you can start Docker)

**Step 1: Start Docker Desktop**
- Open Docker Desktop from Start Menu
- Wait for it to fully start
- Look for Docker icon in system tray

**Step 2: Run Deployment**
```powershell
.\deploy.ps1
```

**Step 3: Access**
- Frontend: http://localhost:1000
- Backend: http://localhost:2000

---

### Method 2: Deploy Locally Without Docker

**Step 1: Setup Database**
Run in PowerShell:
```powershell
# Create database
psql -U postgres -c "CREATE DATABASE reconciliation_app;"
```

**Step 2: Run Setup Script**
```powershell
.\deploy-local.ps1
```

**Step 3: Start Backend (Terminal 1)**
```powershell
cd backend
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/reconciliation_app"
cargo run
```

**Step 4: Start Frontend (Terminal 2)**
```powershell
cd frontend
npm install
npm run dev
```

**Step 5: Access**
- Frontend: http://localhost:1000
- Backend: http://localhost:2000

---

### Method 3: Manual Setup

#### 1. Database Setup
```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE reconciliation_app;
\q
```

#### 2. Run Migrations
```powershell
cd backend

# Set environment variable
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/reconciliation_app"

# Setup diesel
diesel setup

# Run migrations
diesel migration run

cd ..
```

#### 3. Start Backend
```powershell
cd backend
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/reconciliation_app"
cargo run
```

#### 4. Start Frontend
Open new PowerShell terminal:
```powershell
cd frontend
npm install
npm run dev
```

---

## 🚀 Recommended Next Action

**Since you have PostgreSQL running:**

```powershell
# Run local deployment script
.\deploy-local.ps1

# Then in separate terminals:
# Terminal 1: cd backend && cargo run
# Terminal 2: cd frontend && npm run dev
```

---

## 📋 Checklist

Before deploying:
- [ ] PostgreSQL is running
- [ ] Database connection works
- [ ] Rust/Cargo is installed
- [ ] Node.js is installed
- [ ] All environment variables set

After deploying:
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:1000
- [ ] Can access http://localhost:2000/health

---

## 🐛 Troubleshooting

### Database Connection Error
```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# Start if needed
Start-Service postgresql*
```

### Cargo Command Not Found
```powershell
# Install Rust
# Visit: https://rustup.rs/
# Or: winget install Rustlang.Rust
```

### Port Already in Use
```powershell
# Find process
netstat -ano | findstr :2000
netstat -ano | findstr :1000

# Kill process
Stop-Process -Id <PID>
```

---

## 🎉 You're Ready!

**Choose one method above and run the deployment!**

All code is ready, just need to start the services. 🚀

