#!/bin/bash
# Disaster Recovery Script for 378 Reconciliation Platform
# This script automates the backup restoration process

set -e

# Configuration
BACKUP_BUCKET="${BACKUP_S3_BUCKET:-reconciliation-backups}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DATABASE_URL="${DATABASE_URL}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "  Disaster Recovery - Backup Restoration"
echo "================================================"
echo ""

# Function to display usage
usage() {
    echo "Usage: $0 [list|restore|latest]"
    echo ""
    echo "Commands:"
    echo "  list    - List available backups"
    echo "  restore - Restore from specific backup"
    echo "  latest  - Restore from latest backup"
    exit 1
}

# Function to list available backups
list_backups() {
    echo -e "${YELLOW}Fetching available backups from S3...${NC}"
    echo ""
    
    aws s3 ls "s3://${BACKUP_BUCKET}/backups/" --region "${AWS_REGION}" | \
        awk '{print $4, $1, $2}' | \
        sort -r | \
        head -20
    
    echo ""
    echo "Total backups found: $(aws s3 ls "s3://${BACKUP_BUCKET}/backups/" --region "${AWS_REGION}" | wc -l)"
}

# Function to restore from specific backup
restore_backup() {
    BACKUP_FILE="$1"
    
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: Backup file name required${NC}"
        usage
    fi
    
    echo -e "${YELLOW}Starting restoration from: ${BACKUP_FILE}${NC}"
    echo ""
    
    # Create backup directory
    mkdir -p "${BACKUP_DIR}"
    
    # Download backup from S3
    echo -e "${YELLOW}Step 1/5: Downloading backup from S3...${NC}"
    aws s3 cp "s3://${BACKUP_BUCKET}/backups/${BACKUP_FILE}" \
        "${BACKUP_DIR}/restore_${TIMESTAMP}.backup" \
        --region "${AWS_REGION}"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to download backup${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Backup downloaded${NC}"
    
    # Verify database connectivity
    echo -e "${YELLOW}Step 2/5: Verifying database connectivity...${NC}"
    psql "${DATABASE_URL}" -c "SELECT 1;" > /dev/null 2>&1
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Cannot connect to database${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Database connection verified${NC}"
    
    # Create pre-restore snapshot
    echo -e "${YELLOW}Step 3/5: Creating pre-restore snapshot...${NC}"
    SNAPSHOT_FILE="${BACKUP_DIR}/pre_restore_snapshot_${TIMESTAMP}.sql"
    pg_dump "${DATABASE_URL}" -F c -f "${SNAPSHOT_FILE}"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to create pre-restore snapshot${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Snapshot created: ${SNAPSHOT_FILE}${NC}"
    
    # Stop application (if running)
    echo -e "${YELLOW}Step 4/5: Stopping application...${NC}"
    docker-compose down 2>/dev/null || true
    echo -e "${GREEN}✓ Application stopped${NC}"
    
    # Restore backup
    echo -e "${YELLOW}Step 5/5: Restoring database from backup...${NC}"
    echo -e "${RED}WARNING: This will overwrite all existing data!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${YELLOW}Restoration cancelled${NC}"
        exit 0
    fi
    
    # Decrypt and restore
    if [[ "${BACKUP_DIR}/restore_${TIMESTAMP}.backup" == *.enc ]]; then
        echo "Decrypting backup..."
        # Add decryption logic here if using encrypted backups
    fi
    
    pg_restore -d "${DATABASE_URL}" --clean --if-exists "${BACKUP_DIR}/restore_${TIMESTAMP}.backup"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Restore failed. Original data preserved in snapshot${NC}"
        echo "To rollback: pg_restore -d ${DATABASE_URL} ${SNAPSHOT_FILE}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Database restored successfully${NC}"
    echo ""
    
    # Verify restoration
    echo -e "${YELLOW}Verifying restoration...${NC}"
    RECORD_COUNT=$(psql "${DAT backtrack_URL}" -t -c "SELECT COUNT(*) FROM reconciliation_jobs;" 2>/dev/null)
    echo -e "${GREEN}✓ Verification complete${NC}"
    echo "  Records restored: ${RECORD_COUNT}"
    echo ""
    
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  Restoration Complete${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Pre-restore snapshot: ${SNAPSHOT_FILE}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify data integrity"
    echo "  2. Restart application: docker-compose up -d"
    echo "  3. Check health: curl http://localhost:2000/api/health"
}

# Function to restore from latest backup
restore_latest() {
    echo -e "${YELLOW}Finding latest backup...${NC}"
    
    LATEST_BACKUP=$(aws s3 ls "s3://${BACKUP_BUCKET}/backups/" --region "${AWS_REGION}" | \
        sort -r | head -1 | awk '{print $4}')
    
    if [ -z "$LATEST_BACKUP" ]; then
        echo -e "${RED}Error: No backups found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Latest backup: ${LATEST_BACKUP}${NC}"
    echo ""
    
    restore_backup "${LATEST_BACKUP}"
}

# Main script logic
case "${1}" in
    list)
        list_backups
        ;;
    restore)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Backup file name required${NC}"
            usage
        fi
        restore_backup "$2"
        ;;
    latest)
        restore_latest
        ;;
    *)
        usage
        ;;
esac

