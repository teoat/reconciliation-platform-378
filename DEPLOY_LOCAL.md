# 🚀 Deploy Locally Without Docker

## Quick Local Deployment

### Prerequisites Check

Run these commands to check what's available:

```bash
# Check PostgreSQL
which psql
psql --version

# Check if running
brew services list | grep postgres

# Check Rust
cargo --version

# Check Node
node --version
```

### Step 1: Setup Database

**If PostgreSQL is not running:**
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Wait 10 seconds for it to start
sleep 10

# Create database
createdb reconciliation_app
```

**If PostgreSQL is already running:**
```bash
# Just create database
createdb reconciliation_app
```

### Step 2: Run Migrations

```bash
cd backend

# Set database URL
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/reconciliation_app"

# Setup diesel
diesel setup

# Run migrations
diesel migration run

cd ..
```

### Step 3: Start Backend

```bash
cd backend

# Export environment
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/reconciliation_app"
export RUST_LOG=info
export HOST=0.0.0.0
export PORT=2000

# Start backend
cargo run

# Backend will run on http://localhost:2000
```

**Keep this terminal window open!**

### Step 4: Start Frontend (New Terminal)

Open a new terminal and run:

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Start frontend
npm run dev

# Frontend will run on http://localhost:1000
```

### Step 5: Access Application

- **Frontend**: http://localhost:1000
- **Backend**: http://localhost:2000
- **Health Check**: http://localhost:2000/health

---

## Quick One-Liner Setup Script

Save this as `deploy_local.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting local deployment..."

# Start PostgreSQL if not running
if ! pg_isready -q; then
    echo "Starting PostgreSQL..."
    brew services start postgresql@15
    sleep 10
fi

# Create database
createdb reconciliation_app 2>/dev/null || echo "Database exists"

# Setup backend
cd backend
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/reconciliation_app"
diesel setup 2>/dev/null || true
diesel migration run
cd ..

echo "✅ Database ready!"
echo ""
echo "Now run in separate terminals:"
echo "  Terminal 1: cd backend && cargo run"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Frontend: http://localhost:1000"
echo "Backend:  http://localhost:2000"
```

---

## Troubleshooting

### PostgreSQL Connection Error
```bash
# Check if PostgreSQL is running
pg_isready

# Start it if not
brew services start postgresql@15
```

### Migration Errors
```bash
# Reset database
dropdb reconciliation_app
createdb reconciliation_app

# Run migrations again
cd backend
diesel migration run
```

### Port Already in Use
```bash
# Find process
lsof -i :2000  # Backend
lsof -i :1000  # Frontend

# Kill it
lsof -ti:2000 | xargs kill -9
lsof -ti:1000 | xargs kill -9
```

---

## Environment Variables

Create `backend/.env`:
```
DATABASE_URL=postgresql://your_user@localhost:5432/reconciliation_app
RUST_LOG=info
PORT=2000
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:2000
```

---

## Commands Summary

```bash
# Setup database
brew services start postgresql@15
createdb reconciliation_app

# Run migrations  
cd backend
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/reconciliation_app"
diesel migration run

# Start backend (terminal 1)
cd backend && cargo run

# Start frontend (terminal 2)
cd frontend && npm run dev

# Access
open http://localhost:1000
```

---

**This method doesn't require Docker!** 🎉

