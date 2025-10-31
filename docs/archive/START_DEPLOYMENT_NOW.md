# 🚀 START DEPLOYMENT NOW

## Current Status
- ✅ All code implemented
- ✅ All configuration ready
- ⏳ Docker Desktop needs to be started

## Step-by-Step Instructions

### Step 1: Start Docker Desktop

**Option A: Manual Start (Recommended)**
1. Open Finder
2. Go to Applications folder
3. Find and double-click "Docker" application
4. Wait for the Docker icon to appear in the menu bar (top right)
5. Wait until you see "Docker Desktop is running"

**Option B: Command Line**
```bash
open -a Docker
```

**Option C: Spotlight**
1. Press `Cmd + Space`
2. Type "Docker"
3. Press Enter
4. Wait for Docker to start

### Step 2: Wait for Docker to Start

**How to know Docker is ready:**
- ✓ Whale icon appears in menu bar
- ✓ Menu shows "Docker Desktop is running"
- ✓ Usually takes 30-60 seconds

### Step 3: Verify Docker is Running

Open a terminal and run:
```bash
docker ps
```

**Expected output:**
```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

(May be empty, that's OK. Just shouldn't show error)

### Step 4: Deploy the Application

Once Docker is running, run:
```bash
bash deploy.sh
```

**OR manually:**
```bash
docker-compose up -d
```

### Step 5: Check Services

```bash
# View running containers
docker ps

# View logs
docker-compose logs -f

# Check backend health
curl http://localhost:2000/health
```

### Step 6: Access Application

- **Frontend**: Open http://localhost:1000 in browser
- **Backend API**: http://localhost:2000

---

## If Docker Won't Start

### Troubleshooting

**Issue**: Docker Desktop won't open
- Restart your Mac
- Check if Docker is already running in background
- Try: `ps aux | grep Docker`

**Issue**: "Cannot connect to Docker daemon"
- Docker is not fully started yet, wait longer
- Check Docker menu bar icon status

**Issue**: Port already in use
```bash
# Kill processes on ports
lsof -ti:1000 | xargs kill -9  # Frontend
lsof -ti:2000 | xargs kill -9  # Backend
lsof -ti:5432 | xargs kill -9  # Database
```

---

## Alternative: Deploy Without Docker

If you cannot use Docker:

1. **Install PostgreSQL locally**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb reconciliation_app
```

2. **Run Migrations**
```bash
cd backend
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/reconciliation_app"
diesel migration run
```

3. **Start Backend**
```bash
cd backend
cargo run
```

4. **Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Quick Reference

```bash
# Start Docker
open -a Docker

# Wait 30-60 seconds, then verify
docker ps

# Deploy
bash deploy.sh

# Or manually
docker-compose up -d

# View logs
docker-compose logs -f

# Check services
curl http://localhost:2000/health

# Open browser
open http://localhost:1000
```

---

## 🎯 Your Next Action

**Right now, do this:**

1. **Start Docker Desktop** (see instructions above)
2. **Wait 60 seconds**
3. **Run**: `docker ps` (to verify)
4. **Run**: `bash deploy.sh` (to deploy)

**That's it!** Your app will be live at http://localhost:1000

---

## Need Help?

- Check if Docker is starting: Look for whale icon in menu bar
- Check Docker logs: Docker Desktop → View → Logs
- Still stuck? Try manual deployment (see above)

