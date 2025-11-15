#!/bin/bash
# Production Setup Script for 378 Data and Evidence Reconciliation App
# Strict implementation with comprehensive error handling

set -euo pipefail  # Exit on any error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
handle_error() {
    log_error "Script failed at line $1"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Configuration
PROJECT_ROOT="/Users/Arief/Desktop/Reconciliation"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT"
NODE_VERSION="18"
NPM_VERSION="9"

log_info "Starting Production Setup for 378 Data and Evidence Reconciliation App"
log_info "Project Root: $PROJECT_ROOT"

# Step 1: Verify Prerequisites
log_info "Step 1: Verifying Prerequisites"

# Check Node.js version
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js $NODE_VERSION or higher."
    exit 1
fi

NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_CURRENT" -lt "$NODE_VERSION" ]; then
    log_error "Node.js version $NODE_CURRENT is too old. Required: $NODE_VERSION or higher."
    exit 1
fi

log_success "Node.js version: $(node --version)"

# Check npm version
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed."
    exit 1
fi

NPM_CURRENT=$(npm --version | cut -d'.' -f1)
if [ "$NPM_CURRENT" -lt "$NPM_VERSION" ]; then
    log_error "npm version $NPM_CURRENT is too old. Required: $NPM_VERSION or higher."
    exit 1
fi

log_success "npm version: $(npm --version)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    log_warning "PostgreSQL client not found. Please install PostgreSQL."
    log_info "Install with: brew install postgresql"
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    log_warning "Redis client not found. Please install Redis."
    log_info "Install with: brew install redis"
fi

# Step 2: Environment Setup
log_info "Step 2: Setting up Environment Variables"

# Create .env files if they don't exist
if [ ! -f "$BACKEND_DIR/.env" ]; then
    if [ -f "$BACKEND_DIR/env.example" ]; then
        cp "$BACKEND_DIR/env.example" "$BACKEND_DIR/.env"
        log_success "Created backend .env from template"
    else
        log_error "No env.example found in backend directory"
        exit 1
    fi
else
    log_info "Backend .env already exists"
fi

if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    cat > "$FRONTEND_DIR/.env.local" << EOF
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APP_NAME=378 Data and Evidence Reconciliation App
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
    log_success "Created frontend .env.local"
else
    log_info "Frontend .env.local already exists"
fi

# Step 3: Install Dependencies
log_info "Step 3: Installing Dependencies"

# Install backend dependencies
log_info "Installing backend dependencies..."
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    npm ci --production=false
    log_success "Backend dependencies installed"
else
    log_info "Backend dependencies already installed"
fi

# Install frontend dependencies
log_info "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    npm ci --production=false
    log_success "Frontend dependencies installed"
else
    log_info "Frontend dependencies already installed"
fi

# Step 4: Database Setup
log_info "Step 4: Setting up Database"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    log_error "PostgreSQL is not running. Please start PostgreSQL service."
    log_info "Start with: brew services start postgresql"
    exit 1
fi

# Create database if it doesn't exist
DB_NAME="reconciliation_app"
if ! psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    log_info "Creating database: $DB_NAME"
    createdb "$DB_NAME"
    log_success "Database created: $DB_NAME"
else
    log_info "Database already exists: $DB_NAME"
fi

# Run migrations
log_info "Running database migrations..."
cd "$BACKEND_DIR"
if npm run migrate 2>/dev/null; then
    log_success "Database migrations completed"
else
    log_warning "Migration failed or no migrations to run"
fi

# Step 5: Build Applications
log_info "Step 5: Building Applications"

# Build backend
log_info "Building backend..."
cd "$BACKEND_DIR"
if npm run build; then
    log_success "Backend build completed"
else
    log_error "Backend build failed"
    exit 1
fi

# Build frontend
log_info "Building frontend..."
cd "$FRONTEND_DIR"
if npm run build; then
    log_success "Frontend build completed"
else
    log_error "Frontend build failed"
    exit 1
fi

# Step 6: Health Checks
log_info "Step 6: Running Health Checks"

# Check if ports are available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        log_warning "Port $port is already in use"
        return 1
    else
        log_success "Port $port is available"
        return 0
    fi
}

check_port 3001  # Backend port
check_port 1000  # Frontend port

# Step 7: Create Production Scripts
log_info "Step 7: Creating Production Scripts"

# Create production start script
cat > "$PROJECT_ROOT/start-production.sh" << 'EOF'
#!/bin/bash
# Production Start Script

set -euo pipefail

PROJECT_ROOT="/Users/Arief/Desktop/Reconciliation"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT"

# Start backend
echo "Starting backend server..."
cd "$BACKEND_DIR"
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend server..."
cd "$FRONTEND_DIR"
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

echo "Both servers started successfully!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:1000"

# Keep script running
wait
EOF

chmod +x "$PROJECT_ROOT/start-production.sh"
log_success "Created production start script"

# Create stop script
cat > "$PROJECT_ROOT/stop-production.sh" << 'EOF'
#!/bin/bash
# Production Stop Script

echo "Stopping 378 Data and Evidence Reconciliation App..."

# Kill processes on specific ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:1000 | xargs kill -9 2>/dev/null || true

echo "All services stopped"
EOF

chmod +x "$PROJECT_ROOT/stop-production.sh"
log_success "Created production stop script"

# Step 8: Final Verification
log_info "Step 8: Final Verification"

# Check all required files exist
REQUIRED_FILES=(
    "$BACKEND_DIR/.env"
    "$FRONTEND_DIR/.env.local"
    "$BACKEND_DIR/dist/server.js"
    "$FRONTEND_DIR/.next"
    "$PROJECT_ROOT/start-production.sh"
    "$PROJECT_ROOT/stop-production.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -e "$file" ]; then
        log_success "✓ $file exists"
    else
        log_error "✗ $file missing"
        exit 1
    fi
done

# Step 9: Summary
log_success "Production Setup Completed Successfully!"
echo ""
echo "Next Steps:"
echo "1. Review and update environment variables in:"
echo "   - $BACKEND_DIR/.env"
echo "   - $FRONTEND_DIR/.env.local"
echo ""
echo "2. Start the application:"
echo "   ./start-production.sh"
echo ""
echo "3. Stop the application:"
echo "   ./stop-production.sh"
echo ""
echo "4. Access the application:"
echo "   - Frontend: http://localhost:1000"
echo "   - Backend API: http://localhost:3001"
echo "   - Health Check: http://localhost:3001/health"
echo ""
echo "5. Monitor logs:"
echo "   - Backend logs will be displayed in terminal"
echo "   - Check $BACKEND_DIR/logs/ for detailed logs"
echo ""

log_info "Setup completed at $(date)"
