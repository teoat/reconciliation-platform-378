# Applying Next Steps - Step-by-Step Guide

**Last Updated**: November 26, 2025  
**Status**: Active Guide

## Quick Start

Run the automated script to apply all next steps:

```bash
./scripts/apply-next-steps.sh
```

## Manual Step-by-Step Process

### Step 1: Run Integration Tests

```bash
cd backend

# Run CQRS tests
cargo test --test cqrs_tests

# Run secret rotation tests
cargo test --test secret_rotation_tests

# Run all integration tests
cargo test --test '*'
```

**Expected Output**: All tests should pass or show expected failures for non-existent resources.

### Step 2: Verify Code Compilation

```bash
cd backend

# Check compilation
cargo check

# Build
cargo build --release
```

**Expected Output**: `Finished` with no errors.

### Step 3: Deploy to Staging

```bash
# From project root
./scripts/deploy-staging.sh
```

**What it does**:
- Checks prerequisites (Docker, docker-compose)
- Runs database migrations
- Builds and starts services
- Waits for services to be ready
- Runs deployment validation
- Performs health checks

**Expected Output**: Services started successfully, health checks passed.

### Step 4: Validate Deployment

```bash
# Run validation script
./scripts/validate-deployment.sh

# Or with custom API URL
API_BASE_URL=http://localhost:2000 ./scripts/validate-deployment.sh
```

**What it checks**:
- Health endpoint accessibility
- Metrics API endpoints
- Database migration status
- Service availability

**Expected Output**: All checks passed.

### Step 5: Monitor Deployment

```bash
# Start continuous monitoring
./scripts/monitor-deployment.sh

# Or with custom settings
API_BASE_URL=http://localhost:2000 \
MONITOR_INTERVAL=30 \
./scripts/monitor-deployment.sh
```

**What it monitors**:
- Health status
- Metrics summary
- Metrics health
- Updates every 30 seconds (default)

**To stop**: Press `Ctrl+C`

### Step 6: Check Metrics

```bash
# Get metrics summary
curl http://localhost:2000/api/metrics/summary | jq '.'

# Get all metrics
curl http://localhost:2000/api/metrics | jq '.'

# Get specific metric
curl http://localhost:2000/api/metrics/cqrs_command_total | jq '.'

# Health with metrics
curl http://localhost:2000/api/metrics/health | jq '.'
```

## Troubleshooting

### Tests Fail

**Issue**: Integration tests fail

**Solutions**:
1. Check if database is running: `docker-compose ps`
2. Check database connection: `psql $DATABASE_URL -c "SELECT 1"`
3. Run tests individually to identify specific failures
4. Check test logs in `/tmp/cqrs_tests.log` and `/tmp/secret_rotation_tests.log`

### Services Won't Start

**Issue**: Docker services fail to start

**Solutions**:
1. Check Docker: `docker --version` and `docker-compose --version`
2. Check logs: `docker-compose logs backend`
3. Check ports: Ensure ports 2000, 5432, 6379 are available
4. Check environment variables: `env | grep -E "(DATABASE_URL|REDIS_URL)"`

### Metrics Not Available

**Issue**: Metrics endpoints return 404 or connection refused

**Solutions**:
1. Verify service is running: `docker-compose ps`
2. Check service logs: `docker-compose logs backend | grep metrics`
3. Verify metrics service is registered in main.rs
4. Check API base URL: `echo $API_BASE_URL`

### Validation Fails

**Issue**: Deployment validation script fails

**Solutions**:
1. Check service health: `curl http://localhost:2000/api/health`
2. Verify all required services are running
3. Check database migrations: `docker-compose exec backend diesel migration list`
4. Review validation script output for specific failures

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Staging deployment validated
- [ ] Metrics monitoring working
- [ ] Secrets configured
- [ ] Database backup created
- [ ] Rollback plan ready

### Deploy to Production

```bash
# Set production environment
export ENVIRONMENT=production
export API_BASE_URL=https://api.example.com

# Deploy
./scripts/deploy-production.sh

# Validate
API_BASE_URL=https://api.example.com ./scripts/validate-deployment.sh

# Monitor
API_BASE_URL=https://api.example.com ./scripts/monitor-deployment.sh
```

## Verification Checklist

After applying all next steps, verify:

- [ ] Integration tests run successfully
- [ ] Code compiles without errors
- [ ] Services start successfully
- [ ] Health endpoint responds
- [ ] Metrics endpoint responds
- [ ] Validation script passes
- [ ] Monitoring script works
- [ ] Documentation is accessible

## Quick Reference

### Test Commands
```bash
cargo test --test cqrs_tests
cargo test --test secret_rotation_tests
cargo test --test '*'
```

### Deployment Commands
```bash
./scripts/deploy-staging.sh
./scripts/deploy-production.sh
./scripts/validate-deployment.sh
./scripts/monitor-deployment.sh
```

### Health Check Commands
```bash
curl http://localhost:2000/api/health
curl http://localhost:2000/api/metrics/summary
curl http://localhost:2000/api/metrics/health
```

## Related Documentation

- [Deployment Guide](../deployment/DEPLOYMENT_GUIDE.md)
- [Monitoring Guide](../operations/MONITORING_GUIDE.md)
- [Final Status](./FINAL_STATUS.md)
- [Next Steps Complete](./NEXT_STEPS_COMPLETE.md)

