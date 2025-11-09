#!/bin/bash

# Simple Backend Deployment Script
# This script builds and runs a minimal backend server

echo "🚀 Starting Simple Backend Deployment"

# Check if we're in the right directory
if [ ! -f "Cargo_simple.toml" ]; then
    echo "❌ Error: Cargo_simple.toml not found. Please run from backend directory."
    exit 1
fi

# Copy the simple Cargo.toml
cp Cargo_simple.toml Cargo.toml

# Copy the simple main.rs
cp src/main_simple.rs src/main.rs

# Build the simple backend
echo "🔨 Building simple backend..."
cargo build --release

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Set environment variables
    export DATABASE_URL="postgresql://reconciliation_user:reconciliation_pass@localhost:5432/reconciliation_app"
    export REDIS_URL="redis://localhost:6379"
    export RUST_LOG="info"
    
    echo "🚀 Starting backend server on port 8080..."
    echo "📊 Database: $DATABASE_URL"
    echo "🔴 Redis: $REDIS_URL"
    echo ""
    echo "🌐 Access the backend at:"
    echo "   - Health check: http://localhost:8080/health"
    echo "   - API health: http://localhost:8080/api/health"
    echo "   - Root: http://localhost:8080/"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Run the backend
    cargo run --release
else
    echo "❌ Build failed!"
    exit 1
fi
