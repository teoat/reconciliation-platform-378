# CI/CD Pipeline Documentation

## Overview

This document provides comprehensive documentation for the Reconciliation Platform's CI/CD pipelines, including workflow configurations, deployment strategies, and best practices.

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD Pipeline Flow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Push/PR ──► Lint & Type Check ──► Unit Tests ──► Integration Tests         │
│                                        │                   │                 │
│                                        ▼                   ▼                 │
│                              Build ◄── Security Scan ──► E2E Tests           │
│                                │                           │                 │
│                                ▼                           ▼                 │
│                         Docker Build ──► Deploy Staging ──► Performance      │
│                                │                           │                 │
│                                ▼                           ▼                 │
│                      Deploy Production ◄── Manual Approval ◄─┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Available Workflows

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

The primary pipeline that runs on every push and pull request.

**Triggers:**
- Push to `master` or `develop` branches
- Pull requests to `master` or `develop` branches
- Release published

**Jobs:**
| Job | Description | Dependencies |
|-----|-------------|--------------|
| `backend-test` | Runs Rust backend tests | None |
| `frontend-test` | Runs frontend tests and builds | None |
| `security-scan` | Vulnerability scanning | None |
| `integration-test` | Full integration tests | backend-test, frontend-test |
| `build-docker` | Build and push Docker images | All tests, security-scan |
| `deploy-staging` | Deploy to staging environment | build-docker |
| `deploy-production` | Deploy to production | build-docker, manual approval |
| `performance-test` | Run performance tests | deploy-staging |

### 2. Parallel Testing Pipeline (`parallel-testing.yml`)

Optimized pipeline with matrix strategies for parallel test execution.

**Matrix Strategy:**
- Unit tests split by component (6 parallel jobs)
- Integration tests split by suite (4 parallel jobs)
- E2E tests split by browser and shard (6 parallel jobs)

**Benefits:**
- ~60% faster test execution
- Better failure isolation
- Independent component testing

### 3. Performance & Load Testing (`performance-load-testing.yml`)

Automated performance testing with K6 and Locust.

**Schedule:** Daily at 4 AM UTC

**Tests:**
- K6 smoke tests
- K6 load tests (configurable VUs and duration)
- Locust load tests
- Performance threshold validation

**Thresholds:**
- P95 latency < 500ms
- Error rate < 1%

### 4. Security Scanning (`security-scan.yml`)

Comprehensive security scanning pipeline.

**Schedule:** Daily at 3 AM UTC

**Scans:**
- Trivy filesystem scan
- Trivy Docker image scan
- Snyk vulnerability scan
- npm audit
- Secret scanning (Gitleaks, TruffleHog)
- SBOM generation

## Secrets Configuration

### Required Secrets

| Secret | Description | Used In |
|--------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | build-docker |
| `DOCKER_PASSWORD` | Docker Hub password | build-docker |
| `STAGING_HOST` | Staging server hostname | deploy-staging |
| `STAGING_USERNAME` | Staging SSH username | deploy-staging |
| `STAGING_SSH_KEY` | Staging SSH private key | deploy-staging |
| `PRODUCTION_HOST` | Production server hostname | deploy-production |
| `PRODUCTION_USERNAME` | Production SSH username | deploy-production |
| `PRODUCTION_SSH_KEY` | Production SSH private key | deploy-production |
| `SLACK_WEBHOOK` | Slack notifications webhook | deploy-production |
| `SNYK_TOKEN` | Snyk API token | security-scan |
| `CODECOV_TOKEN` | Codecov upload token | test jobs |

### AWS Secrets Manager Integration

For AWS-based deployments, use AWS Secrets Manager:

```yaml
- name: Get secrets from AWS Secrets Manager
  uses: aws-actions/aws-secretsmanager-get-secrets@v2
  with:
    secret-ids: |
      reconciliation/production/database
      reconciliation/production/api-keys
    parse-json-secrets: true
```

See `docs/deployment/SECRET_MANAGEMENT.md` for detailed AWS Secrets Manager configuration.

## Deployment Strategies

### Canary Deployment

Gradual rollout with traffic splitting:

1. 5% → 10% → 25% → 50% → 75% → 100%
2. Automated analysis at each step
3. Auto-rollback on failure

Configuration: `k8s/deployment-strategies/canary-deployment.yaml`

### Blue-Green Deployment

Zero-downtime deployment with instant rollback:

1. Deploy to preview environment
2. Run pre-promotion analysis
3. Switch traffic on approval
4. Run post-promotion analysis

Configuration: `k8s/deployment-strategies/blue-green-deployment.yaml`

### Rolling Update

Kubernetes default rolling update strategy:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

## Automated Rollback

### Triggers
- Error rate > 5%
- P95 latency > 500ms
- Health check failures > 3

### Manual Rollback
```bash
# Using kubectl
kubectl rollout undo deployment/backend -n reconciliation-platform

# Using rollback script
./scripts/deployment/rollback.sh rollback backend

# Rollback to specific revision
./scripts/deployment/rollback.sh rollback backend 5
```

## Environment Configuration

### Development
- Branch: `develop`
- Auto-deploy: Yes
- Tests: All

### Staging
- Branch: `develop`
- Auto-deploy: Yes (after tests pass)
- Tests: All + Performance

### Production
- Branch: `master`
- Auto-deploy: No (manual approval required)
- Tests: All + Smoke tests

## Monitoring & Alerts

### Pipeline Notifications

| Event | Channel | Recipients |
|-------|---------|------------|
| Build failure | Slack #builds | Team |
| Security alert | Slack #security | Security team |
| Deployment success | Slack #deployments | All |
| Performance degradation | PagerDuty | On-call |

### Dashboard Links
- GitHub Actions: `https://github.com/org/repo/actions`
- Codecov: `https://codecov.io/gh/org/repo`
- SonarQube: `https://sonarcloud.io/dashboard?id=repo`

## Troubleshooting

### Common Issues

#### 1. Docker Build Failures
```bash
# Check Docker context
docker context ls

# Verify Dockerfile
docker build --no-cache -t test ./backend
```

#### 2. Test Timeouts
- Increase `timeout-minutes` in workflow
- Check for resource constraints
- Review test dependencies

#### 3. Deployment Failures
```bash
# Check deployment status
kubectl rollout status deployment/backend -n reconciliation-platform

# View pod logs
kubectl logs -l component=backend -n reconciliation-platform

# Describe pod for events
kubectl describe pod -l component=backend -n reconciliation-platform
```

## Best Practices

1. **Keep workflows modular** - Use reusable workflows for common tasks
2. **Cache dependencies** - Always cache npm, cargo, and Docker layers
3. **Fail fast** - Run quick checks before long-running tests
4. **Parallel execution** - Use matrix strategies for independent tests
5. **Security first** - Run security scans on every PR
6. **Monitor performance** - Track build times and optimize bottlenecks
7. **Document changes** - Update this documentation when modifying workflows

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Argo Rollouts](https://argoproj.github.io/argo-rollouts/)
- [K6 Documentation](https://k6.io/docs/)
- [Locust Documentation](https://docs.locust.io/)
