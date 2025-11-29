#!/bin/bash
# Start Better Auth Server and run tests
# Part of Better Auth migration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Source common functions
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "Starting Better Auth deployment..."

# Check prerequisites
check_command "node" "Node.js is required. Install from https://nodejs.org"
check_command "npm" "npm is required. Install with Node.js"
check_command "psql" "PostgreSQL client is required"

# Navigate to auth-server
cd "$PROJECT_ROOT/auth-server" || exit 1

# Check if .env exists
if [ ! -f ".env" ]; then
    log_warning ".env file not found. Copying from env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        log_info "Created .env file. Please configure it with your values."
        log_info "Required: DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
        exit 1
    else
        log_error "env.example not found. Cannot create .env file."
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install || {
        log_error "Failed to install dependencies"
        exit 1
    }
fi

# Run database migrations
log_info "Running database migrations..."
npm run db:migrate || {
    log_error "Database migrations failed"
    exit 1
}

# Test database connection
log_info "Testing database connection..."
source .env
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" || {
    log_error "Database connection test failed"
    exit 1
}

# Start auth server
log_info "Starting Better Auth server..."
log_info "Server will run on http://localhost:${PORT:-4000}"

npm run dev

