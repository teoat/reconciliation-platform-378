#!/bin/bash
# Password Manager Setup Script
# Completes all setup steps for the password manager

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo_warn ".env file not found in backend directory"
    echo_info "Creating .env from .env.example..."
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        echo_warn "Please edit backend/.env and set your DATABASE_URL and PASSWORD_MASTER_KEY"
        echo_warn "Then run this script again"
        exit 1
    else
        echo_error ".env.example not found. Please create backend/.env manually"
        exit 1
    fi
fi

# Load environment variables
export $(grep -v '^#' "$BACKEND_DIR/.env" | xargs)

# Step 1: Run Migration
echo_step "Step 1: Running database migration..."
cd "$BACKEND_DIR"
if [ -z "$DATABASE_URL" ]; then
    echo_error "DATABASE_URL not set in .env file"
    exit 1
fi

if diesel migration run; then
    echo_info "✅ Migration completed successfully"
else
    echo_error "❌ Migration failed"
    exit 1
fi

# Step 2: Verify Master Key
echo_step "Step 2: Verifying PASSWORD_MASTER_KEY..."
if [ -z "$PASSWORD_MASTER_KEY" ]; then
    echo_error "PASSWORD_MASTER_KEY not set in .env file"
    echo_warn "Please set PASSWORD_MASTER_KEY in backend/.env"
    exit 1
fi

if [ ${#PASSWORD_MASTER_KEY} -lt 32 ]; then
    echo_warn "PASSWORD_MASTER_KEY should be at least 32 characters for security"
    echo_warn "Current length: ${#PASSWORD_MASTER_KEY}"
fi

echo_info "✅ PASSWORD_MASTER_KEY is set"

# Step 3: Make rotation service executable
echo_step "Step 3: Setting up rotation service..."
chmod +x "$PROJECT_ROOT/scripts/password-rotation-service.sh"
echo_info "✅ Rotation service script is executable"

# Step 4: Summary
echo ""
echo_info "=========================================="
echo_info "Password Manager Setup Complete!"
echo_info "=========================================="
echo ""
echo_info "Next steps:"
echo_info "1. Start the backend server:"
echo_info "   cd backend && cargo run"
echo ""
echo_info "2. Initialize default passwords (after server starts):"
echo_info "   curl -X POST http://localhost:2000/api/passwords/initialize"
echo ""
echo_info "3. Start the rotation service (optional, in separate terminal):"
echo_info "   ./scripts/password-rotation-service.sh start"
echo ""
echo_warn "Note: The backend server must be running before initializing passwords"
echo ""

