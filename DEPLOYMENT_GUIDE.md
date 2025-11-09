# 378 Reconciliation Platform – Deployment Guide

Consolidated deployment instructions for local development, staging, and production environments.

## 1. Prerequisites
- Docker Engine / Docker Desktop with Compose v2
- Access to project repository and `.env` files
- Optional: Kubernetes cluster (for advanced deployments)
- Ensure ports `3000`, `8080`, `9090`, `9093`, `5432`, and `6379` are free
- For Kubernetes rollouts: `kubectl`, `helm`, `jq`, and access to the target cluster/registry

## 2. Local & Development Deployment
```bash
# start all services
docker compose up -d

# inspect status
docker compose ps

# follow logs (Ctrl+C to stop tailing)
docker compose logs -f
```

### Default Endpoints
- Frontend: `http://localhost:3000` (direct container) or `http://localhost` via nginx
- Backend API: `http://localhost:8080`
- Health: `http://localhost:8080/health`
- Metrics: `http://localhost:8080/metrics`

### Service Checks
```bash
# database connectivity
docker compose exec database psql -U reconciliation_user -d reconciliation_app -c "SELECT now();"

# redis connectivity
docker compose exec redis redis-cli ping
```

## 3. Production-Grade Compose Deployment
```bash
# prepare environment file
cp config/production.env .env.production
# edit values (DATABASE_URL, REDIS_URL, JWT_SECRET, etc.)

# launch production stack
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml ps
```

Key services remain on the same ports. Update credentials, SSL termination, and domain routing according to your infrastructure.

## 4. Kubernetes & Advanced Environments
1. Build and push images referenced in the manifests (`reconciliation/backend`, `reconciliation/frontend`) to your registry.
2. Prepare secrets with concrete values. Either edit `infrastructure/kubernetes/*deployment.yaml` to replace the `change-me` placeholders, or create them dynamically:
   ```bash
   kubectl create secret generic reconciliation-secrets \
     --from-literal=DB_PASSWORD='strong-password' \
     --from-literal=REDIS_PASSWORD='strong-redis-pass' \
     --from-literal=JWT_SECRET='generated-jwt-secret' \
     --from-literal=SMTP_PASSWORD='smtp-secret' \
     --from-literal=SENTRY_DSN='dsn-value' \
     --from-literal=DATABASE_URL='postgresql://reconciliation_user:strong-password@postgres-service:5432/reconciliation_db' \
     --from-literal=REDIS_URL='redis://:strong-redis-pass@redis-service:6379' \
     --namespace reconciliation \
     --dry-run=client -o yaml | kubectl apply -f -
   ```
   Repeat for staging (`reconciliation-staging-secrets`) using the staging namespace and connection strings.
3. Deploy resources:
   ```bash
   kubectl apply -f infrastructure/kubernetes/production-deployment.yaml
   kubectl rollout status deployment/backend -n reconciliation
   kubectl rollout status deployment/frontend -n reconciliation
   ```
4. Tail logs as needed:
   ```bash
   kubectl logs -f deployment/backend -n reconciliation
   kubectl logs -f deployment/frontend -n reconciliation
   ```

## 5. Verification Matrix
```bash
# backend liveness/readiness
curl http://localhost:8080/health/live
curl http://localhost:8080/health/ready

# API smoke tests
curl http://localhost:8080/api/projects
curl http://localhost:8080/api/reconciliation-jobs
```

- Grafana: `http://localhost:3001` (default credentials `admin/admin`; change immediately)
- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`

## 6. Operations Playbook
- **Restart services**
  ```bash
  docker compose restart <service>
  docker compose -f docker-compose.production.yml restart <service>
  ```
- **Stop services**
  ```bash
  docker compose down
  docker compose -f docker-compose.production.yml down
  ```
- **Rebuild images**
  ```bash
  docker compose up -d --build
  docker compose -f docker-compose.production.yml up -d --build
  ```

## 7. Troubleshooting
- **Docker daemon** – restart Docker Desktop or run `sudo systemctl restart docker`.
- **Port conflicts** – `lsof -i :PORT` (macOS/Linux) or `netstat -ano | findstr :PORT` (Windows) and stop conflicting processes.
- **Database reset** – `docker compose down -v && docker compose up -d postgres redis`.
- **Stuck containers** – `docker compose logs --tail=100 <service>` to inspect; rebuild with `--build` if necessary.

## 8. Security Checklist
- Rotate default credentials (DB, Redis, Grafana, JWT secret).
- Enforce TLS termination (nginx, Traefik, or cloud load balancer).
- Configure firewall/network policies for exposed ports.
- Enable rate limiting, CORS rules, and security headers (handled in backend middleware; review settings before production).
- Wire monitoring alerts to on-call channels.

## 9. Scaling Guidance
```bash
# horizontal scaling via compose
docker compose -f docker-compose.production.yml up -d --scale backend=3 --scale frontend=2
```

For elastic scaling, migrate to Kubernetes or another orchestrator and configure autoscaling policies, shared storage, and persistent secrets management.

## 10. Post-Deployment Checklist
1. Confirm health endpoints and smoke-test APIs.
2. Validate frontend workflows end-to-end.
3. Monitor Grafana dashboards for baseline metrics.
4. Configure alert routing and incident response.
5. Document environment-specific overrides.
6. Schedule regular dependency and security reviews.

## 11. Go-Live Summary
- **Technical readiness**: production environment deployed, SSL/DNS/CDN verified, database migrations complete, monitoring and alerting active.
- **Security & performance**: vulnerability scans clear, rate limiting/CORS headers enforced, load testing and caching tuned.
- **Operational readiness**: backups validated, rollback triggers defined, incident response playbooks rehearsed, support team briefed.
- **User & content readiness**: admin accounts provisioned, role matrix validated, user training and communications scheduled.
- **Launch execution**: T-24/T0/T+24 hour checkpoints cover final health checks, activation sequence, and post-launch review.

See `docs/project-history.md` for milestone context plus pointers to training, UAT, and support materials captured during earlier go-live planning.

## 12. Operations & Maintenance
- Daily/weekly/monthly routines: health review, log rotation, security patching, capacity planning, and disaster-recovery drills.
- Monitoring stack: Prometheus scrapes backend metrics at `/metrics`; Grafana dashboards cover application, infrastructure, and business KPIs; Alertmanager drives escalation.
- Backups: PostgreSQL and Redis snapshots automated via CronJobs; verify restores quarterly.
- Maintenance tooling: `kubectl rollout restart`, `docker compose up -d --build`, and `helm upgrade` support zero-downtime updates.
- Security posture: rotate secrets, enforce RBAC, keep fail2ban/network policies aligned with compliance requirements.

For deeper runbooks and troubleshooting flows, consult `docs/TROUBLESHOOTING.md`, `docs/SUPPORT_MAINTENANCE_GUIDE.md`, and `docs/INCIDENT_RESPONSE_RUNBOOKS.md`.

For escalation paths and deeper remediation steps, see `docs/troubleshooting.md` and `docs/project-history.md`.
