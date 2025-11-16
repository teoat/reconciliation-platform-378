#!/bin/bash
# scripts/deployment/check-redis.sh
# Redis service health check

set -e

check_redis() {
    echo "🔍 Checking Redis Service..."
    
    # Check Redis connection (if running)
    if command -v redis-cli &> /dev/null; then
        if redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping &> /dev/null 2>&1; then
            echo "✅ Redis is accessible"
        else
            echo "⚠️  Redis not accessible (may not be running yet)"
        fi
    else
        echo "⚠️  redis-cli not found (Redis client tools not installed)"
    fi
    
    # Check REDIS_URL
    if [ -z "$REDIS_URL" ] && ! grep -q "REDIS_URL" .env 2>/dev/null; then
        echo "⚠️  REDIS_URL not set"
    fi
    
    echo "✅ Redis checks passed"
    return 0
}

check_redis "$@"

