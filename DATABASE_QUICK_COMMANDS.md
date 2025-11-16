# 🚀 Database Quick Commands

Quick reference for all database operations.

## 📋 Start/Stop Database

```bash
# Start database (test environment)
./scripts/start-database.sh test

# Start database (development environment)
./scripts/start-database.sh dev

# Stop database
docker-compose stop postgres

# Restart database
docker-compose restart postgres
```

## 🔗 Connection Strings

```bash
# Development
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"

# Testing
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"
```

## 🗄️ Database Operations

### Connect to Database
```bash
# Test database
docker exec -it reconciliation-postgres psql -U postgres -d reconciliation_test

# Development database
docker exec -it reconciliation-postgres psql -U postgres -d reconciliation_app
```

### View Tables
```bash
docker exec reconciliation-postgres psql -U postgres -d reconciliation_test -c "\dt"
```

### View All Databases
```bash
docker exec reconciliation-postgres psql -U postgres -c "\l"
```

### Check Database Status
```bash
docker-compose ps postgres
```

## 🔄 Migrations

### List Migrations
```bash
cd backend
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"
diesel migration list
```

### Run Migrations
```bash
cd backend
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"
diesel migration run
```

### Revert Last Migration
```bash
cd backend
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"
diesel migration revert
```

## 🧪 Testing

### Run Tests
```bash
cd backend
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"
cargo test
```

### Run Specific Test
```bash
cd backend
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"
cargo test test_name
```

## 📊 Database Info

### Check Database Size
```bash
docker exec reconciliation-postgres psql -U postgres -d reconciliation_test -c "SELECT pg_size_pretty(pg_database_size('reconciliation_test'));"
```

### List All Indexes
```bash
docker exec reconciliation-postgres psql -U postgres -d reconciliation_test -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;"
```

### View Table Structure
```bash
docker exec reconciliation-postgres psql -U postgres -d reconciliation_test -c "\d password_entries"
```

## 🧹 Cleanup

### Drop Test Database
```bash
docker exec reconciliation-postgres psql -U postgres -c "DROP DATABASE IF EXISTS reconciliation_test;"
```

### Recreate Test Database
```bash
docker exec reconciliation-postgres psql -U postgres -c "DROP DATABASE IF EXISTS reconciliation_test;"
docker exec reconciliation-postgres psql -U postgres -c "CREATE DATABASE reconciliation_test;"
```

### Remove All Data (⚠️ Destructive)
```bash
docker-compose down -v postgres
```

## 📝 Complete Setup Script

```bash
# Run all database setup tasks
./scripts/run-all-database-setup.sh
```

---

**Quick Reference**: Save this file for easy access to all database commands!

