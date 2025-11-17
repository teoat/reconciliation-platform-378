#!/bin/bash

# Google OAuth Setup Script
# This script creates the .env.local file with your Google OAuth credentials

FRONTEND_ENV_FILE=".env.local"
BACKEND_ENV_FILE="../backend/.env.local"

echo "🔧 Setting up Google OAuth configuration..."

# Frontend .env.local
cat > "$FRONTEND_ENV_FILE" << EOF
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com
EOF

echo "✅ Created $FRONTEND_ENV_FILE"

# Backend .env.local
if [ -d "../backend" ]; then
  cat > "$BACKEND_ENV_FILE" << EOF
# Google OAuth Configuration
# Client ID is used for token validation (optional but recommended)
GOOGLE_CLIENT_ID=600300535059-8jtb47bloe0jmj8b6ff4gpg2t5q5mg8n.apps.googleusercontent.com

# Client Secret (currently not used in token verification, but kept for future use)
# The backend uses Google's tokeninfo endpoint which doesn't require the secret
GOOGLE_CLIENT_SECRET=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
EOF
  echo "✅ Created $BACKEND_ENV_FILE"
else
  echo "⚠️  Backend directory not found. Please create backend/.env.local manually."
fi

echo ""
echo "🎉 Google OAuth configuration complete!"
echo ""
echo "Next steps:"
echo "  1. Restart frontend: npm run dev"
echo "  2. Restart backend: cd ../backend && cargo run"
echo "  3. Visit http://localhost:1000/login"
echo "  4. Check for Google Sign-In button"
echo ""

