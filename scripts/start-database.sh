#!/bin/bash
# Start PostgreSQL database for development/testing
# Usage: ./scripts/start-database.sh [test|dev|prod]

set -e

ENV=${1:-dev}

echo "🗄️  Starting PostgreSQL database for $ENV environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "❌ docker-compose is not installed"
    exit 1
fi

# Use docker compose (newer) or docker-compose (older)
COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
fi

case $ENV in
    test)
        echo "📋 Starting test database..."
        # Start only postgres service for testing
        $COMPOSE_CMD -f docker-compose.yml up -d postgres
        
        # Wait for database to be ready
        echo "⏳ Waiting for database to be ready..."
        sleep 5
        
        # Create test database if it doesn't exist
        echo "📦 Creating test database..."
        docker exec -i reconciliation-postgres psql -U postgres <<EOF
SELECT 'CREATE DATABASE reconciliation_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reconciliation_test')\gexec
EOF
        
        echo "✅ Test database is ready!"
        echo "   Connection: postgresql://postgres:postgres_pass@localhost:5432/reconciliation_test"
        ;;
    dev)
        echo "📋 Starting development database..."
        # Start postgres and redis for development
        $COMPOSE_CMD -f docker-compose.yml up -d postgres redis
        
        # Wait for database to be ready
        echo "⏳ Waiting for database to be ready..."
        sleep 5
        
        echo "✅ Development database is ready!"
        echo "   PostgreSQL: postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"
        echo "   Redis: redis://localhost:6379"
        ;;
    prod)
        echo "📋 Starting production database (all services)..."
        $COMPOSE_CMD -f docker-compose.yml up -d
        
        echo "⏳ Waiting for services to be ready..."
        sleep 10
        
        echo "✅ Production services are starting!"
        echo "   Check status with: docker-compose ps"
        ;;
    *)
        echo "❌ Unknown environment: $ENV"
        echo "Usage: $0 [test|dev|prod]"
        exit 1
        ;;
esac

# Show database status
echo ""
echo "📊 Database Status:"
$COMPOSE_CMD -f docker-compose.yml ps postgres

echo ""
echo "💡 Useful commands:"
echo "   View logs:    docker-compose logs -f postgres"
echo "   Stop:         docker-compose stop postgres"
echo "   Remove:       docker-compose down postgres"
echo "   Connect:      docker exec -it reconciliation-postgres psql -U postgres -d reconciliation_app"

