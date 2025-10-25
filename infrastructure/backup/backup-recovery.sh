#!/bin/bash

# Comprehensive Backup and Disaster Recovery Script for Reconciliation Platform
# This script handles automated backups, disaster recovery, and data restoration

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
COMPRESSION_LEVEL=6
ENCRYPTION_KEY_FILE="/etc/backup/encryption.key"
NOTIFICATION_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
LOG_FILE="/var/log/backup/backup-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Backup $status: $message\"}" \
            "$NOTIFICATION_WEBHOOK" || log_warning "Failed to send notification"
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local tools=("pg_dump" "redis-cli" "kubectl" "tar" "gzip" "openssl")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed. Please install it first."
            exit 1
        fi
    done
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
    
    # Check if encryption key exists
    if [ ! -f "$ENCRYPTION_KEY_FILE" ]; then
        log_warning "Encryption key not found. Creating new key..."
        mkdir -p "$(dirname "$ENCRYPTION_KEY_FILE")"
        openssl rand -base64 32 > "$ENCRYPTION_KEY_FILE"
        chmod 600 "$ENCRYPTION_KEY_FILE"
    fi
    
    log_success "Prerequisites check completed"
}

# Backup PostgreSQL database
backup_postgresql() {
    log_info "Starting PostgreSQL backup..."
    
    local backup_file="$BACKUP_DIR/postgresql-$(date +%Y%m%d_%H%M%S).sql"
    local compressed_file="${backup_file}.gz"
    local encrypted_file="${compressed_file}.enc"
    
    # Get database connection details
    local db_host="${DB_HOST:-localhost}"
    local db_port="${DB_PORT:-5432}"
    local db_name="${DB_NAME:-reconciliation_app}"
    local db_user="${DB_USER:-reconciliation_user}"
    local db_password="${DB_PASSWORD}"
    
    if [ -z "$db_password" ]; then
        log_error "Database password not provided"
        return 1
    fi
    
    # Set password for pg_dump
    export PGPASSWORD="$db_password"
    
    # Create database backup
    log_info "Creating database dump..."
    if pg_dump -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
        --verbose --no-password --format=plain --no-owner --no-privileges \
        --exclude-table-data=audit_logs \
        --exclude-table-data=sessions \
        > "$backup_file" 2>>"$LOG_FILE"; then
        
        log_success "Database dump created: $backup_file"
        
        # Compress backup
        log_info "Compressing backup..."
        if gzip -"$COMPRESSION_LEVEL" "$backup_file"; then
            log_success "Backup compressed: $compressed_file"
            
            # Encrypt backup
            log_info "Encrypting backup..."
            if openssl enc -aes-256-cbc -salt -in "$compressed_file" -out "$encrypted_file" \
                -pass file:"$ENCRYPTION_KEY_FILE"; then
                log_success "Backup encrypted: $encrypted_file"
                
                # Remove unencrypted file
                rm -f "$compressed_file"
                
                # Verify backup
                verify_backup "$encrypted_file" "postgresql"
                
                return 0
            else
                log_error "Failed to encrypt backup"
                return 1
            fi
        else
            log_error "Failed to compress backup"
            return 1
        fi
    else
        log_error "Failed to create database dump"
        return 1
    fi
}

# Backup Redis data
backup_redis() {
    log_info "Starting Redis backup..."
    
    local backup_file="$BACKUP_DIR/redis-$(date +%Y%m%d_%H%M%S).rdb"
    local compressed_file="${backup_file}.gz"
    local encrypted_file="${compressed_file}.enc"
    
    # Get Redis connection details
    local redis_host="${REDIS_HOST:-localhost}"
    local redis_port="${REDIS_PORT:-6379}"
    local redis_password="${REDIS_PASSWORD:-}"
    
    # Create Redis backup
    log_info "Creating Redis dump..."
    if [ -n "$redis_password" ]; then
        redis-cli -h "$redis_host" -p "$redis_port" -a "$redis_password" --rdb "$backup_file"
    else
        redis-cli -h "$redis_host" -p "$redis_port" --rdb "$backup_file"
    fi
    
    if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
        log_success "Redis dump created: $backup_file"
        
        # Compress backup
        log_info "Compressing backup..."
        if gzip -"$COMPRESSION_LEVEL" "$backup_file"; then
            log_success "Backup compressed: $compressed_file"
            
            # Encrypt backup
            log_info "Encrypting backup..."
            if openssl enc -aes-256-cbc -salt -in "$compressed_file" -out "$encrypted_file" \
                -pass file:"$ENCRYPTION_KEY_FILE"; then
                log_success "Backup encrypted: $encrypted_file"
                
                # Remove unencrypted file
                rm -f "$compressed_file"
                
                # Verify backup
                verify_backup "$encrypted_file" "redis"
                
                return 0
            else
                log_error "Failed to encrypt backup"
                return 1
            fi
        else
            log_error "Failed to compress backup"
            return 1
        fi
    else
        log_error "Failed to create Redis dump"
        return 1
    fi
}

# Backup Kubernetes configurations
backup_kubernetes() {
    log_info "Starting Kubernetes configuration backup..."
    
    local backup_file="$BACKUP_DIR/kubernetes-$(date +%Y%m%d_%H%M%S).tar.gz"
    local encrypted_file="${backup_file}.enc"
    
    # Create temporary directory for Kubernetes configs
    local temp_dir=$(mktemp -d)
    
    # Backup namespaces
    log_info "Backing up namespaces..."
    kubectl get namespaces -o yaml > "$temp_dir/namespaces.yaml"
    
    # Backup all resources in reconciliation namespace
    log_info "Backing up reconciliation namespace resources..."
    kubectl get all -n reconciliation -o yaml > "$temp_dir/reconciliation-resources.yaml"
    
    # Backup secrets
    log_info "Backing up secrets..."
    kubectl get secrets -n reconciliation -o yaml > "$temp_dir/secrets.yaml"
    
    # Backup configmaps
    log_info "Backing up configmaps..."
    kubectl get configmaps -n reconciliation -o yaml > "$temp_dir/configmaps.yaml"
    
    # Backup persistent volumes
    log_info "Backing up persistent volumes..."
    kubectl get pv,pvc -n reconciliation -o yaml > "$temp_dir/volumes.yaml"
    
    # Create tar archive
    log_info "Creating Kubernetes backup archive..."
    if tar -czf "$backup_file" -C "$temp_dir" .; then
        log_success "Kubernetes backup created: $backup_file"
        
        # Encrypt backup
        log_info "Encrypting backup..."
        if openssl enc -aes-256-cbc -salt -in "$backup_file" -out "$encrypted_file" \
            -pass file:"$ENCRYPTION_KEY_FILE"; then
            log_success "Backup encrypted: $encrypted_file"
            
            # Remove unencrypted file
            rm -f "$backup_file"
            
            # Verify backup
            verify_backup "$encrypted_file" "kubernetes"
            
            # Cleanup
            rm -rf "$temp_dir"
            
            return 0
        else
            log_error "Failed to encrypt backup"
            return 1
        fi
    else
        log_error "Failed to create Kubernetes backup"
        rm -rf "$temp_dir"
        return 1
    fi
}

# Backup application files
backup_application_files() {
    log_info "Starting application files backup..."
    
    local backup_file="$BACKUP_DIR/application-files-$(date +%Y%m%d_%H%M%S).tar.gz"
    local encrypted_file="${backup_file}.enc"
    
    # Create temporary directory for application files
    local temp_dir=$(mktemp -d)
    
    # Backup uploaded files
    log_info "Backing up uploaded files..."
    if [ -d "/app/uploads" ]; then
        cp -r /app/uploads "$temp_dir/"
    fi
    
    # Backup configuration files
    log_info "Backing up configuration files..."
    if [ -d "/app/config" ]; then
        cp -r /app/config "$temp_dir/"
    fi
    
    # Backup logs
    log_info "Backing up application logs..."
    if [ -d "/app/logs" ]; then
        cp -r /app/logs "$temp_dir/"
    fi
    
    # Create tar archive
    log_info "Creating application files backup archive..."
    if tar -czf "$backup_file" -C "$temp_dir" .; then
        log_success "Application files backup created: $backup_file"
        
        # Encrypt backup
        log_info "Encrypting backup..."
        if openssl enc -aes-256-cbc -salt -in "$backup_file" -out "$encrypted_file" \
            -pass file:"$ENCRYPTION_KEY_FILE"; then
            log_success "Backup encrypted: $encrypted_file"
            
            # Remove unencrypted file
            rm -f "$backup_file"
            
            # Verify backup
            verify_backup "$encrypted_file" "application-files"
            
            # Cleanup
            rm -rf "$temp_dir"
            
            return 0
        else
            log_error "Failed to encrypt backup"
            return 1
        fi
    else
        log_error "Failed to create application files backup"
        rm -rf "$temp_dir"
        return 1
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    local backup_type="$2"
    
    log_info "Verifying $backup_type backup integrity..."
    
    # Check if file exists and has content
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        log_error "Backup file is missing or empty: $backup_file"
        return 1
    fi
    
    # Check file size
    local file_size=$(stat -c%s "$backup_file")
    if [ "$file_size" -lt 1024 ]; then
        log_warning "Backup file is very small: $file_size bytes"
    fi
    
    log_success "Backup verification completed: $backup_file ($file_size bytes)"
    return 0
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        log_info "Deleting old backup: $file"
        rm -f "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "*.enc" -type f -mtime +$RETENTION_DAYS -print0)
    
    log_success "Cleaned up $deleted_count old backup files"
}

# Upload backups to remote storage
upload_to_remote_storage() {
    log_info "Uploading backups to remote storage..."
    
    local s3_bucket="${S3_BUCKET:-reconciliation-backups}"
    local aws_region="${AWS_REGION:-us-west-2}"
    
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        log_warning "AWS credentials not provided. Skipping remote upload."
        return 0
    fi
    
    # Upload today's backups
    local today_backups=$(find "$BACKUP_DIR" -name "*$(date +%Y%m%d)*.enc" -type f)
    
    for backup_file in $today_backups; do
        local filename=$(basename "$backup_file")
        log_info "Uploading $filename to S3..."
        
        if aws s3 cp "$backup_file" "s3://$s3_bucket/$(date +%Y/%m/%d)/$filename" \
            --region "$aws_region" --storage-class STANDARD_IA; then
            log_success "Uploaded $filename to S3"
        else
            log_error "Failed to upload $filename to S3"
        fi
    done
}

# Restore from backup
restore_from_backup() {
    local backup_type="$1"
    local backup_file="$2"
    
    log_info "Starting restore from $backup_type backup: $backup_file"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    case "$backup_type" in
        "postgresql")
            restore_postgresql "$backup_file"
            ;;
        "redis")
            restore_redis "$backup_file"
            ;;
        "kubernetes")
            restore_kubernetes "$backup_file"
            ;;
        "application-files")
            restore_application_files "$backup_file"
            ;;
        *)
            log_error "Unknown backup type: $backup_type"
            return 1
            ;;
    esac
}

# Restore PostgreSQL database
restore_postgresql() {
    local encrypted_file="$1"
    local temp_file=$(mktemp)
    
    log_info "Restoring PostgreSQL database..."
    
    # Decrypt backup
    if openssl enc -aes-256-cbc -d -in "$encrypted_file" -out "$temp_file" \
        -pass file:"$ENCRYPTION_KEY_FILE"; then
        
        # Decompress backup
        local sql_file=$(mktemp)
        if gunzip -c "$temp_file" > "$sql_file"; then
            
            # Get database connection details
            local db_host="${DB_HOST:-localhost}"
            local db_port="${DB_PORT:-5432}"
            local db_name="${DB_NAME:-reconciliation_app}"
            local db_user="${DB_USER:-reconciliation_user}"
            local db_password="${DB_PASSWORD}"
            
            if [ -z "$db_password" ]; then
                log_error "Database password not provided"
                return 1
            fi
            
            # Set password for psql
            export PGPASSWORD="$db_password"
            
            # Restore database
            if psql -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
                -f "$sql_file" 2>>"$LOG_FILE"; then
                log_success "PostgreSQL database restored successfully"
                
                # Cleanup
                rm -f "$temp_file" "$sql_file"
                return 0
            else
                log_error "Failed to restore PostgreSQL database"
                rm -f "$temp_file" "$sql_file"
                return 1
            fi
        else
            log_error "Failed to decompress backup"
            rm -f "$temp_file"
            return 1
        fi
    else
        log_error "Failed to decrypt backup"
        return 1
    fi
}

# Restore Redis data
restore_redis() {
    local encrypted_file="$1"
    local temp_file=$(mktemp)
    
    log_info "Restoring Redis data..."
    
    # Decrypt backup
    if openssl enc -aes-256-cbc -d -in "$encrypted_file" -out "$temp_file" \
        -pass file:"$ENCRYPTION_KEY_FILE"; then
        
        # Decompress backup
        local rdb_file=$(mktemp)
        if gunzip -c "$temp_file" > "$rdb_file"; then
            
            # Get Redis connection details
            local redis_host="${REDIS_HOST:-localhost}"
            local redis_port="${REDIS_PORT:-6379}"
            local redis_password="${REDIS_PASSWORD:-}"
            
            # Stop Redis to restore data
            log_info "Stopping Redis for restore..."
            if [ -n "$redis_password" ]; then
                redis-cli -h "$redis_host" -p "$redis_port" -a "$redis_password" SHUTDOWN SAVE
            else
                redis-cli -h "$redis_host" -p "$redis_port" SHUTDOWN SAVE
            fi
            
            # Copy RDB file to Redis data directory
            local redis_data_dir="/var/lib/redis"
            if [ -d "$redis_data_dir" ]; then
                cp "$rdb_file" "$redis_data_dir/dump.rdb"
                chown redis:redis "$redis_data_dir/dump.rdb"
                
                # Start Redis
                log_info "Starting Redis..."
                systemctl start redis
                
                log_success "Redis data restored successfully"
                
                # Cleanup
                rm -f "$temp_file" "$rdb_file"
                return 0
            else
                log_error "Redis data directory not found: $redis_data_dir"
                rm -f "$temp_file" "$rdb_file"
                return 1
            fi
        else
            log_error "Failed to decompress backup"
            rm -f "$temp_file"
            return 1
        fi
    else
        log_error "Failed to decrypt backup"
        return 1
    fi
}

# Main backup function
perform_backup() {
    local backup_type="${1:-all}"
    
    log_info "Starting backup process for type: $backup_type"
    
    local success_count=0
    local total_count=0
    
    case "$backup_type" in
        "postgresql")
            total_count=1
            if backup_postgresql; then
                ((success_count++))
            fi
            ;;
        "redis")
            total_count=1
            if backup_redis; then
                ((success_count++))
            fi
            ;;
        "kubernetes")
            total_count=1
            if backup_kubernetes; then
                ((success_count++))
            fi
            ;;
        "application-files")
            total_count=1
            if backup_application_files; then
                ((success_count++))
            fi
            ;;
        "all")
            total_count=4
            if backup_postgresql; then
                ((success_count++))
            fi
            if backup_redis; then
                ((success_count++))
            fi
            if backup_kubernetes; then
                ((success_count++))
            fi
            if backup_application_files; then
                ((success_count++))
            fi
            ;;
        *)
            log_error "Unknown backup type: $backup_type"
            exit 1
            ;;
    esac
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Upload to remote storage
    upload_to_remote_storage
    
    # Send notification
    if [ "$success_count" -eq "$total_count" ]; then
        log_success "Backup completed successfully: $success_count/$total_count"
        send_notification "SUCCESS" "All backups completed successfully"
    else
        log_error "Backup completed with errors: $success_count/$total_count"
        send_notification "FAILURE" "Backup completed with errors: $success_count/$total_count"
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  backup [TYPE]     Perform backup (postgresql|redis|kubernetes|application-files|all)"
    echo "  restore TYPE FILE Restore from backup"
    echo "  list             List available backups"
    echo "  verify FILE      Verify backup integrity"
    echo "  cleanup          Clean up old backups"
    echo ""
    echo "Environment Variables:"
    echo "  DB_HOST          PostgreSQL host (default: localhost)"
    echo "  DB_PORT          PostgreSQL port (default: 5432)"
    echo "  DB_NAME          PostgreSQL database name (default: reconciliation_app)"
    echo "  DB_USER          PostgreSQL username (default: reconciliation_user)"
    echo "  DB_PASSWORD      PostgreSQL password (required)"
    echo "  REDIS_HOST       Redis host (default: localhost)"
    echo "  REDIS_PORT       Redis port (default: 6379)"
    echo "  REDIS_PASSWORD   Redis password (optional)"
    echo "  S3_BUCKET        S3 bucket for remote storage (optional)"
    echo "  AWS_REGION       AWS region (default: us-west-2)"
    echo "  SLACK_WEBHOOK_URL Slack webhook for notifications (optional)"
    echo ""
    echo "Examples:"
    echo "  $0 backup all"
    echo "  $0 backup postgresql"
    echo "  $0 restore postgresql /backups/postgresql-20240101_120000.sql.gz.enc"
    echo "  $0 list"
    echo "  $0 verify /backups/postgresql-20240101_120000.sql.gz.enc"
}

# List available backups
list_backups() {
    log_info "Available backups:"
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "*.enc" -type f -printf "%T@ %Tc %p\n" | sort -nr | while read -r timestamp date_time filepath; do
            local filename=$(basename "$filepath")
            local size=$(stat -c%s "$filepath")
            local size_mb=$((size / 1024 / 1024))
            echo "  $date_time - $filename (${size_mb}MB)"
        done
    else
        log_warning "Backup directory not found: $BACKUP_DIR"
    fi
}

# Main script logic
case "${1:-backup}" in
    backup)
        check_prerequisites
        perform_backup "${2:-all}"
        ;;
    restore)
        if [ -z "$2" ] || [ -z "$3" ]; then
            log_error "Restore command requires backup type and file path"
            usage
            exit 1
        fi
        check_prerequisites
        restore_from_backup "$2" "$3"
        ;;
    list)
        list_backups
        ;;
    verify)
        if [ -z "$2" ]; then
            log_error "Verify command requires file path"
            usage
            exit 1
        fi
        verify_backup "$2" "unknown"
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac