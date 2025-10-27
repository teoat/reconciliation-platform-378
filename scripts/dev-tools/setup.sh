#!/bin/bash
# Development Environment Setup Script

echo "🚀 Setting up development environment..."

# Setup database
echo "📦 Setting up database..."
docker-compose up -d postgres redis

# Run migrations
echo "🔄 Running migrations..."
cargo run --bin diesel migration run

# Seed database
echo "🌱 Seeding database..."
cargo run --bin seed

# Setup SSL certificates
echo "🔐 Setting up SSL certificates..."
./scripts/dev-tools/generate-ssl.sh

# Start services
echo "✅ Starting services..."
docker-compose up -d

echo "🎉 Development environment ready!"

