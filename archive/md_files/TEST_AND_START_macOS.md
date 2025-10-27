# 🧪 Testing Database, Redis & Starting Frontend (macOS)
## Step-by-Step Instructions for macOS

---

## ✅ **STEP 1: TEST POSTGRESQL DATABASE**

Open a terminal and run:

```bash
# Navigate to project
cd ~/Desktop/378

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

# Show Redis info
docker exec reconciliation-redis redis-cli info server | head -10
```

**Expected Output**: PONG

---

## ✅ **STEP 3: CHECK ALL RUNNING SERVICES**

```bash
# View all running containers
docker compose ps

# View status with resource usage
docker stats --no-stream

# View recent logs
docker compose logs --tail=20 postgres redis
```

---

## ✅ **STEP 4: START FRONTEND**

### **Setup Node.js PATH** (if needed):

First, check if `node` is available:
```bash
which node
node --version
```

If not found, add to PATH:
```bash
# Add to PATH for current session
export PATH="/usr/local/Cellar/node/24.10.0/bin:$PATH"

# Verify
node --version
npm --version
```

**Or** make it permanent by adding to your shell config:
```bash
# Add to ~/.zshrc (for zsh) or ~/.bash_profile (for bash)
echo 'export PATH="/usr/local/Cellar/node/24.10.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### **Start Frontend**:

```bash
# Navigate to frontend directory
cd ~/Desktop/378/frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:1000/
  ➜  Network: use --host to expose
```

---

## ✅ **STEP 5: ACCESS FRONTEND**

Once the server starts:

1. Open your browser
2. Go to: **http://localhost:1000**
3. You should see the Reconciliation Platform frontend!

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

### **Check Services**:
```bash
docker compose ps
```

### **Start Frontend**:
```bash
cd ~/Desktop/378/frontend
npm install  # First time only
npm run dev
```

---

## 📊 **EXPECTED RESULTS**

### **Database**:
- ✅ PostgreSQL version displayed (e.g., PostgreSQL 13.x)
- ✅ List of tables shown
- ✅ Connection successful

### **Redis**:
- ✅ Returns `PONG`
- ✅ Can set/get values successfully
- ✅ Connection successful

### **Frontend**:
- ✅ Server starts without errors
- ✅ Shows local URL: http://localhost:1000
- ✅ App loads in browser

---

## 🆘 **TROUBLESHOOTING**

### **Node.js not found?**
```bash
# Find where Node.js is installed
brew list node

# Add to PATH
export PATH="/usr/local/Cellar/node/24.10.0/bin:$PATH"

# Or reinstall
brew install node@18
```

### **Port 1000 already in use?**
```bash
# Find what's using port 1000
lsof -i :1000

# Kill the process
kill -9 <PID>

# Or change port in frontend
cd frontend
npm run dev -- --port 3000
```

### **Database not responding?**
```bash
# Check if container is running
docker ps | grep reconciliation-postgres

# View logs
docker compose logs postgres

# Restart
docker compose restart postgres
```

### **npm install fails?**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🎉 **SUCCESS!**

Once everything is working, you'll have:

✅ **Database**: Connected and responding to queries
✅ **Redis**: Connected and caching data
✅ **Frontend**: Running at http://localhost:1000
✅ **Development Environment**: Fully operational

---

## 🚀 **NEXT STEPS AFTER STARTING**

1. **Explore the frontend** at http://localhost:1000
2. **Test database queries** while frontend is running
3. **Check Redis values** to see caching in action
4. **View logs** in terminal to see requests

---

**Ready to start? Copy and paste the commands above!**

