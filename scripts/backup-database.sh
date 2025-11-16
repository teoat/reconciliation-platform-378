#!/bin/bash
# ==============================================================================
# PostgreSQL Database Backup Script
# ==============================================================================
# Automated backup script for the Reconciliation Platform database
# Creates timestamped backups in the backups directory
# ==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/database}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="reconciliation_db_backup_${TIMESTAMP}.sql"

# Database connection details (from docker-compose environment)
POSTGRES_DB="${POSTGRES_DB:-reconciliation_app}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres_pass}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

echo -e "${BLUE}===================================================================${NC}"
echo -e "${BLUE}PostgreSQL Database Backup${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}→${NC} Creating backup directory: $BACKUP_DIR"
echo -e "${YELLOW}→${NC} Database: $POSTGRES_DB"
echo -e "${YELLOW}→${NC} Backup file: $BACKUP_FILE"
echo ""

# Check if database is accessible
echo -e "${YELLOW}→${NC} Checking database connectivity..."
if docker exec reconciliation-postgres pg_isready -h localhost -p 5432 -U "$POSTGRES_USER" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database is accessible"
else
    echo -e "${RED}✗${NC} Cannot connect to database"
    exit 1
fi

# Create backup
echo -e "${YELLOW}→${NC} Creating backup..."
if docker exec reconciliation-postgres pg_dump \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --clean \
    --if-exists \
    --create \
    --no-owner \
    --no-acl > "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Backup created successfully"
else
    echo -e "${RED}✗${NC} Backup failed"
    exit 1
fi

# Compress backup
echo -e "${YELLOW}→${NC} Compressing backup..."
if gzip "$BACKUP_DIR/$BACKUP_FILE"; then
    echo -e "${GREEN}✓${NC} Backup compressed: ${BACKUP_FILE}.gz"
    BACKUP_FILE="${BACKUP_FILE}.gz"
else
    echo -e "${YELLOW}⚠${NC} Compression failed, keeping uncompressed backup"
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✓${NC} Backup size: $BACKUP_SIZE"

# Clean up old backups
echo ""
echo -e "${YELLOW}→${NC} Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "reconciliation_db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "reconciliation_db_backup_*.sql.gz" -type f | wc -l)
echo -e "${GREEN}✓${NC} Current backups: $OLD_BACKUPS"

# Summary
echo ""
echo -e "${BLUE}===================================================================${NC}"
echo -e "${GREEN}✓ Backup completed successfully${NC}"
echo -e "${BLUE}===================================================================${NC}"
echo -e "  Backup file: $BACKUP_DIR/$BACKUP_FILE"
echo -e "  Size: $BACKUP_SIZE"
echo -e "  Timestamp: $TIMESTAMP"
echo ""
echo -e "${YELLOW}To restore this backup:${NC}"
echo -e "  gunzip $BACKUP_DIR/$BACKUP_FILE"
echo -e "  docker exec -i reconciliation-postgres psql -U $POSTGRES_USER < $BACKUP_DIR/${BACKUP_FILE%.gz}"
echo ""

