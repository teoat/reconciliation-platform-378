# 🧪 Testing Database, Redis & Starting Frontend
## Step-by-Step Instructions

---

## ✅ **STEP 1: TEST POSTGRESQL DATABASE**

Open a new terminal and run:

```bash
# Navigate to project
cd /Users/Arief/Desktop/378

# Test database connection
docker exec reconciliation-postgres psql -U reconciliation_user -d reconciliation_app -c "SELECT version();"

# Show all tables
docker exec reconciliation-postgres psql -U reconciliation_user -d reconciliation_app -c "\dt"

# Show database info
docker exec reconciliation-postgres psql -U reconciliation_user -d reconciliation_app -c "\l"
```

**Expected Output**: PostgreSQL version information and list of tables

---

## ✅ **STEP 2: TEST REDIS**

In the same terminal:

```bash
# Test Redis connection
docker exec reconciliation-redis redis-cli ping

# Expected output: PONG

# Set a test value
docker exec reconciliation-redis redis-cli set test "Hello Redis"

# Get the value
docker exec reconciliation-redis redis-cli get test

# Expected output: Hello Redis
```

**Expected Output**: PONG

---

## ✅ **STEP 3: CHECK ALL RUNNING SERVICES**

```bash
# View all running containers
docker compose ps

# View logs
docker compose logs --tail=20
```

---

## ✅ **STEP 4: START FRONTEND**

### **Option A: Using Windows Command Prompt** (Recommended)

1. Open Command Prompt (cmd)
2. Run these commands:

```cmd
cd C:\Users\Arief\Desktop\378

rem Set PATH to include Node.js
set PATH=C:\Program Files\nodejs;%PATH%

rem Navigate to frontend
cd frontend

rem Install dependencies
npm install

rem Start development server
npm run dev
```

### **Option B: Using PowerShell**

```powershell
# Navigate to project
cd C:\Users\Arief\Desktop\378

# Add Node.js to PATH (adjust if installed elsewhere)
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### **Option C: Using Git Bash or WSL**

```bash
cd /mnt/c/Users/Arief/Desktop/378/frontend
npm install
npm run dev
```

---

## ✅ **STEP 5: ACCESS FRONTEND**

Once the frontend server starts, you'll see:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:1000/
```

**Open in browser**: http://localhost:1000

---

## 🎯 **QUICK COMMAND SUMMARY**

### **Test Database**:
```bash
docker exec reconciliation-postgres psql -U reconciliation_user -d reconciliation_app -c "SELECT version();"
```

### **Test Redis**:
```bash
docker exec reconciliation-redis redis-cli ping
```

### **Start Frontend**:
```bash
cd frontend
npm install
npm run dev
```

---

## 📊 **EXPECTED RESULTS**

### **Database**:
- ✅ PostgreSQL version displayed
- ✅ List of tables shown
- ✅ Connection successful

### **Redis**:
- ✅ Returns PONG
- ✅ Can set/get values
- ✅ Connection successful

### **Frontend**:
- ✅ Development server starts
- ✅ Accessible at http://localhost:1000
- ✅ React app loads in browser

---

## 🆘 **TROUBLESHOOTING**

### **Database not responding?**
```bash
# Check if container is running
docker ps | grep reconciliation-postgres

# View database logs
docker compose logs postgres

# Restart database
docker compose restart postgres
```

### **Redis not responding?**
```bash
# Check if container is running
docker ps | grep reconciliation-redis

# View Redis logs
docker compose logs redis

# Restart Redis
docker compose restart redis
```

### **Frontend won't start?**
1. Check Node.js is installed: `node --version`
2. If not in PATH, add it manually
3. Try running from different terminal (cmd, PowerShell, Git Bash)
4. Check if port 1000 is available: `netstat -ano | findstr :1000`

---

## 🎉 **SUCCESS!**

Once everything is working:
- ✅ Database: Connected and responding
- ✅ Redis: Connected and responding
- ✅ Frontend: Running on http://localhost:1000

You now have a complete development environment!

---

**Ready to start? Copy and paste the commands above into your terminal!**

