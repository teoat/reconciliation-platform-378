#!/bin/bash
# Apply Database Indexes for Query Optimization
# This script applies recommended database indexes to improve query performance

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "Applying database indexes for query optimization..."

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Check if backend is built
if [ ! -f "$SCRIPT_DIR/../backend/target/release/reconciliation-backend" ]; then
    log_info "Building backend binary..."
    cd "$SCRIPT_DIR/../backend"
    cargo build --release --bin reconciliation-backend
    cd "$SCRIPT_DIR"
fi

# Run index creation using Rust binary
log_info "Creating recommended indexes..."
cd "$SCRIPT_DIR/../backend"

# Use the query optimizer service to create indexes
if cargo run --release --bin reconciliation-backend -- --apply-indexes 2>/dev/null; then
    log_success "Database indexes applied successfully"
else
    # Fallback: Use direct SQL if binary doesn't support --apply-indexes
    log_info "Using alternative method to apply indexes..."
    
    # Create temporary SQL file with indexes
    cat > /tmp/apply_indexes.sql <<'EOF'
-- Reconciliation Jobs Indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_project_id ON reconciliation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_status ON reconciliation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_created_at ON reconciliation_jobs(created_at);

-- Reconciliation Results Indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_results_job_id ON reconciliation_results(job_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_results_match_type ON reconciliation_results(match_type);

-- Projects Indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Data Sources Indexes
CREATE INDEX IF NOT EXISTS idx_data_sources_project_id ON data_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);

-- Composite Indexes for Common Queries
CREATE INDEX IF NOT EXISTS idx_reconciliation_jobs_project_status ON reconciliation_jobs(project_id, status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_results_job_match ON reconciliation_results(job_id, match_type);
EOF

    # Apply indexes using psql if available
    if command -v psql &> /dev/null; then
        log_info "Applying indexes using psql..."
        psql "$DATABASE_URL" -f /tmp/apply_indexes.sql
        log_success "Database indexes applied successfully"
    else
        log_warning "psql not found. Please apply indexes manually using the SQL file: /tmp/apply_indexes.sql"
        log_info "You can also use: psql \$DATABASE_URL -f /tmp/apply_indexes.sql"
    fi
fi

cd "$SCRIPT_DIR"
log_success "Database index application complete"

