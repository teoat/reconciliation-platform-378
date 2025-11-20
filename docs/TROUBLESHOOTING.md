# Troubleshooting Guide

**Last Updated**: January 2025  
**Status**: Active

## Overview

This guide helps you diagnose and resolve common issues when setting up, developing, or deploying the Reconciliation Platform.

---

## 🚨 Quick Diagnosis

### Application Won't Start

1. **Check environment variables**:
   ```bash
   # Backend will fail fast if required vars are missing
   # Check startup logs for validation errors
   cd backend && cargo run
   ```

2. **Check database connection**:
   ```bash
   # Test PostgreSQL connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Check Redis connection**:
   ```bash
   # Test Redis connection
   redis-cli ping
   ```

4. **Check ports are available**:
   ```bash
   # Backend port 2000
   lsof -i :2000
   
   # Frontend port 1000
   lsof -i :1000
   ```

---

## 🔧 Common Issues

### Backend Issues

#### Backend Fails to Start

**Error**: `Failed to load configuration: DATABASE_URL: Secret 'DATABASE_URL' not found`

**Solution**:
1. Ensure `.env` file exists in project root
2. Copy from template: `cp env.consolidated .env`
3. Set required variables (see [Environment Variables Guide](./deployment/ENVIRONMENT_VARIABLES.md))
4. Verify with: `cat .env | grep DATABASE_URL`

**Error**: `Connection refused` or `Database connection failed`

**Solution**:
1. Verify PostgreSQL is running:
   ```bash
   pg_isready -h localhost -p 5432
   ```
2. Check DATABASE_URL format:
   ```bash
   # Correct format
   DATABASE_URL=postgresql://user:password@localhost:5432/database
   ```
3. Test connection manually:
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

**Error**: `JWT_SECRET: Secret 'JWT_SECRET' not found`

**Solution**:
1. Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```
2. Add to `.env`:
   ```env
   JWT_SECRET=<generated-secret>
   JWT_REFRESH_SECRET=<different-generated-secret>
   ```

#### Backend Compilation Errors

**Error**: `error: failed to compile`

**Solution**:
1. Update Rust toolchain:
   ```bash
   rustup update stable
   ```
2. Clean and rebuild:
   ```bash
   cd backend
   cargo clean
   cargo build
   ```
3. Check Rust version (requires 1.70+):
   ```bash
   rustc --version
   ```

#### Database Migration Errors

**Error**: `Migration failed` or `Table already exists`

**Solution**:
1. Check migration status:
   ```bash
   cd backend
   cargo run --bin migrate -- --status
   ```
2. Reset database (development only):
   ```bash
   # WARNING: This deletes all data
   dropdb reconciliation_app
   createdb reconciliation_app
   cargo run --bin migrate
   ```
3. Rollback and reapply:
   ```bash
   cargo run --bin migrate -- --rollback
   cargo run --bin migrate
   ```

---

### Frontend Issues

#### Frontend Won't Start

**Error**: `Cannot find module` or `Module not found`

**Solution**:
1. Clear node_modules and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Clear Vite cache:
   ```bash
   rm -rf .vite-cache node_modules/.tmp
   npm run dev
   ```

**Error**: `Port 1000 already in use`

**Solution**:
1. Find process using port:
   ```bash
   lsof -i :1000
   ```
2. Kill the process or change port:
   ```bash
   # Change port in frontend/vite.config.ts or
   PORT=3000 npm run dev
   ```

#### TypeScript Errors

**Error**: `Type error: Property 'X' does not exist`

**Solution**:
1. Run type check:
   ```bash
   cd frontend
   npx tsc --noEmit
   ```
2. Check if types are properly imported
3. Verify tsconfig.json paths are correct
4. Clear TypeScript cache:
   ```bash
   rm -rf node_modules/.tmp tsconfig.tsbuildinfo
   ```

#### Build Errors

**Error**: `Build failed` or `Out of memory`

**Solution**:
1. Increase Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```
2. Check for circular dependencies:
   ```bash
   npx madge --circular src
   ```
3. Analyze bundle:
   ```bash
   npm run analyze-bundle
   ```

---

### Docker Issues

#### Docker Compose Won't Start

**Error**: `Port already allocated` or `Bind for port failed`

**Solution**:
1. Check which services are using ports:
   ```bash
   docker ps
   lsof -i :2000 -i :1000 -i :5432 -i :6379
   ```
2. Stop conflicting services or change ports in `docker-compose.yml`
3. Clean up Docker:
   ```bash
   docker-compose down -v
   docker system prune -f
   ```

**Error**: `Cannot connect to database` in Docker

**Solution**:
1. Ensure PostgreSQL container is healthy:
   ```bash
   docker-compose ps
   docker-compose logs postgres
   ```
2. Check network connectivity:
   ```bash
   docker-compose exec backend ping postgres
   ```
3. Verify DATABASE_URL uses service name:
   ```env
   DATABASE_URL=postgresql://user:pass@postgres:5432/db
   ```

#### Container Keeps Restarting

**Solution**:
1. Check container logs:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```
2. Check exit code:
   ```bash
   docker-compose ps
   ```
3. Common causes:
   - Missing environment variables
   - Database connection failure
   - Port conflicts
   - Invalid configuration

---

### Authentication Issues

#### Login Fails

**Error**: `Invalid credentials` or `Authentication failed`

**Solution**:
1. Verify user exists in database:
   ```bash
   psql $DATABASE_URL -c "SELECT email FROM users;"
   ```
2. Check password hashing:
   - Ensure bcrypt is working correctly
   - Verify password is being hashed before storage
3. Check JWT_SECRET is set correctly
4. Verify token expiration settings

#### Token Refresh Fails

**Error**: `Token expired` or `Invalid refresh token`

**Solution**:
1. Check JWT_REFRESH_SECRET is set and different from JWT_SECRET
2. Verify token expiration times:
   ```env
   JWT_EXPIRATION_HOURS=24
   JWT_REFRESH_EXPIRATION=86400
   ```
3. Check token storage (should use sessionStorage, not localStorage)
4. Clear browser storage and try again

---

### Performance Issues

#### Slow API Responses

**Diagnosis**:
1. Check database query performance:
   ```bash
   # Enable query logging in PostgreSQL
   # Check slow query log
   ```
2. Check Redis connection:
   ```bash
   redis-cli ping
   redis-cli info stats
   ```
3. Monitor backend logs for slow queries

**Solution**:
1. Add database indexes (see `scripts/apply-db-indexes.sh`)
2. Enable query caching
3. Check connection pool size
4. Profile slow endpoints

#### Frontend Slow to Load

**Diagnosis**:
1. Analyze bundle size:
   ```bash
   npm run analyze-bundle
   ```
2. Check network tab in browser DevTools
3. Verify code splitting is working

**Solution**:
1. Enable lazy loading for routes
2. Optimize images and assets
3. Check for large dependencies
4. Enable compression

---

### Development Issues

#### Pre-commit Hooks Failing

**Error**: `lint-staged failed` or `Type check failed`

**Solution**:
1. Fix linting errors:
   ```bash
   npm run lint:fix
   ```
2. Fix type errors:
   ```bash
   npx tsc --noEmit
   ```
3. Format code:
   ```bash
   npm run format
   ```
4. Skip hooks (not recommended):
   ```bash
   git commit --no-verify
   ```

#### Tests Failing

**Error**: `Test suite failed` or `Tests timeout`

**Solution**:
1. Run tests individually:
   ```bash
   npm test -- --testNamePattern="specific test"
   ```
2. Check test database is set up correctly
3. Clear test cache:
   ```bash
   npm test -- --clearCache
   ```
4. Check for environment variable issues in tests

---

## 🔍 Debugging Tools

### Backend Debugging

1. **Enable debug logging**:
   ```env
   RUST_LOG=debug
   ```

2. **Check backend logs**:
   ```bash
   # If running with cargo
   RUST_LOG=debug cargo run
   
   # If running in Docker
   docker-compose logs -f backend
   ```

3. **Database query debugging**:
   ```env
   # Enable SQL logging
   RUST_LOG=diesel::query_builder=debug
   ```

### Frontend Debugging

1. **Enable debug mode**:
   ```env
   VITE_DEBUG=true
   VITE_LOG_LEVEL=debug
   ```

2. **Browser DevTools**:
   - Network tab: Check API requests
   - Console: Check for errors
   - Application tab: Check storage

3. **React DevTools**:
   - Install React DevTools extension
   - Check component state and props

---

## 📞 Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Check [Environment Variables Guide](./deployment/ENVIRONMENT_VARIABLES.md)
3. ✅ Check application logs
4. ✅ Verify environment variables are set
5. ✅ Check database and Redis are running

### When Reporting Issues

Include:
- Error message (full text)
- Steps to reproduce
- Environment (OS, Node version, Rust version)
- Relevant logs
- Environment variable status (without secrets)

### Resources

- **Documentation**: [docs/](./)
- **Environment Variables**: [docs/deployment/ENVIRONMENT_VARIABLES.md](./deployment/ENVIRONMENT_VARIABLES.md)
- **API Documentation**: [docs/API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **GitHub Issues**: Report bugs and feature requests

---

## ✅ Health Checks

### Verify Installation

```bash
# 1. Backend health
curl http://localhost:2000/api/health

# 2. Backend readiness
curl http://localhost:2000/api/ready

# 3. Frontend accessible
curl http://localhost:1000

# 4. Database connection
psql $DATABASE_URL -c "SELECT 1;"

# 5. Redis connection
redis-cli ping
```

### Verify Environment

```bash
# Check required environment variables
echo $DATABASE_URL
echo $JWT_SECRET
echo $JWT_REFRESH_SECRET

# Validate environment (backend will do this on startup)
cd backend && cargo run
```

---

**Last Updated**: January 2025  
**Contributing**: If you find a solution not listed here, please update this guide!

