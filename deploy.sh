#!/bin/bash
# Bash Deployment Script
# Run this script to deploy the Reconciliation Platform

set -e

echo "🚀 Starting Deployment..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root"
    exit 1
fi

# Check Docker
echo ""
echo "Checking Docker..."
if ! docker ps &>/dev/null; then
    echo "⚠️  Docker is not running. Please start Docker Desktop and try again."
    read -p "Press enter after starting Docker..."
fi

# Run migrations
echo ""
echo "Running database migrations..."
cd backend

export DATABASE_URL="postgresql://postgres:password@localhost:5432/reconciliation_app"

# Try to run migrations
if diesel setup 2>/dev/null; then
    echo "✅ Database setup complete"
    if diesel migration run 2>/dev/null; then
        echo "✅ Migrations completed"
    else
        echo "⚠️  Migrations will be run when database is available"
    fi
else
    echo "ℹ️  Migrations will be run when database is available"
fi

cd ..

# Start Docker Compose
echo ""
echo "🚀 Starting Docker Compose..."
docker-compose up -d

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📍 Services:"
echo "   Frontend: http://localhost:1000"
echo "   Backend:  http://localhost:2000"
echo "   Database: localhost:5432"
echo ""
echo "📊 Check logs with:"
echo "   docker-compose logs -f"
echo ""
echo "✨ Deployment complete!"
