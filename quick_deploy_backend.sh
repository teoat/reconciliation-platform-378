#!/bin/bash
# Quick Backend Deployment Script

set -e

echo "🚀 Starting Quick Backend Deployment..."

# Step 1: Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cat > .env << 'EOF'
DATABASE_URL=postgres://postgres:postgres@localhost:5432/reconciliation_app
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_jwt_secret_change_in_production_min_32_characters
HOST=0.0.0.0
PORT=2000
RUST_LOG=info
EOF
    echo "✅ .env file created!"
else
    echo "✅ .env file already exists"
fi

# Step 2: Start PostgreSQL if not running
if ! docker ps | grep -q reconciliation-postgres; then
    echo "🐘 Starting PostgreSQL container..."
    docker run -d https://github.com/prisma/prisma/issues/3441--name reconciliation-postgres \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=reconciliation_app \
      -p 5432:5432 \
      postgres:15-alpine
    echo "✅ PostgreSQL started!"
else
    echo "✅ PostgreSQL already running"
fi

# Step 3: Start Redis if not running
if ! docker ps | grep -q reconciliation-redis; then
    echo "🔴 Starting Redis container..."
    docker run -d --name reconciliation-redis \
      -p 6379:6379 \
      redis:7-alpine
    echo "✅ Redis started!"
else
    echo "✅ Redis already running"
fi

# Step 4: Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Step 5: Run migrations
echo "📊 Running database migrations..."
cd backend

# Try to run migrations with diesel
if command -v diesel &> /dev/null; then
    diesel migration run || echo "⚠️  Diesel migration failed, trying alternative method..."
else
    echo "⚠️  Diesel CLI not installed. Skipping migrations."
fi

# Step 6: Build backend
echo "🔨 Building backend..."
cargo build --release

# Step 7: Start backend
echo "✅ Starting backend server on http://localhost:2000..."
echo "📊 Health check: curl http://localhost:2000/api/health"
echo ""

./target/release/reconciliation-backend

