# Deployment Scripts

This directory contains all deployment-related scripts for the Reconciliation Platform.

## Quick Start

Run the comprehensive error detection before any deployment:

```bash
./scripts/deployment/error-detection.sh
```

## Available Scripts

### Core Scripts

- **`error-detection.sh`** - Main pre-deployment error detection script
  - Checks dependencies, modules, environment variables, configuration, and compilation
  - Run this before any deployment attempt

### Service-Specific Checks

- **`check-backend.sh`** - Backend (Rust) service health check
- **`check-frontend.sh`** - Frontend (React/Vite) service health check  
- **`check-database.sh`** - Database (PostgreSQL) service health check
- **`check-redis.sh`** - Redis service health check

## Usage

### Pre-Deployment Checks

```bash
# Run all checks
./scripts/deployment/error-detection.sh

# Run individual service checks
./scripts/deployment/check-backend.sh
./scripts/deployment/check-frontend.sh
./scripts/deployment/check-database.sh
./scripts/deployment/check-redis.sh
```

### Integration with CI/CD

These scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Pre-deployment checks
  run: ./scripts/deployment/error-detection.sh
```

## Exit Codes

- **0** - All checks passed
- **1** - Errors detected (deployment should not proceed)

## Requirements

- Bash 4.0+
- Docker & Docker Compose (for container checks)
- kubectl (optional, for K8s manifest validation)
- Rust/Cargo (for backend checks)
- Node.js/npm (for frontend checks)

## Troubleshooting

See `DEPLOYMENT_STATUS.md` for current deployment status and known issues.

