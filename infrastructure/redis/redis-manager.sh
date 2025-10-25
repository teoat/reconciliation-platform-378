#!/bin/bash

# Redis Management Script
# This script provides Redis monitoring, backup, and maintenance functionality

set -e

# Configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
BACKUP_DIR="/backup/redis"
RETENTION_DAYS=7

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Redis connection function
redis_cmd() {
    local cmd="$1"
    if [ -n "$REDIS_PASSWORD" ]; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" $cmd
    else
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $cmd
    fi
}

# Check Redis connection
check_connection() {
    log "Checking Redis connection..."
    
    if redis_cmd "ping" | grep -q "PONG"; then
        log "Redis connection successful"
        return 0
    else
        error "Cannot connect to Redis"
        return 1
    fi
}

# Get Redis info
get_info() {
    log "Getting Redis information..."
    
    echo "=== Redis Server Information ==="
    redis_cmd "INFO server" | grep -E "(redis_version|redis_mode|os|arch_bits|uptime_in_seconds)"
    
    echo
    echo "=== Memory Information ==="
    redis_cmd "INFO memory" | grep -E "(used_memory_human|used_memory_peak_human|maxmemory_human|mem_fragmentation_ratio)"
    
    echo
    echo "=== Persistence Information ==="
    redis_cmd "INFO persistence" | grep -E "(rdb_last_save_time|rdb_last_bgsave_status|aof_enabled|aof_last_write_status)"
    
    echo
    echo "=== Statistics ==="
    redis_cmd "INFO stats" | grep -E "(total_connections_received|total_commands_processed|instantaneous_ops_per_sec|keyspace_hits|keyspace_misses)"
    
    echo
    echo "=== Database Information ==="
    redis_cmd "INFO keyspace"
}

# Monitor Redis performance
monitor_performance() {
    log "Starting Redis performance monitoring..."
    
    echo "Monitoring Redis commands (Press Ctrl+C to stop)..."
    redis_cmd "MONITOR" | while read -r line; do
        echo "$(date +'%Y-%m-%d %H:%M:%S') - $line"
    done
}

# Backup Redis data
backup_data() {
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/redis_backup_$timestamp.rdb"
    
    log "Starting Redis backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Trigger background save
    redis_cmd "BGSAVE"
    
    # Wait for background save to complete
    while [ "$(redis_cmd "LASTSAVE")" = "$(redis_cmd "LASTSAVE")" ]; do
        sleep 1
    done
    
    # Get the RDB file path
    local rdb_path=$(redis_cmd "CONFIG GET dir" | tail -n 1)
    local rdb_filename=$(redis_cmd "CONFIG GET dbfilename" | tail -n 1)
    local full_path="$rdb_path/$rdb_filename"
    
    # Copy RDB file to backup location
    if [ -f "$full_path" ]; then
        cp "$full_path" "$backup_file"
        log "Redis backup completed: $backup_file"
        
        # Compress backup
        gzip "$backup_file"
        log "Backup compressed: $backup_file.gz"
        
        # Calculate backup size
        local size=$(du -h "$backup_file.gz" | cut -f1)
        log "Backup size: $size"
        
        return 0
    else
        error "RDB file not found: $full_path"
        return 1
    fi
}

# Restore Redis data
restore_data() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Backup file not specified"
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    log "Starting Redis restore from: $backup_file"
    
    # Stop Redis (this should be done carefully in production)
    warn "This will stop Redis service. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log "Restore cancelled"
        return 0
    fi
    
    # Get Redis data directory
    local rdb_path=$(redis_cmd "CONFIG GET dir" | tail -n 1)
    local rdb_filename=$(redis_cmd "CONFIG GET dbfilename" | tail -n 1)
    local full_path="$rdb_path/$rdb_filename"
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" > "$full_path"
    else
        cp "$backup_file" "$full_path"
    fi
    
    # Restart Redis
    log "Restarting Redis service..."
    # systemctl restart redis  # Uncomment for systemd
    
    log "Redis restore completed"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up Redis backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    while IFS= read -r -d '' file; do
        log "Deleting old backup: $(basename "$file")"
        rm "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "redis_backup_*.rdb.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    log "Cleaned up $deleted_count old backup files"
}

# List available backups
list_backups() {
    log "Available Redis backups:"
    echo
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        warn "No backups found in $BACKUP_DIR"
        return 0
    fi
    
    echo "Backup files in $BACKUP_DIR:"
    ls -lh "$BACKUP_DIR"/redis_backup_*.rdb.gz 2>/dev/null | while read -r line; do
        echo "  $line"
    done
    
    echo
    echo "Total backup size: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)"
}

# Memory analysis
analyze_memory() {
    log "Analyzing Redis memory usage..."
    
    echo "=== Memory Usage by Key Type ==="
    redis_cmd "INFO memory" | grep -E "(used_memory_human|used_memory_peak_human|maxmemory_human)"
    
    echo
    echo "=== Largest Keys ==="
    redis_cmd "EVAL \"local keys = redis.call('keys', '*'); local result = {}; for i=1,#keys do local size = redis.call('memory', 'usage', keys[i]); table.insert(result, {keys[i], size}); end; table.sort(result, function(a,b) return a[2] > b[2] end); return result\" 0" | head -20
    
    echo
    echo "=== Database Statistics ==="
    redis_cmd "INFO keyspace"
}

# Performance tuning suggestions
performance_tuning() {
    log "Redis Performance Tuning Suggestions:"
    echo
    
    # Check memory usage
    local memory_usage=$(redis_cmd "INFO memory" | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
    local max_memory=$(redis_cmd "INFO memory" | grep "maxmemory_human" | cut -d: -f2 | tr -d '\r')
    
    echo "Memory Usage: $memory_usage"
    echo "Max Memory: $max_memory"
    
    # Check fragmentation
    local fragmentation=$(redis_cmd "INFO memory" | grep "mem_fragmentation_ratio" | cut -d: -f2 | tr -d '\r')
    echo "Memory Fragmentation Ratio: $fragmentation"
    
    if (( $(echo "$fragmentation > 1.5" | bc -l) )); then
        warn "High memory fragmentation detected. Consider restarting Redis."
    fi
    
    # Check hit ratio
    local hits=$(redis_cmd "INFO stats" | grep "keyspace_hits" | cut -d: -f2 | tr -d '\r')
    local misses=$(redis_cmd "INFO stats" | grep "keyspace_misses" | cut -d: -f2 | tr -d '\r')
    local total=$((hits + misses))
    
    if [ $total -gt 0 ]; then
        local hit_ratio=$(echo "scale=2; $hits * 100 / $total" | bc)
        echo "Cache Hit Ratio: ${hit_ratio}%"
        
        if (( $(echo "$hit_ratio < 80" | bc -l) )); then
            warn "Low cache hit ratio. Consider reviewing cache strategy."
        fi
    fi
    
    # Check slow log
    local slow_queries=$(redis_cmd "SLOWLOG LEN")
    echo "Slow Queries: $slow_queries"
    
    if [ $slow_queries -gt 0 ]; then
        warn "Slow queries detected. Review slow log for optimization opportunities."
        redis_cmd "SLOWLOG GET 10"
    fi
}

# Main script logic
main() {
    case "${1:-}" in
        "info")
            check_connection && get_info
            ;;
        "monitor")
            check_connection && monitor_performance
            ;;
        "backup")
            check_connection && backup_data && cleanup_old_backups
            ;;
        "restore")
            restore_data "$2"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "memory")
            check_connection && analyze_memory
            ;;
        "tuning")
            check_connection && performance_tuning
            ;;
        "health")
            check_connection && get_info && performance_tuning
            ;;
        *)
            echo "Usage: $0 {info|monitor|backup|restore <file>|list|cleanup|memory|tuning|health}"
            echo
            echo "Commands:"
            echo "  info      - Get Redis server information"
            echo "  monitor   - Monitor Redis commands in real-time"
            echo "  backup    - Create Redis data backup"
            echo "  restore   - Restore Redis data from backup"
            echo "  list      - List available backups"
            echo "  cleanup   - Remove old backups"
            echo "  memory    - Analyze memory usage"
            echo "  tuning    - Performance tuning suggestions"
            echo "  health    - Complete health check"
            echo
            echo "Environment variables:"
            echo "  REDIS_HOST     - Redis host (default: localhost)"
            echo "  REDIS_PORT     - Redis port (default: 6379)"
            echo "  REDIS_PASSWORD - Redis password (default: none)"
            echo "  BACKUP_DIR     - Backup directory (default: /backup/redis)"
            echo "  RETENTION_DAYS - Backup retention in days (default: 7)"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
