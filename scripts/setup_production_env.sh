#!/bin/bash
# Production Environment Setup Script
# Run this script to set up production environment variables

set -e

echo "🚀 Setting up production environment..."

# Check if .env file exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Copy example environment file
cp .env.example .env

echo ""
echo "✅ Environment file created!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Configure Stripe API keys:"
echo "   - Get your Stripe API keys from https://dashboard.stripe.com/apikeys"
echo "   - Update STRIPE_SECRET_KEY in .env"
echo "   - Update STRIPE_PUBLISHABLE_KEY in .env"
echo ""
echo "2. Configure database connections:"
echo "   - Update DATABASE_URL in .env"
echo "   - Update DATABASE_SHARD_X_URL for each shard"
echo ""
echo "3. Configure email service:"
echo "   - Update SMTP credentials in .env"
echo ""
echo "4. Run migrations:"
echo "   cd backend && diesel migration run"
echo ""
echo "5. Start the application:"
echo "   docker-compose up -d"
echo ""
echo "✨ Setup complete!"

