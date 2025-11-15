# 378 Reconciliation Platform - Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when using the 378 Reconciliation Platform. It covers both backend and frontend problems, along with system-level issues.

## Quick Reference

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `VALIDATION_ERROR` | Request validation failed | Check request format and required fields |
| `UNAUTHORIZED` | Authentication required | Verify JWT token and login credentials |
| `FORBIDDEN` | Insufficient permissions | Check user role and project access |
| `NOT_FOUND` | Resource not found | Verify resource ID and existence |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait for rate limit reset |
| `INTERNAL_ERROR` | Server error | Check logs and contact support |

### Health Check Commands

```bash
# Check application status
curl -f http://localhost:8080/health

# Check database connection
psql -h localhost -U reconciliation_user -d reconciliation_platform -c "SELECT 1;"

# Check Redis connection
redis-cli ping

# Check system resources
free -h && df -h && top -bn1
```

## Backend Issues

### Database Connection Problems

#### Error: "Connection refused" or "Database unavailable"

**Symptoms:**
- Application fails to start
- Database queries timeout
- Error logs show connection errors

**Solutions:**

1. **Check PostgreSQL status**
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

2. **Verify database configuration**
```bash
# Check if database exists
sudo -u postgres psql -c "\l" | grep reconciliation_platform

# Check user permissions
sudo -u postgres psql -c "\du" | grep reconciliation_user
```

3. **Test connection manually**
```bash
psql -h localhost -U reconciliation_user -d reconciliation_platform
```

4. **Check connection string**
```bash
# Verify DATABASE_URL in .env file
echo $DATABASE_URL
```

5. **Check PostgreSQL logs**
```bash
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

#### Error: "Migration failed" or "Schema mismatch"

**Symptoms:**
- Database migrations fail
- Schema version conflicts
- Table creation errors

**Solutions:**

1. **Check migration status**
```bash
cd backend
diesel migration list
```

2. **Run pending migrations**
```bash
diesel migration run
```

3. **Reset migrations (development only)**
```bash
diesel migration redo
```

4. **Check database schema**
```bash
psql -h localhost -U reconciliation_user -d reconciliation_platform -c "\dt"
```

### Redis Connection Issues

#### Error: "Redis connection failed"

**Symptoms:**
- Cache operations fail
- Session management errors
- WebSocket connection issues

**Solutions:**

1. **Check Redis status**
```bash
sudo systemctl status redis-server
sudo systemctl start redis-server
```

2. **Test Redis connection**
```bash
redis-cli ping
# Should return "PONG"
```

3. **Check Redis configuration**
```bash
redis-cli config get "*"
```

4. **Check Redis logs**
```bash
sudo tail -f /var/log/redis/redis-server.log
```

5. **Verify Redis URL**
```bash
echo $REDIS_URL
```

### Authentication Issues

#### Error: "Invalid JWT token" or "Token expired"

**Symptoms:**
- API requests return 401 Unauthorized
- User sessions expire unexpectedly
- Login fails

**Solutions:**

1. **Check JWT secret**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET
```

2. **Verify token format**
```bash
# Decode JWT token (use jwt.io or similar)
echo "your_jwt_token" | base64 -d
```

3. **Check token expiration**
```bash
# Token should contain 'exp' field with future timestamp
```

4. **Refresh token**
```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Authorization: Bearer your_jwt_token"
```

#### Error: "User not found" or "Invalid credentials"

**Solutions:**

1. **Verify user exists**
```bash
psql -h localhost -U reconciliation_user -d reconciliation_platform \
  -c "SELECT id, email FROM users WHERE email = 'user@example.com';"
```

2. **Check password hash**
```bash
psql -h localhost -U reconciliation_user -d reconciliation_platform \
  -c "SELECT password_hash FROM users WHERE email = 'user@example.com';"
```

3. **Reset user password**
```bash
# Use admin interface or database directly
UPDATE users SET password_hash = 'new_hash' WHERE email = 'user@example.com';
```

### File Upload Issues

#### Error: "File upload failed" or "File too large"

**Symptoms:**
- File uploads fail
- Large files rejected
- Processing errors

**Solutions:**

1. **Check file size limits**
```bash
# Check MAX_FILE_SIZE in .env
echo $MAX_FILE_SIZE
```

2. **Verify upload directory**
```bash
ls -la ./uploads/
sudo chown -R www-data:www-data ./uploads/
sudo chmod -R 755 ./uploads/
```

3. **Check disk space**
```bash
df -h
```

4. **Verify file permissions**
```bash
sudo chmod 755 ./uploads/
```

#### Error: "File processing failed"

**Solutions:**

1. **Check file format**
```bash
file uploaded_file.csv
```

2. **Verify file content**
```bash
head -5 uploaded_file.csv
```

3. **Check processing logs**
```bash
sudo journalctl -u reconciliation-platform -f | grep "processing"
```

### WebSocket Connection Issues

#### Error: "WebSocket connection failed"

**Symptoms:**
- Real-time updates not working
- Connection drops frequently
- Authentication errors

**Solutions:**

1. **Check WebSocket endpoint**
```bash
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
  http://localhost:8080/ws
```

2. **Verify WebSocket configuration**
```bash
# Check WS_HEARTBEAT_INTERVAL
echo $WS_HEARTBEAT_INTERVAL
```

3. **Check connection limits**
```bash
# Check WS_MAX_CONNECTIONS
echo $WS_MAX_CONNECTIONS
```

4. **Monitor WebSocket connections**
```bash
netstat -an | grep :8080
```

## Frontend Issues

### Build and Compilation Errors

#### Error: "Module not found" or "Import error"

**Symptoms:**
- Frontend build fails
- Missing dependencies
- Import resolution errors

**Solutions:**

1. **Check package.json**
```bash
cd frontend
cat package.json
```

2. **Reinstall dependencies**
```bash
rm -rf node_modules package-lock.json
npm install
```

3. **Check TypeScript configuration**
```bash
cat tsconfig.json
```

4. **Verify import paths**
```bash
# Check if imported files exist
ls -la src/components/ComponentName.tsx
```

#### Error: "Build failed" or "Compilation error"

**Solutions:**

1. **Check build logs**
```bash
npm run build 2>&1 | tee build.log
```

2. **Check TypeScript errors**
```bash
npx tsc --noEmit
```

3. **Check ESLint errors**
```bash
npx eslint src/
```

4. **Clear build cache**
```bash
rm -rf dist/ .vite/
npm run build
```

### Runtime Errors

#### Error: "API request failed" or "Network error"

**Symptoms:**
- API calls fail
- Network timeouts
- CORS errors

**Solutions:**

1. **Check API URL**
```bash
# Verify VITE_API_URL in .env
echo $VITE_API_URL
```

2. **Test API endpoint**
```bash
curl -f http://localhost:8080/health
```

3. **Check CORS configuration**
```bash
# Verify CORS_ORIGINS in backend .env
echo $CORS_ORIGINS
```

4. **Check network connectivity**
```bash
ping localhost
telnet localhost 8080
```

#### Error: "WebSocket connection failed"

**Solutions:**

1. **Check WebSocket URL**
```bash
# Verify VITE_WS_URL in .env
echo $VITE_WS_URL
```

2. **Test WebSocket connection**
```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
ws.onopen = () => console.log('Connected');
ws.onerror = (error) => console.error('Error:', error);
```

3. **Check browser console**
```bash
# Open browser developer tools and check console for errors
```

### UI/UX Issues

#### Error: "Component not rendering" or "Layout broken"

**Solutions:**

1. **Check component imports**
```bash
# Verify all components are properly imported
grep -r "import.*ComponentName" src/
```

2. **Check CSS/styling**
```bash
# Verify CSS files are included
ls -la src/styles/
```

3. **Check responsive design**
```bash
# Test on different screen sizes
```

4. **Check browser compatibility**
```bash
# Test in different browsers
```

## System-Level Issues

### Performance Problems

#### High Memory Usage

**Symptoms:**
- System becomes slow
- Out of memory errors
- Application crashes

**Solutions:**

1. **Check memory usage**
```bash
free -h
htop
```

2. **Check application memory**
```bash
sudo systemctl show reconciliation-platform --property=MemoryCurrent
```

3. **Optimize database connections**
```bash
# Check active connections
psql -h localhost -U reconciliation_user -d reconciliation_platform \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

4. **Restart services**
```bash
sudo systemctl restart reconciliation-platform
sudo systemctl restart postgresql
sudo systemctl restart redis-server
```

#### High CPU Usage

**Solutions:**

1. **Check CPU usage**
```bash
top
htop
```

2. **Identify CPU-intensive processes**
```bash
ps aux --sort=-%cpu | head -10
```

3. **Check database queries**
```bash
# Check for slow queries
sudo tail -f /var/log/postgresql/postgresql-13-main.log | grep "slow query"
```

4. **Optimize application**
```bash
# Check for infinite loops or inefficient algorithms
```

#### Slow Database Queries

**Solutions:**

1. **Check query performance**
```bash
psql -h localhost -U reconciliation_user -d reconciliation_platform \
  -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

2. **Analyze query plans**
```bash
psql -h localhost -U reconciliation_user -d reconciliation_platform \
  -c "EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';"
```

3. **Check indexes**
```bash
psql -h localhost -U reconciliation_user -d reconciliation_platform \
  -c "\di"
```

4. **Update statistics**
```bash
psql -h localhost -U reconciliation_user -d reconciliation_platform \
  -c "ANALYZE;"
```

### Disk Space Issues

#### Error: "No space left on device"

**Solutions:**

1. **Check disk usage**
```bash
df -h
du -sh /path/to/uploads/
```

2. **Clean up old files**
```bash
# Remove old log files
sudo find /var/log -name "*.log" -mtime +30 -delete

# Remove old backups
sudo find /backups -name "*.sql.gz" -mtime +30 -delete
```

3. **Clean up uploads**
```bash
# Remove old uploaded files
find ./uploads -name "*.csv" -mtime +7 -delete
```

4. **Clean up temporary files**
```bash
sudo rm -rf /tmp/*
```

### Network Issues

#### Error: "Connection timeout" or "Network unreachable"

**Solutions:**

1. **Check network connectivity**
```bash
ping google.com
ping localhost
```

2. **Check DNS resolution**
```bash
nslookup google.com
```

3. **Check firewall rules**
```bash
sudo ufw status
sudo iptables -L
```

4. **Check port availability**
```bash
netstat -tlnp | grep :8080
netstat -tlnp | grep :5432
netstat -tlnp | grep :6379
```

## Log Analysis

### Application Logs

#### Check application logs
```bash
sudo journalctl -u reconciliation-platform -f
```

#### Check specific log levels
```bash
sudo journalctl -u reconciliation-platform --priority=err
sudo journalctl -u reconciliation-platform --priority=warn
```

#### Search for specific errors
```bash
sudo journalctl -u reconciliation-platform | grep "ERROR"
sudo journalctl -u reconciliation-platform | grep "WARN"
```

### Database Logs

#### Check PostgreSQL logs
```bash
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

#### Check slow queries
```bash
sudo grep "slow query" /var/log/postgresql/postgresql-13-main.log
```

#### Check connection errors
```bash
sudo grep "connection" /var/log/postgresql/postgresql-13-main.log
```

### System Logs

#### Check system logs
```bash
sudo tail -f /var/log/syslog
```

#### Check authentication logs
```bash
sudo tail -f /var/log/auth.log
```

#### Check kernel logs
```bash
sudo dmesg | tail -20
```

## Debugging Tools

### Backend Debugging

#### Enable debug logging
```bash
# Set RUST_LOG=debug in .env
echo "RUST_LOG=debug" >> .env
sudo systemctl restart reconciliation-platform
```

#### Use database debugging
```bash
# Enable query logging in PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf
# Add: log_statement = 'all'
sudo systemctl restart postgresql
```

#### Use Redis debugging
```bash
# Monitor Redis commands
redis-cli monitor
```

### Frontend Debugging

#### Enable debug mode
```bash
# Set VITE_DEBUG=true in .env
echo "VITE_DEBUG=true" >> .env
npm run dev
```

#### Use browser developer tools
```bash
# Open browser developer tools (F12)
# Check Console, Network, and Application tabs
```

#### Use React DevTools
```bash
# Install React DevTools browser extension
# Use Redux DevTools for state debugging
```

## Recovery Procedures

### Database Recovery

#### Restore from backup
```bash
# Stop application
sudo systemctl stop reconciliation-platform

# Restore database
gunzip -c /backups/database/reconciliation_platform_20240101_020000.sql.gz | \
  psql -h localhost -U reconciliation_user -d reconciliation_platform

# Start application
sudo systemctl start reconciliation-platform
```

#### Reset database (development only)
```bash
# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE reconciliation_platform;"
sudo -u postgres psql -c "CREATE DATABASE reconciliation_platform;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE reconciliation_platform TO reconciliation_user;"

# Run migrations
cd backend
diesel migration run
```

### Application Recovery

#### Restart all services
```bash
sudo systemctl restart reconciliation-platform
sudo systemctl restart postgresql
sudo systemctl restart redis-server
sudo systemctl restart nginx
```

#### Clear caches
```bash
# Clear Redis cache
redis-cli FLUSHALL

# Clear application cache
rm -rf ./cache/*
```

#### Reset configuration
```bash
# Restore default configuration
cp .env.example .env
# Edit .env with correct values
sudo systemctl restart reconciliation-platform
```

## Prevention and Monitoring

### Proactive Monitoring

#### Set up health checks
```bash
# Create health check script
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash

# Check database
if ! pg_isready -h localhost -U reconciliation_user -d reconciliation_platform; then
    echo "Database is not responding"
    exit 1
fi

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Redis is not responding"
    exit 1
fi

# Check application
if ! curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "Application is not responding"
    exit 1
fi

echo "All services are healthy"
exit 0
```

#### Schedule monitoring
```bash
sudo chmod +x /usr/local/bin/health-check.sh
sudo crontab -e
# Add: */5 * * * * /usr/local/bin/health-check.sh
```

### Log Monitoring

#### Set up log monitoring
```bash
# Install log monitoring tools
sudo apt-get install -y logwatch

# Configure log monitoring
sudo nano /etc/logwatch/conf/logwatch.conf
```

#### Set up alerts
```bash
# Create alert script
sudo nano /usr/local/bin/alert.sh
```

```bash
#!/bin/bash

# Check for critical errors
if sudo journalctl -u reconciliation-platform --since "5 minutes ago" | grep -q "ERROR"; then
    echo "Critical error detected in reconciliation-platform" | mail -s "Alert" admin@example.com
fi
```

## Getting Help

### Self-Service Resources

1. **Check documentation**
   - [API Documentation](./API_DOCUMENTATION.md)
   - [Deployment Guide](../DEPLOYMENT_GUIDE.md)
   - [User Training Guide](./USER_TRAINING_GUIDE.md)

2. **Search logs**
   - Use `grep` to search for specific errors
   - Check system logs for related issues
   - Look for patterns in error messages

3. **Test components**
   - Test database connectivity
   - Test API endpoints
   - Test WebSocket connections

### Community Support

1. **GitHub Issues**
   - Search existing issues
   - Create new issue with detailed information
   - Include logs and error messages

2. **Discord Community**
   - Join the Discord server
   - Ask questions in appropriate channels
   - Share solutions with others

3. **Stack Overflow**
   - Search for similar issues
   - Ask questions with proper tags
   - Provide detailed problem description

### Professional Support

1. **Email Support**
   - Email: support@378reconciliation.com
   - Include system information and logs
   - Describe steps to reproduce the issue

2. **Phone Support**
   - Phone: +1-555-0123
   - Available during business hours
   - For critical issues only

3. **Emergency Support**
   - For production outages
   - 24/7 availability for critical issues
   - Immediate response guaranteed

## Common Solutions Summary

### Quick Fixes

1. **Restart services**
```bash
sudo systemctl restart reconciliation-platform postgresql redis-server nginx
```

2. **Check logs**
```bash
sudo journalctl -u reconciliation-platform -f
```

3. **Verify configuration**
```bash
sudo systemctl status reconciliation-platform
```

4. **Test connectivity**
```bash
curl -f http://localhost:8080/health
```

5. **Clear caches**
```bash
redis-cli FLUSHALL
```

### When to Contact Support

- Database corruption or data loss
- Security incidents or breaches
- Performance issues affecting production
- Complex configuration problems
- Integration issues with external systems

### Information to Include

When contacting support, include:

1. **System information**
   - Operating system and version
   - Application version
   - Database version

2. **Error details**
   - Exact error messages
   - Steps to reproduce
   - Screenshots or logs

3. **Environment**
   - Development or production
   - Recent changes
   - Configuration details

4. **Impact**
   - Number of affected users
   - Business impact
   - Urgency level
