#!/usr/bin/env python3
"""Create .env file for Docker deployment"""

env_content = """# ============================================================================
# RECONCILIATION PLATFORM - ENVIRONMENT CONFIGURATION
# ============================================================================
# Generated for Docker & Kubernetes Deployment
# Last Updated: 2025-01-27
# ============================================================================
# IMPORTANT: Keep this file secure and never commit to version control
# ============================================================================

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=vxd5ORoEGCB2d0ZNwBIshZ6JfSQ8bSS3
POSTGRES_PORT=5432

# Database URL (for application use)
DATABASE_URL=postgresql://postgres:vxd5ORoEGCB2d0ZNwBIshZ6JfSQ8bSS3@postgres:5432/reconciliation_app

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
REDIS_PASSWORD=1NNavuOInhoOyQvYp1b4rQgh/HU8L915
REDIS_PORT=6379

# Redis URL (for application use)
REDIS_URL=redis://:1NNavuOInhoOyQvYp1b4rQgh/HU8L915@redis:6379

# ============================================================================
# JWT & AUTHENTICATION
# ============================================================================
JWT_SECRET=adaeb3dd6907f67a2d7eb0cb14b46420ff80e00e19617c686aab2ac1f7884d5f
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ============================================================================
# APPLICATION PORTS
# ============================================================================
BACKEND_PORT=2000
FRONTEND_PORT=1000
API_PORT=2000

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
CORS_ORIGINS=http://localhost:1000,http://localhost:3000,https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# ============================================================================
# ENVIRONMENT
# ============================================================================
NODE_ENV=production
ENVIRONMENT=production
RUST_LOG=info

# ============================================================================
# API CONFIGURATION
# ============================================================================
VITE_API_URL=http://localhost:2000/api/v1
VITE_WS_URL=ws://localhost:2000

# ============================================================================
# FILE UPLOAD CONFIGURATION
# ============================================================================
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# ============================================================================
# MONITORING PORTS
# ============================================================================
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
LOGSTASH_PORT=5044
LOGSTASH_HTTP_PORT=9600
APM_PORT=8200

# ============================================================================
# GRAFANA CONFIGURATION
# ============================================================================
GRAFANA_PASSWORD=admin

# ============================================================================
# SECURITY HEADERS
# ============================================================================
CUSTOM_CSP=default-src 'self'; script-src 'self' 'nonce-{nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:2000 ws://localhost:2000 http://localhost:1000 ws://localhost:1000; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;

# ============================================================================
# HOST CONFIGURATION
# ============================================================================
HOST=0.0.0.0
PORT=2000

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================
LOG_FORMAT=json
"""

with open('.env', 'w') as f:
    f.write(env_content)
print("✅ .env file created successfully")

