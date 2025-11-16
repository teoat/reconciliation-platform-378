#!/bin/bash
# ==============================================================================
# Redis Backup Script
# ==============================================================================
# Automated backup script for Redis cache data
# Creates timestamped RDB snapshots in the backups directory
# ==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/redis}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="redis_backup_${TIMESTAMP}.rdb"

# Redis connection details
REDIS_PASSWORD="${REDIS_PASSWORD:-redis_pass}"

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}Redis Cache Backup${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}→${NC} Creating backup directory: $BACKUP_DIR"
echo -e "${YELLOW}→${NC} Backup file: $BACKUP_FILE"
echo ""

# Check if Redis is accessible
echo -e "${YELLOW}→${NC} Checking Redis connectivity..."
if docker exec reconciliation-redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✓${NC} Redis is accessible"
else
    echo -e "${RED}✗${NC} Cannot connect to Redis"
    exit 1
fi

# Trigger BGSAVE
echo -e "${YELLOW}→${NC} Triggering background save..."
if docker exec reconciliation-redis redis-cli -a "$REDIS_PASSWORD" BGSAVE 2>/dev/null | grep -q "Background saving started"; then
    echo -e "${GREEN}✓${NC} Background save started"
else
    echo -e "${YELLOW}⚠${NC} Background save might already be in progress"
fi

# Wait for save to complete
echo -e "${YELLOW}→${NC} Waiting for save to complete..."
sleep 2
LASTSAVE=$(docker exec reconciliation-redis redis-cli -a "$REDIS_PASSWORD" LASTSAVE 2>/dev/null)
echo -e "${GREEN}✓${NC} Last save timestamp: $LASTSAVE"

# Copy RDB file from container
echo -e "${YELLOW}→${NC} Copying RDB file from container..."
if docker cp reconciliation-redis:/data/dump.rdb "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} RDB file copied successfully"
else
    echo -e "${RED}✗${NC} Failed to copy RDB file"
    exit 1
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Backup size: $BACKUP_SIZE"

# Compress backup
echo -e "${YELLOW}→${NC} Compressing backup..."
if gzip "$BACKUP_DIR/$BACKUP_FILE"; then
    echo -e "${GREEN}✓${NC} Backup compressed: ${BACKUP_FILE}.gz"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
else
    echo -e "${YELLOW}⚠${NC} Compression failed, keeping uncompressed backup"
fi

# Clean up old backups
echo ""
echo -e "${YELLOW}→${NC} Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "redis_backup_*.rdb.gz" -type f -mtime +$RETENTION_DAYS -delete
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "redis_backup_*.rdb.gz" -type f | wc -l)
echo -e "${GREEN}✓${NC} Current backups: $OLD_BACKUPS"

# Get Redis info
echo ""
echo -e "${YELLOW}→${NC} Redis statistics:"
REDIS_INFO=$(docker exec reconciliation-redis redis-cli -a "$REDIS_PASSWORD" INFO stats 2>/dev/null | grep -E "total_connections_received|total_commands_processed" | head -2)
echo "$REDIS_INFO" | while read line; do
    echo -e "  $line"
done

# Summary
echo ""
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}✓ Backup completed successfully${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo -e "  Backup file: $BACKUP_DIR/$BACKUP_FILE"
echo -e "  Compressed size: $BACKUP_SIZE"
echo -e "  Timestamp: $TIMESTAMP"
echo ""
echo -e "${YELLOW}To restore this backup:${NC}"
echo -e "  gunzip $BACKUP_DIR/$BACKUP_FILE"
echo -e "  docker cp $BACKUP_DIR/${BACKUP_FILE%.gz} reconciliation-redis:/data/dump.rdb"
echo -e "  docker restart reconciliation-redis"
echo ""

