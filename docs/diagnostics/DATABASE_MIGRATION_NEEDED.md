# Database Migration Required

## 🔴 Issue

**Error**: `column users.username does not exist`

**Root Cause**: Database migrations have not been run. The database tables either don't exist or are missing columns.

**Evidence**:
- Backend logs show: "Critical tables missing: users, projects, reconciliation_jobs, reconciliation_results"
- Migration file `20240101000000_create_base_schema/up.sql` defines `username VARCHAR(255)` column
- But database doesn't have this column

## ✅ Solution: Run Database Migrations

### Option 1: Using Diesel CLI (Recommended)

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/backend

# Install diesel CLI if not already installed
cargo install diesel_cli --no-default-features --features postgres

# Run migrations
diesel migration run
```

### Option 2: Using Backend Binary

If the backend has a migration command:

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/backend
cargo run --bin reconciliation-backend -- --migrate
```

### Option 3: Manual SQL Execution

If migrations can't be run automatically, execute the migration SQL manually:

```bash
cd /Users/Arief/Documents/GitHub/reconciliation-platform-378/backend
psql -h localhost -U reconciliation_user -d reconciliation_app -f migrations/20240101000000_create_base_schema/up.sql
```

## 📋 What Migrations Will Create

1. **users table** - With `username` column (nullable)
2. **projects table**
3. **reconciliation_jobs table**
4. **reconciliation_results table**
5. All necessary indexes

## 🧪 After Running Migrations

1. **Restart backend** (if it's running):
   ```bash
   # Stop backend (Ctrl+C in terminal)
   # Then restart:
   cd backend
   export $(cat .env | grep -v '^#' | xargs)
   cargo run --bin reconciliation-backend
   ```

2. **Test health endpoint**:
   ```bash
   curl http://localhost:2000/health
   ```

3. **Create demo users**:
   ```bash
   cd /Users/Arief/Documents/GitHub/reconciliation-platform-378
   ./scripts/create-demo-users-and-test.sh
   ```

## 🔍 Verify Migrations Ran

Check if tables exist:

```bash
psql -h localhost -U reconciliation_user -d reconciliation_app -c "\d users"
```

Should show the `username` column.

---

**Priority**: Run migrations before creating users or testing authentication.

