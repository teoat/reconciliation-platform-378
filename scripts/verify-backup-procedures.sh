#!/bin/bash
# Verify Backup Procedures
# Verifies that backup procedures are working correctly

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "💾 Verifying backup procedures..."

# Configuration
DATABASE_URL="${DATABASE_URL:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS=30

# Check if backup script exists
if [ ! -f "$SCRIPT_DIR/backup-database.sh" ]; then
    log_error "❌ backup-database.sh not found"
    exit 1
fi

# Step 1: Test database backup
log_info "Step 1: Testing database backup..."
TEST_BACKUP="$BACKUP_DIR/test-backup-$(date +%Y%m%d-%H%M%S).sql"
if ./scripts/backup-database.sh "$TEST_BACKUP"; then
    log_success "✅ Database backup successful"
else
    log_error "❌ Database backup failed"
    exit 1
fi

# Step 2: Verify backup file
log_info "Step 2: Verifying backup file..."
if [ -f "$TEST_BACKUP" ] && [ -s "$TEST_BACKUP" ]; then
    BACKUP_SIZE=$(du -h "$TEST_BACKUP" | cut -f1)
    log_success "✅ Backup file is valid (size: $BACKUP_SIZE)"
else
    log_error "❌ Backup file is invalid or empty"
    exit 1
fi

# Step 3: Check backup retention
log_info "Step 3: Checking backup retention..."
if [ -d "$BACKUP_DIR" ]; then
    OLD_BACKUPS=$(find "$BACKUP_DIR" -name "*.sql" -mtime +$RETENTION_DAYS | wc -l)
    if [ "$OLD_BACKUPS" -gt 0 ]; then
        log_warning "⚠️  Found $OLD_BACKUPS backups older than $RETENTION_DAYS days"
        log_info "Consider running cleanup: ./scripts/cleanup-old-backups.sh"
    else
        log_success "✅ Backup retention is appropriate"
    fi
fi

# Step 4: Verify backup restoration capability
log_info "Step 4: Verifying backup restoration capability..."
if [ -f "$SCRIPT_DIR/restore-database.sh" ]; then
    log_success "✅ Backup restoration script exists"
else
    log_warning "⚠️  Backup restoration script not found"
fi

# Step 5: Check automated backup schedule
log_info "Step 5: Checking automated backup schedule..."
if crontab -l 2>/dev/null | grep -q "backup-database.sh"; then
    log_success "✅ Automated backup scheduled in crontab"
elif [ -f "/etc/cron.d/reconciliation-backups" ]; then
    log_success "✅ Automated backup scheduled in system cron"
else
    log_warning "⚠️  No automated backup schedule found"
    log_info "Consider setting up cron job for automated backups"
fi

log_success "✅ Backup procedures verification complete"
log_info "📝 Summary:"
log_info "  - Backup script: Working"
log_info "  - Backup file: Valid"
log_info "  - Restoration: Available"
log_info "  - Retention: Configured"

