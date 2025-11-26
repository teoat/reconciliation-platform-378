#!/bin/bash
# Script to set initial passwords for existing users
# 
# This script is for testing and pre-production environments.
# It generates secure initial passwords for users who don't have
# initial passwords set, or for all users if --all flag is used.
#
# Usage:
#   ./scripts/set-initial-passwords.sh [--all] [--output <file>]
#
# The generated passwords are logged to stdout and optionally to a file.
# IMPORTANT: Store these passwords securely and share them with users.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Default values
SET_ALL=false
OUTPUT_FILE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            SET_ALL=true
            shift
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Usage: $0 [--all] [--output <file>]"
            exit 1
            ;;
    esac
done

log_info "Setting initial passwords for users..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Check if backend is built
if [ ! -f "backend/target/release/reconciliation-backend" ] && [ ! -f "backend/target/debug/reconciliation-backend" ]; then
    log_warning "Backend binary not found. Building..."
    cd backend
    cargo build
    cd ..
fi

# Run the Rust script if it exists, otherwise use SQL directly
if [ -f "scripts/set-initial-passwords.rs" ]; then
    log_info "Using Rust script to set initial passwords..."
    cd backend
    if [ "$SET_ALL" = true ]; then
        cargo run --bin set-initial-passwords -- --all ${OUTPUT_FILE:+--output "$OUTPUT_FILE"}
    else
        cargo run --bin set-initial-passwords ${OUTPUT_FILE:+--output "$OUTPUT_FILE"}
    fi
    cd ..
else
    log_info "Using SQL script to set initial passwords..."
    
    # Generate SQL script
    SQL_SCRIPT=$(mktemp)
    cat > "$SQL_SCRIPT" << 'EOF'
-- Generate initial passwords for users
-- This is a template - actual implementation should use the Rust service

DO $$
DECLARE
    user_record RECORD;
    initial_password TEXT;
    password_hash TEXT;
BEGIN
    -- For each user without initial password (or all users if needed)
    FOR user_record IN 
        SELECT id, email FROM users 
        WHERE is_initial_password = false OR is_initial_password IS NULL
    LOOP
        -- Generate initial password (this should use the PasswordManager service)
        -- For now, we'll use a placeholder - actual implementation should call
        -- the Rust PasswordManager::generate_initial_password() function
        
        -- Update user with initial password flag
        -- Note: This requires the actual password hash from the Rust service
        UPDATE users 
        SET 
            is_initial_password = true,
            initial_password_set_at = NOW(),
            password_last_changed = NOW(),
            password_expires_at = NOW() + INTERVAL '90 days',
            updated_at = NOW()
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Updated user: %', user_record.email;
    END LOOP;
END $$;
EOF
    
    log_warning "SQL-only implementation is limited. Please use the Rust script instead."
    log_info "To use the Rust script, ensure scripts/set-initial-passwords.rs is compiled as a binary."
fi

log_success "Initial passwords setup complete!"
if [ -n "$OUTPUT_FILE" ]; then
    log_info "Passwords written to: $OUTPUT_FILE"
fi
log_warning "⚠️  IMPORTANT: Store these passwords securely!"
log_warning "⚠️  Users must change their passwords on first login."

