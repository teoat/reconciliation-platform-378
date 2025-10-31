# 🚀 Immediate Deployment Guide
## 378 Reconciliation Platform - Zero to Production in 30 Minutes

**Version:** 1.0.0 Production  
**Last Updated:** January 2025

---

## Quick Deploy Checklist

### ⚡ Deploy to Local/Development (5 minutes)

```bash
# 1. Clone and start (if not already running)
docker-compose up --build

# 2. Access
open http://localhost:1000
```

### 🏢 Deploy to Staging (15 minutes)

```bash
# 1. Configure staging environment
cp config/production.env.example .env.staging

# 2. Update staging values in .env.staging
nano .env.staging

# 3. Deploy with staging config
docker-compose -f docker-compose.yml --env-file .env.staging up --build
```

### 🌐 Deploy to Production (30 minutes)

```bash
# Step 1: Configure Production Environment (10 min)
cp config/production.env.example config/production.env

# Edit config/production.env and set:
nano config/production.env

# Required values:
# DATABASE_URL=postgresql://user:pass@host:5432/db
# JWT_SECRET=<generate-64-char-secret>
# BACKUP_S3_BUCKET=reconciliation-backups
# SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Step 2: Apply Database Indexes (2 min)
psql $DATABASE_URL < backend/migrations/20250102000000_add_performance_indexes.sql

# Step 3: Deploy Application (5 min)
./scripts/deploy-production.sh

# Step 4: Verify Deployment (5 min)
curl http://localhost:2000/api/health
curl http://localhost:2000/api/metrics

# Step 5: Configure Monitoring (8 min)
# - Import Grafana dashboard from monitoring/grafana/dashboards/
# - Configure AlertManager from infrastructure/alertmanager/config.yml
# - Set up PagerDuty integration
```

---

## Environment Setup Quick Reference

### Generate Secure Secrets

```bash
# Generate JWT Secret (64 characters)
openssl rand -hex 32

# Generate Backup Encryption Key (32 bytes)
openssl rand -base64 32

# Generate Database Password
openssl rand -hex 24
```

### Create AWS Resources

```bash
# Create S3 bucket for backups
aws s3 mb s3://reconciliation-backups --region us-east-1

# Create secrets in Secrets Manager (optional)
aws secretsmanager create-secret \
  --name production/jwt_secret \
  --secret-string "$JWT_SECRET"

aws secretsmanager create-secret \
  --name production/database_url \
  --secret-string "$DATABASE_URL"
```

---

## Post-Deployment Verification

### 1. Health Checks (2 min)
```bash
# Backend health
curl http://localhost:2000/api/health | jq '.status'
# Expected: "ok"

# Readiness check
curl http://localhost:2000/api/ready | jq '.status'
# Expected: "ready"

# Metrics
curl http://localhost:2000/api/metrics
# Should return Prometheus metrics
```

### 2. Test Core Functionality (5 min)
```bash
# Create test project
curl -X POST http://localhost:2000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Project","owner_id":"..."}'

# Upload test file
curl -X POST http://localhost:2000/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_data.csv"

# Should return success response
```

### 3. Verify Monitoring (3 min)
```bash
# Check logs
docker-compose logs -f backend | grep "ERROR"

# Check metrics
curl http://localhost:2000/api/metrics | grep "http_requests_total"

# Verify backups (wait 1 hour for first backup)
aws s3 ls s3://reconciliation-backups/backups/
```

---

## Monitoring Dashboard Setup

### Import Grafana Dashboard

1. **Login to Grafana**
   ```
   Default: http://localhost:3000
   Admin/Admin
   ```

2. **Import Dashboard**
   - Click "Import" → "Upload JSON file"
   - Select `monitoring/grafana/dashboards/reconciliation-platform.json`
   - Configure Prometheus data source

3. **Configure Alerts**
   - Import `monitoring/alerts.yaml` into AlertManager
   - Set SLACK_WEBHOOK_URL environment variable
   - Configure PagerDuty integration

---

## Rollback Procedure

### If Deployment Fails

```bash
# 1. Check logs
docker-compose logs backend

# 2. Rollback to previous version
git checkout <previous-commit>
docker-compose up --build backend

# 3. Or restart with last known good config
docker-compose restart backend

# 4. Verify rollback
curl http://localhost:2000/api/health
```

---

## Support & Troubleshooting

### Common Issues

**Issue:** "Database connection failed"
```bash
# Check database is running
docker-compose ps database

# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Issue:** "Rate limit exceeded"
```bash
# Check current rate limits
curl http://localhost:2000/api/metrics | grep rate_limit

# Adjust in config/production.env
# RATE_LIMIT_REQUESTS=2000
```

**Issue:** "Backup failed"
```bash
# Check S3 permissions
aws s3 ls s3://reconciliation-backups/

# Verify encryption key set
echo $BACKUP_ENCRYPTION_KEY

# Check backup logs
docker-compose logs backend | grep "Backup"
```

---

## Next Steps After Deployment

### Day 1
- [ ] Monitor metrics dashboard
- [ ] Test all critical flows
- [ ] Collect user feedback
- [ ] Review error logs

### Week 1
- [ ] Set up user interviews
- [ ] Prioritize feature requests
- [ ] Performance optimization based on real data
- [ ] Security audit review

### Month 1
- [ ] Implement top 3 feature requests
- [ ] A/B test onboarding flow
- [ ] Optimize based on usage patterns
- [ ] Plan Q2 roadmap

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Uptime | 99.9% | Grafana dashboard or `/api/health` monitoring |
| P95 Latency | <200ms | Prometheus query: `histogram_quantile(0.95, ...)` |
| Error Rate | <0.1% | Metrics endpoint: `http_requests_total{status="5.."}` |
| Backup Success | 100% | S3 bucket listing or backup logs |
| User Satisfaction | 4.5/5 | User feedback surveys |

---

**Ready to Deploy:** ✅ YES  
**Estimated Deployment Time:** 30 minutes  
**Risk Level:** LOW 🟢

