# Deployment Runbook

**Last Updated**: 2025-11-29  
**Status**: ACTIVE  
**Purpose**: Step-by-step guide for deploying the Reconciliation Platform to production

---

## Pre-Deployment Checklist

### Environment Preparation
- [ ] Verify all environment variables are set
- [ ] Verify database migrations are ready
- [ ] Verify secrets are configured in Kubernetes/secret manager
- [ ] Verify SSL/TLS certificates are valid
- [ ] Verify DNS records are configured
- [ ] Verify monitoring and alerting are configured

### Code Preparation
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security scan completed
- [ ] Performance testing completed
- [ ] Documentation updated

### Infrastructure Preparation
- [ ] Kubernetes cluster is healthy
- [ ] Database backups are current
- [ ] Redis cluster is healthy
- [ ] Load balancer is configured
- [ ] Auto-scaling is configured

---

## Deployment Steps

### 1. Pre-Deployment

```bash
# 1.1 Verify current environment
kubectl get nodes
kubectl get pods -n reconciliation-platform

# 1.2 Check database connectivity
kubectl exec -it <backend-pod> -n reconciliation-platform -- \
  psql $DATABASE_URL -c "SELECT version();"

# 1.3 Verify secrets are set
kubectl get secrets -n reconciliation-platform

# 1.4 Create backup
./scripts/backup-database.sh
./scripts/backup-redis.sh
```

### 2. Database Migration

```bash
# 2.1 Run migrations in staging first
kubectl exec -it <backend-pod> -n reconciliation-staging -- \
  cargo run --bin reconciliation-backend -- migrate

# 2.2 Verify migrations succeeded
kubectl logs <backend-pod> -n reconciliation-staging | grep -i migration

# 2.3 Apply database indexes
./scripts/apply-database-indexes.sh

# 2.4 Run migrations in production
kubectl exec -it <backend-pod> -n reconciliation-platform -- \
  cargo run --bin reconciliation-backend -- migrate
```

### 3. Backend Deployment

```bash
# 3.1 Build backend image
cd backend
docker build -t reconciliation-backend:latest .

# 3.2 Tag for registry
docker tag reconciliation-backend:latest \
  <registry>/reconciliation-backend:<version>

# 3.3 Push to registry
docker push <registry>/reconciliation-backend:<version>

# 3.4 Update Kubernetes deployment
kubectl set image deployment/backend \
  backend=<registry>/reconciliation-backend:<version> \
  -n reconciliation-platform

# 3.5 Wait for rollout
kubectl rollout status deployment/backend -n reconciliation-platform
```

### 4. Frontend Deployment

```bash
# 4.1 Build frontend
cd frontend
npm run build

# 4.2 Build Docker image
docker build -t reconciliation-frontend:latest .

# 4.3 Tag and push
docker tag reconciliation-frontend:latest \
  <registry>/reconciliation-frontend:<version>
docker push <registry>/reconciliation-frontend:<version>

# 4.4 Update deployment
kubectl set image deployment/frontend \
  frontend=<registry>/reconciliation-frontend:<version> \
  -n reconciliation-platform

# 4.5 Wait for rollout
kubectl rollout status deployment/frontend -n reconciliation-platform
```

### 5. Post-Deployment Verification

```bash
# 5.1 Check pod status
kubectl get pods -n reconciliation-platform

# 5.2 Check health endpoints
curl https://api.example.com/health
curl https://api.example.com/api/v1/health

# 5.3 Check logs for errors
kubectl logs -f deployment/backend -n reconciliation-platform
kubectl logs -f deployment/frontend -n reconciliation-platform

# 5.4 Verify services are accessible
curl https://app.example.com
curl https://api.example.com/api/v1/status

# 5.5 Check monitoring dashboards
# - Verify error rates are normal
# - Verify response times are acceptable
# - Verify no critical alerts
```

### 6. Smoke Tests

```bash
# 6.1 Test authentication
curl -X POST https://api.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 6.2 Test API endpoints
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/v1/projects

# 6.3 Test frontend
# - Open https://app.example.com
# - Verify login works
# - Verify dashboard loads
# - Verify key features work
```

---

## Rollback Procedure

### Automatic Rollback

Kubernetes will automatically rollback if:
- Health checks fail
- Pods crash repeatedly
- Startup probes fail

### Manual Rollback

```bash
# Rollback backend
kubectl rollout undo deployment/backend -n reconciliation-platform

# Rollback frontend
kubectl rollout undo deployment/frontend -n reconciliation-platform

# Verify rollback
kubectl rollout status deployment/backend -n reconciliation-platform
kubectl rollout status deployment/frontend -n reconciliation-platform
```

### Database Rollback

```bash
# If migrations need to be rolled back
kubectl exec -it <backend-pod> -n reconciliation-platform -- \
  cargo run --bin reconciliation-backend -- migrate down

# Restore from backup if needed
./scripts/restore-database.sh <backup-file>
```

---

## Zero-Downtime Deployment

### Blue-Green Deployment

```bash
# 1. Deploy new version to green environment
kubectl apply -f k8s/green/

# 2. Verify green environment
kubectl get pods -n reconciliation-green
curl https://green.example.com/health

# 3. Switch traffic to green
kubectl patch service reconciliation-platform \
  -p '{"spec":{"selector":{"version":"green"}}}'

# 4. Monitor for issues
# Wait 5-10 minutes, monitor metrics

# 5. If stable, remove blue
kubectl delete -f k8s/blue/

# 6. If issues, switch back to blue
kubectl patch service reconciliation-platform \
  -p '{"spec":{"selector":{"version":"blue"}}}'
```

### Canary Deployment

```bash
# 1. Deploy canary (10% traffic)
kubectl apply -f k8s/canary/

# 2. Monitor metrics for 15 minutes
# - Error rates
# - Response times
# - User feedback

# 3. If stable, increase to 50%
kubectl patch deployment/canary \
  -p '{"spec":{"replicas":5}}'

# 4. Monitor for 15 minutes

# 5. If stable, full rollout
kubectl delete deployment/canary
kubectl scale deployment/main --replicas=10
```

---

## Monitoring During Deployment

### Key Metrics to Watch

1. **Error Rates**
   - Should remain < 1%
   - Watch for spikes

2. **Response Times**
   - API: < 500ms (p95)
   - Frontend: < 2s (p95)

3. **Resource Usage**
   - CPU: < 80%
   - Memory: < 80%

4. **Database**
   - Connection pool usage
   - Query performance
   - Replication lag

### Alerting

Set up alerts for:
- Error rate > 5%
- Response time > 1s (p95)
- CPU usage > 90%
- Memory usage > 90%
- Database connection errors
- Failed health checks

---

## Troubleshooting

### Common Issues

#### Pods Not Starting
```bash
# Check pod events
kubectl describe pod <pod-name> -n reconciliation-platform

# Check logs
kubectl logs <pod-name> -n reconciliation-platform

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Invalid secrets
```

#### High Error Rates
```bash
# Check error logs
kubectl logs -f deployment/backend -n reconciliation-platform | grep ERROR

# Check Sentry dashboard
# Check application metrics
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n reconciliation-platform

# Check database performance
kubectl exec -it <backend-pod> -n reconciliation-platform -- \
  psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Check slow queries
kubectl exec -it <backend-pod> -n reconciliation-platform -- \
  psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

## Post-Deployment Tasks

1. **Update Documentation**
   - Update deployment date
   - Document any issues encountered
   - Update runbook with lessons learned

2. **Notify Team**
   - Send deployment notification
   - Share deployment metrics
   - Document any known issues

3. **Monitor**
   - Watch metrics for 24 hours
   - Review error logs
   - Check user feedback

---

## Emergency Procedures

### Complete Service Outage

1. **Immediate Actions**
   - Rollback to previous version
   - Check infrastructure status
   - Notify team

2. **Investigation**
   - Check logs
   - Check infrastructure
   - Check external dependencies

3. **Recovery**
   - Fix root cause
   - Deploy fix
   - Verify recovery

### Data Corruption

1. **Immediate Actions**
   - Stop all writes
   - Isolate affected data
   - Notify team

2. **Recovery**
   - Restore from backup
   - Verify data integrity
   - Resume operations

---

## Related Documentation

- [Production Readiness Checklist](../project-management/PRODUCTION_READINESS_CHECKLIST.md)
- [Security Hardening](../project-management/SECURITY_HARDENING_IMPLEMENTATION.md)
- [Database Migration Guide](../operations/DATABASE_MIGRATION_GUIDE.md)
- [Kubernetes Configuration](../deployment/KUBERNETES_DOCKER_CONFIGURATION_ANALYSIS.md)

---

**Last Updated**: 2025-11-29  
**Maintained By**: DevOps Team

