#!/bin/bash
# Complete Setup Script - One command to set everything up
# Aggressively implements all remaining setup tasks

set -e

echo "🚀 Complete Setup Starting..."
echo ""

# 1. Install backend dependencies
echo "📦 Step 1: Installing backend dependencies..."
cd backend
if [ -f "Cargo.toml" ]; then
    # Try to install monitoring dependencies
    cargo add prometheus --features histogram 2>/dev/null || echo "⚠️  prometheus already added or manual add needed"
    cargo add sentry sentry-actix 2>/dev/null || echo "⚠️  sentry already added or manual add needed"
    echo "✅ Dependencies check complete"
fi
cd ..

# 2. Setup monitoring
echo ""
echo "📊 Step 2: Setting up monitoring..."
bash scripts/setup_monitoring.sh

# 3. Make all scripts executable
echo ""
echo "🔧 Step 3: Making scripts executable..."
chmod +x scripts/*.sh
chmod +x load-test/*.sh
echo "✅ All scripts are executable"

# 4. Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Step 4: Creating .env file..."
    cp env.example .env || echo "env.example not found, creating basic .env"
    cat >> .env << EOF
# Add these values:
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
SENTRY_DSN=https://your-key@sentry.io/project
EOF
    echo "✅ .env file created"
fi

# 5. Check database migrations
echo ""
echo "🗄️  Step 5: Checking database migrations..."
cd backend
if [ -f "diesel.toml" ]; then
    echo "Diesel configured ✓"
fi
cd ..

echo ""
echo "✅ Complete setup finished!"
echo ""
echo "📝 Next Steps:"
echo "1. Add Stripe keys to .env"
echo "2. Add Sentry DSN to .env"
echo "3. Run constructions: docker-compose up -d"
echo "4. Test: bash scripts/test_stripe_integration.sh"
echo ""

