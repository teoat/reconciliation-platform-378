# Database Setup Guide

Quick guide to start and configure the database for development and testing.

## 🚀 Quick Start

### Option 1: Start Database Only (Recommended for Testing)

```bash
# Start just the PostgreSQL database
./scripts/start-database.sh test

# Setup test database
./scripts/setup-test-database.sh
```

### Option 2: Start with Docker Compose

```bash
# Start database and Redis
docker-compose up -d postgres redis

# Or start all services
docker-compose up -d
```

## 📋 Database Configuration

### Default Settings

- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgres_pass`
- **Database**: `reconciliation_app` (dev) or `reconciliation_test` (test)

### Connection Strings

**Development:**
```
postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
```

**Testing:**
```
postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test
```

## 🧪 Setting Up Test Database

1. **Start the database:**
   ```bash
   ./scripts/start-database.sh test
   ```

2. **Create test database:**
   ```bash
   ./scripts/setup-test-database.sh
   ```

3. **Run migrations (if needed):**
   ```bash
   cd backend
   export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"
   diesel migration run
   ```

4. **Run tests:**
   ```bash
   cd backend
   export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"
   cargo test
   ```

## 🔧 Manual Setup

### Using Docker Compose

```bash
# Start only PostgreSQL
docker-compose up -d postgres

# Check status
docker-compose ps postgres

# View logs
docker-compose logs -f postgres

# Stop database
docker-compose stop postgres

# Remove database (⚠️ deletes data)
docker-compose down postgres
```

### Using Docker Directly

```bash
# Start PostgreSQL container
docker run -d \
  --name reconciliation-postgres \
  -e POSTGRES_DB=reconciliation_app \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres_pass \
  -p 5432:5432 \
  postgres:15-alpine

# Create test database
docker exec -it reconciliation-postgres psql -U postgres -c "CREATE DATABASE reconciliation_test;"
```

## 📊 Verify Database Connection

### Using psql

```bash
# Connect to development database
docker exec -it reconciliation-postgres psql -U postgres -d reconciliation_app

# Connect to test database
docker exec -it reconciliation-postgres psql -U postgres -d reconciliation_test

# List databases
docker exec -it reconciliation-postgres psql -U postgres -c "\l"
```

### Using Environment Variables

```bash
# Set database URL
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"

# Test connection (if you have psql installed locally)
psql $DATABASE_URL -c "SELECT version();"
```

## 🗄️ Database Migrations

### Run Migrations

```bash
cd backend

# Development database
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"
diesel migration run

# Test database
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"
diesel migration run
```

### Create New Migration

```bash
cd backend
diesel migration generate migration_name
```

## 🧹 Cleanup

### Stop Database

```bash
# Stop but keep data
docker-compose stop postgres

# Stop and remove containers (keeps volumes)
docker-compose down postgres

# Stop and remove everything including volumes (⚠️ deletes data)
docker-compose down -v postgres
```

### Reset Database

```bash
# Drop and recreate database
docker exec -it reconciliation-postgres psql -U postgres <<EOF
DROP DATABASE IF EXISTS reconciliation_app;
CREATE DATABASE reconciliation_app;
EOF

# Then run migrations
cd backend
export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"
diesel migration run
```

## 🐛 Troubleshooting

### Database Not Starting

```bash
# Check Docker is running
docker info

# Check container status
docker ps -a | grep postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Port Already in Use

If port 5432 is already in use:

1. **Change port in docker-compose.yml:**
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead
   ```

2. **Or stop existing PostgreSQL:**
   ```bash
   # macOS/Linux
   sudo service postgresql stop
   
   # Or find and kill the process
   lsof -i :5432
   kill -9 <PID>
   ```

### Connection Refused

```bash
# Check if container is running
docker ps | grep postgres

# Check if port is exposed
docker port reconciliation-postgres

# Test connection from container
docker exec -it reconciliation-postgres psql -U postgres -c "SELECT 1;"
```

## 📝 Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_pass
POSTGRES_PORT=5432

# For backend tests
TEST_DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test
DATABASE_URL=postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app
```

## ✅ Verification Checklist

- [ ] Docker is running
- [ ] Database container is up: `docker ps | grep postgres`
- [ ] Can connect: `docker exec -it reconciliation-postgres psql -U postgres -c "SELECT 1;"`
- [ ] Test database exists: `docker exec -it reconciliation-postgres psql -U postgres -c "\l" | grep reconciliation_test`
- [ ] Migrations run successfully
- [ ] Tests can connect to database

---

**Last Updated**: January 2025

