#!/bin/bash

# Database Backup and Restore Script
# This script provides automated backup and restore functionality for PostgreSQL

set -e

# Configuration
DB_NAME="reconciliation_app"
DB_USER="reconciliation_user"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="/backup"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Full database backup
backup_full() {
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/reconciliation_full_$timestamp.sql"
    
    log "Starting full database backup..."
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --create --if-exists \
        --format=plain --file="$backup_file"; then
        log "Full backup completed: $backup_file"
        
        # Compress the backup
        gzip "$backup_file"
        log "Backup compressed: $backup_file.gz"
        
        # Calculate backup size
        local size=$(du -h "$backup_file.gz" | cut -f1)
        log "Backup size: $size"
        
        return 0
    else
        error "Full backup failed"
        return 1
    fi
}

# Schema-only backup
backup_schema() {
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/reconciliation_schema_$timestamp.sql"
    
    log "Starting schema backup..."
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --schema-only --verbose --clean --create --if-exists \
        --format=plain --file="$backup_file"; then
        log "Schema backup completed: $backup_file"
        
        # Compress the backup
        gzip "$backup_file"
        log "Schema backup compressed: $backup_file.gz"
        
        return 0
    else
        error "Schema backup failed"
        return 1
    fi
}

# Data-only backup
backup_data() {
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/reconciliation_data_$timestamp.sql"
    
    log "Starting data backup..."
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --data-only --verbose --format=plain --file="$backup_file"; then
        log "Data backup completed: $backup_file"
        
        # Compress the backup
        gzip "$backup_file"
        log "Data backup compressed: $backup_file.gz"
        
        return 0
    else
        error "Data backup failed"
        return 1
    fi
}

# Restore database from backup
restore() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Backup file not specified"
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    log "Starting database restore from: $backup_file"
    
    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
        log "Decompressing backup file..."
        gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        log "Database restore completed successfully"
        return 0
    else
        error "Database restore failed"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    while IFS= read -r -d '' file; do
        log "Deleting old backup: $(basename "$file")"
        rm "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "reconciliation_*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    log "Cleaned up $deleted_count old backup files"
}

# List available backups
list_backups() {
    log "Available backups:"
    echo
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        warn "No backups found in $BACKUP_DIR"
        return 0
    fi
    
    echo "Backup files in $BACKUP_DIR:"
    ls -lh "$BACKUP_DIR"/reconciliation_*.sql.gz 2>/dev/null | while read -r line; do
        echo "  $line"
    done
    
    echo
    echo "Total backup size: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)"
}

# Database health check
health_check() {
    log "Performing database health check..."
    
    # Check connection
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        error "Cannot connect to database"
        return 1
    fi
    
    # Check database size
    local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | tr -d ' ')
    log "Database size: $db_size"
    
    # Check table counts
    local table_counts=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes
        FROM pg_stat_user_tables 
        ORDER BY schemaname, tablename;
    ")
    
    log "Table statistics:"
    echo "$table_counts"
    
    # Check for long-running queries
    local long_queries=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) FROM pg_stat_activity 
        WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';
    " | tr -d ' ')
    
    if [ "$long_queries" -gt 0 ]; then
        warn "Found $long_queries long-running queries"
    else
        log "No long-running queries detected"
    fi
    
    log "Database health check completed"
}

# Main script logic
main() {
    case "${1:-}" in
        "backup-full")
            create_backup_dir
            backup_full
            cleanup_old_backups
            ;;
        "backup-schema")
            create_backup_dir
            backup_schema
            ;;
        "backup-data")
            create_backup_dir
            backup_data
            ;;
        "restore")
            restore "$2"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "health")
            health_check
            ;;
        *)
            echo "Usage: $0 {backup-full|backup-schema|backup-data|restore <file>|list|cleanup|health}"
            echo
            echo "Commands:"
            echo "  backup-full    - Create a full database backup"
            echo "  backup-schema  - Create a schema-only backup"
            echo "  backup-data    - Create a data-only backup"
            echo "  restore <file>  - Restore database from backup file"
            echo "  list           - List available backups"
            echo "  cleanup        - Remove old backups"
            echo "  health         - Perform database health check"
            echo
            echo "Environment variables:"
            echo "  DB_NAME        - Database name (default: reconciliation_app)"
            echo "  DB_USER        - Database user (default: reconciliation_user)"
            echo "  DB_HOST        - Database host (default: localhost)"
            echo "  DB_PORT        - Database port (default: 5432)"
            echo "  BACKUP_DIR     - Backup directory (default: /backup)"
            echo "  RETENTION_DAYS - Backup retention in days (default: 30)"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
