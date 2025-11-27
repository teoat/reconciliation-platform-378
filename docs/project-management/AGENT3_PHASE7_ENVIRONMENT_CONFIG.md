# Agent 3: Phase 7 Environment Configuration Guide

**Date**: 2025-01-28  
**Status**: ✅ Documentation Complete  
**Agent**: Agent 3 (Frontend Organizer)

---

## Summary

This document provides a comprehensive guide for configuring and verifying frontend environment variables for production deployment.

---

## Required Environment Variables

### Core Configuration

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:2000/api` | ✅ Yes | `https://api.reconciliation.com/api` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:2000` | ✅ Yes | `wss://api.reconciliation.com/ws` |
| `VITE_BASE_PATH` | Base path for routing | `/` | ❌ No | `/app` |
| `VITE_APP_NAME` | Application name | `Reconciliation Platform` | ❌ No | `Reconciliation Platform` |
| `VITE_APP_VERSION` | Application version | `1.0.0` | ❌ No | `1.0.0` |

### Monitoring & Analytics

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `VITE_ELASTIC_APM_SERVER_URL` | Elastic APM server URL | `http://localhost:8200` | ❌ No | `https://apm.reconciliation.com` |
| `VITE_ELASTIC_APM_SERVICE_NAME` | APM service name | `reconciliation-frontend` | ❌ No | `reconciliation-frontend` |
| `VITE_ELASTIC_APM_ENVIRONMENT` | APM environment | `development` | ❌ No | `production` |

### Security

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `VITE_STORAGE_KEY` | Storage encryption key | (dev fallback) | ✅ Yes (prod) | `secure-random-key-32-chars` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | - | ❌ No | `xxx.apps.googleusercontent.com` |

### Feature Flags

| Variable | Description | Default | Required | Example |
|----------|-------------|---------|----------|---------|
| `VITE_DEMO_MODE` | Enable demo mode | `false` | ❌ No | `false` (must be false in prod) |
| `VITE_DEBUG` | Enable debug mode | `false` | ❌ No | `false` (must be false in prod) |
| `VITE_LOG_LEVEL` | Logging level | `info` | ❌ No | `info` or `warn` (prod) |

---

## Environment Configuration by Stage

### Development

```bash
# frontend/.env.local (not committed)
VITE_API_URL=http://localhost:2000/api
VITE_WS_URL=ws://localhost:2000
VITE_DEMO_MODE=true
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### Staging

```bash
# Set via deployment script or CI/CD
export VITE_API_URL="https://staging-api.reconciliation.com/api"
export VITE_WS_URL="wss://staging-api.reconciliation.com/ws"
export VITE_DEMO_MODE=false
export VITE_DEBUG=false
export VITE_LOG_LEVEL=info
export VITE_ELASTIC_APM_SERVER_URL="https://staging-apm.reconciliation.com"
export VITE_ELASTIC_APM_ENVIRONMENT="staging"
```

### Production

```bash
# Set via deployment script or CI/CD
export VITE_API_URL="https://api.reconciliation.com/api"
export VITE_WS_URL="wss://api.reconciliation.com/ws"
export VITE_DEMO_MODE=false
export VITE_DEBUG=false
export VITE_LOG_LEVEL=warn
export VITE_ELASTIC_APM_SERVER_URL="https://apm.reconciliation.com"
export VITE_ELASTIC_APM_ENVIRONMENT="production"
export VITE_STORAGE_KEY="<secure-random-32-char-key>"
```

---

## Verification Checklist

### Pre-Deployment

- [ ] **Required Variables Set**
  - [ ] `VITE_API_URL` configured for production
  - [ ] `VITE_WS_URL` configured for production
  - [ ] `VITE_STORAGE_KEY` set (32+ characters, secure random)

- [ ] **Security Variables**
  - [ ] `VITE_DEMO_MODE=false` (must be false in production)
  - [ ] `VITE_DEBUG=false` (must be false in production)
  - [ ] `VITE_LOG_LEVEL=warn` or `info` (not `debug`)

- [ ] **Monitoring Variables**
  - [ ] `VITE_ELASTIC_APM_SERVER_URL` configured (if using APM)
  - [ ] `VITE_ELASTIC_APM_ENVIRONMENT=production`

### Post-Deployment

- [ ] **Runtime Verification**
  - [ ] Check browser console for environment variable errors
  - [ ] Verify API calls use correct `VITE_API_URL`
  - [ ] Verify WebSocket connections use correct `VITE_WS_URL`
  - [ ] Verify monitoring services connect correctly

- [ ] **Configuration Verification**
  - [ ] Verify `APP_CONFIG.API_URL` matches production API
  - [ ] Verify `APP_CONFIG.WS_URL` matches production WebSocket
  - [ ] Verify demo mode is disabled
  - [ ] Verify debug mode is disabled

---

## Verification Script

Create a verification script to check environment variables:

```bash
#!/bin/bash
# frontend/scripts/verify-env.sh

echo "Verifying Frontend Environment Variables..."

# Check required variables
if [ -z "$VITE_API_URL" ]; then
  echo "❌ VITE_API_URL is not set"
  exit 1
fi

if [ -z "$VITE_WS_URL" ]; then
  echo "❌ VITE_WS_URL is not set"
  exit 1
fi

# Check production security
if [ "$VITE_DEMO_MODE" = "true" ]; then
  echo "⚠️  WARNING: VITE_DEMO_MODE is true (should be false in production)"
fi

if [ "$VITE_DEBUG" = "true" ]; then
  echo "⚠️  WARNING: VITE_DEBUG is true (should be false in production)"
fi

# Check storage key
if [ -z "$VITE_STORAGE_KEY" ] || [ ${#VITE_STORAGE_KEY} -lt 16 ]; then
  echo "⚠️  WARNING: VITE_STORAGE_KEY is not set or too short (min 16 chars)"
fi

echo "✅ Environment variables verified"
```

---

## Deployment Script Integration

The `deploy.sh` script already handles environment variable configuration:

```bash
# From frontend/deploy.sh
case $ENVIRONMENT in
    "production")
        export VITE_API_URL="https://api.reconciliation.com/api"
        export VITE_WS_URL="wss://api.reconciliation.com/ws"
        ;;
    "staging")
        export VITE_API_URL="https://staging-api.reconciliation.com/api"
        export VITE_WS_URL="wss://staging-api.reconciliation.com/ws"
        ;;
    "development")
        export VITE_API_URL="http://localhost:8080/api"
        export VITE_WS_URL="ws://localhost:8080/ws"
        ;;
esac
```

---

## Runtime Verification

### Browser Console Check

After deployment, verify in browser console:

```javascript
// Check API URL
console.log('API URL:', import.meta.env.VITE_API_URL);

// Check WebSocket URL
console.log('WS URL:', import.meta.env.VITE_WS_URL);

// Check environment
console.log('Environment:', import.meta.env.MODE);
console.log('Production:', import.meta.env.PROD);
```

### Application Config Check

```javascript
// In browser console
import { APP_CONFIG } from '@/config/AppConfig';
console.log('APP_CONFIG:', APP_CONFIG);
```

---

## Troubleshooting

### Environment Variables Not Loading

1. **Check Build Process**
   - Ensure variables are set before `npm run build`
   - Variables must start with `VITE_` to be included in build

2. **Check Runtime**
   - Variables are embedded at build time (not runtime)
   - Must rebuild after changing variables

3. **Check Import**
   - Use `import.meta.env.VITE_*` (not `process.env`)
   - Variables are available in `import.meta.env`

### Wrong API URL

1. **Check Deployment Script**
   - Verify `deploy.sh` sets correct environment
   - Verify environment variable is exported

2. **Check Build Output**
   - Inspect built JavaScript files
   - Search for API URL in bundle

### Security Warnings

1. **Demo Mode Enabled**
   - Set `VITE_DEMO_MODE=false` in production
   - Rebuild application

2. **Debug Mode Enabled**
   - Set `VITE_DEBUG=false` in production
   - Rebuild application

---

## Best Practices

1. **Never Commit `.env` Files**
   - Use `.env.example` for documentation
   - Use CI/CD secrets for production

2. **Use Secure Storage Key**
   - Generate 32+ character random key
   - Store in secure secret management
   - Rotate periodically

3. **Validate in CI/CD**
   - Run verification script in CI/CD
   - Fail build if required variables missing
   - Warn if security variables incorrect

4. **Document Changes**
   - Document all environment variables
   - Update this guide when adding variables
   - Include examples for each environment

---

## Related Files

- **Configuration**: `frontend/src/config/AppConfig.ts`
- **Deployment Script**: `frontend/deploy.sh`
- **Type Definitions**: `frontend/vite-env.d.ts`
- **Build Config**: `frontend/vite.config.ts`

---

**Document Generated**: 2025-01-28  
**Agent**: Agent 3 (Frontend Organizer)  
**Status**: ✅ Complete

