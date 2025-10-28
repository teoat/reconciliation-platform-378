#!/bin/bash
# Verification Script - Check production readiness
# Verifies all critical components are configured

set -e

echo "🔍 Verifying production setup..."
echo ""

ERRORS=0

# Check environment file
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run setup_production_env.sh first."
    ERRORS=$((ERRORS + 1))
else
    echo "✅ .env file exists"
fi

# Check database connection
echo ""
echo "Checking database connections..."

if grep -q "postgres://user:password" .env; then
    echo "⚠️  Database credentials need to be updated in .env"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Database configuration looks correct"
fi

# Check Stripe configuration
echo ""
echo "Checking Stripe configuration..."

if grep -q "sk_test_your_stripe_secret_key_here" .env; then
    echo "⚠️  Stripe API keys need to be configured in .env"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Stripe configuration looks correct"
fi

# Check email configuration
echo ""
echo "Checking email configuration..."

if grep -lr "your_email@gmail.com" .env; then
    echo "⚠️  Email credentials need to be updated in .env"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Email configuration looks correct"
fi

# Check Docker
echo ""
echo "Checking Docker..."

if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    if docker ps &> /dev/null; then
        echo "✅ Docker daemon is running"
    else
        echo "⚠️  Docker daemon is not running"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ Docker is not installed"
    ERRORS=$((ERRORS + 1))
fi

# Check if migrations have been run
echo ""
echo "Checking database migrations..."

cd backend
if diesel migration list 2>/dev/null | grep -q "Up"; then
    echo "✅ Migrations have been run"
else
    echo "⚠️ Database migrations pending. Run run_migrations.sh"
    ERRORS=$((ERRORS + 1))
fi

cd ..

# Summary
echo ""
echo "=================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Ready for production."
    exit 0
else
    echo "⚠️  Found $ERRORS issue(s) that need attention."
    echo ""
    echo "Run the following to fix issues:"
    echo "1. ./scripts/setup_production_env.sh"
    echo "2. Update .env with your credentials"
    echo "3. ./scripts/run_migrations.sh"
    exit 1
fi

