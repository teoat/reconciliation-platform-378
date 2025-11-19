# Troubleshooting Guide

**Last Updated**: January 2025  
**Status**: Active

---

## Common Issues

### Build Errors

#### Frontend Build Fails

**Symptoms:**
- `npm run build` fails
- TypeScript errors
- Module resolution errors

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript version
npm list typescript

# Verify tsconfig.json
npx tsc --noEmit
```

#### Backend Build Fails

**Symptoms:**
- `cargo build` fails
- Compilation errors
- Dependency conflicts

**Solutions:**
```bash
# Clean and rebuild
cargo clean
cargo build

# Update dependencies
cargo update

# Check Rust version
rustc --version  # Should be 1.70+
```

---

### Runtime Errors

#### Port Already in Use

**Symptoms:**
- "Port 2000 already in use"
- "Port 1000 already in use"

**Solutions:**
```bash
# Find process using port
lsof -i :2000  # Backend
lsof -i :1000  # Frontend

# Kill process
kill -9 <PID>

# Or change port in .env
BACKEND_PORT=2001
FRONTEND_PORT=1001
```

#### Database Connection Failed

**Symptoms:**
- "Connection refused"
- "Database not found"

**Solutions:**
```bash
# Check Docker containers
docker-compose ps
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Verify connection string in .env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

---

### Development Issues

#### Hot Reload Not Working

**Symptoms:**
- Changes not reflected
- Need to manually refresh

**Solutions:**
```bash
# Restart dev server
npm run dev  # Frontend
cargo run    # Backend

# Clear browser cache
# Check file watcher limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### Type Errors

**Symptoms:**
- TypeScript errors in IDE
- Type mismatches

**Solutions:**
```bash
# Restart TypeScript server (VS Code)
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# Verify types
npx tsc --noEmit

# Check type definitions
npm list @types/react
```

---

### Docker Issues

#### Containers Won't Start

**Symptoms:**
- `docker-compose up` fails
- Containers exit immediately

**Solutions:**
```bash
# Check logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

#### Volume Mount Issues

**Symptoms:**
- Files not syncing
- Permission errors

**Solutions:**
```bash
# Check volume mounts
docker-compose config

# Fix permissions (Linux/Mac)
sudo chown -R $USER:$USER .

# Use named volumes instead of bind mounts
```

---

### Testing Issues

#### Tests Fail Locally

**Symptoms:**
- Tests pass in CI but fail locally
- Environment differences

**Solutions:**
```bash
# Use same Node version as CI
nvm use 18

# Clear test cache
npm test -- --clearCache

# Run with same environment
NODE_ENV=test npm test
```

#### Coverage Not Generated

**Symptoms:**
- Coverage report missing
- Low coverage numbers

**Solutions:**
```bash
# Run with coverage flag
npm run test:coverage

# Check coverage config
cat jest.config.js

# Verify coverage thresholds
```

---

## Debugging Tips

### Frontend Debugging

```typescript
// Use React DevTools
// Add breakpoints in browser DevTools
// Check Network tab for API calls
// Review Console for errors

// Enable verbose logging
localStorage.setItem('debug', 'true');
```

### Backend Debugging

```rust
// Use logger for debugging
logger.debug("Debug message", { context });

// Enable verbose logging
RUST_LOG=debug cargo run

// Use rust-gdb for debugging
rust-gdb target/debug/backend
```

---

## Getting Help

1. **Check logs:**
   - Frontend: Browser console
   - Backend: `docker-compose logs backend`
   - Database: `docker-compose logs postgres`

2. **Search documentation:**
   - [Getting Started](./getting-started.md)
   - [Coding Standards](./coding-standards.md)
   - [API Documentation](../api/)

3. **Check issues:**
   - GitHub Issues
   - Team chat

4. **Ask for help:**
   - Include error messages
   - Include relevant logs
   - Describe steps to reproduce

---

**Still stuck?** Open an issue with:
- Error messages
- Steps to reproduce
- Environment details
- Relevant logs

