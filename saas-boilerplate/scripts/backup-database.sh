#!/bin/bash
#
# Database Backup Script
# Backs up PostgreSQL database with compression and retention management
#
# Usage:
#   ./scripts/backup-database.sh [backup_dir] [retention_days]
#
# Environment variables required:
#   DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT (or DATABASE_URL)
#

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="${1:-./backups}"
RETENTION_DAYS="${2:-30}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.sql.gz"

# Colors for output
RED='\033[0.31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Database Backup Script ===${NC}"
echo "Backup directory: ${BACKUP_DIR}"
echo "Retention: ${RETENTION_DAYS} days"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Parse DATABASE_URL if set, otherwise use individual vars
if [ -n "${DATABASE_URL:-}" ]; then
    # Extract components from DATABASE_URL
    # Format: postgres://user:password@host:port/dbname
    DB_USER=$(echo "${DATABASE_URL}" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo "${DATABASE_URL}" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo "${DATABASE_URL}" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\(.*\)/\1/p')
fi

# Validate required variables
: "${DB_NAME:?Error: DB_NAME not set}"
: "${DB_USER:?Error: DB_USER not set}"
: "${DB_HOST:=localhost}"
: "${DB_PORT:=5432}"

echo "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"

# Perform backup
echo -e "${YELLOW}Creating backup...${NC}"
export PGPASSWORD="${DB_PASSWORD}"

if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -F c -b -v -f "${BACKUP_FILE%.gz}" "${DB_NAME}"; then
    gzip "${BACKUP_FILE%.gz}"
    echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "Backup size: ${BACKUP_SIZE}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up backups older than ${RETENTION_DAYS} days...${NC}"
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "backup-*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete -print | wc -l)
echo -e "${GREEN}✓ Deleted ${DELETED_COUNT} old backup(s)${NC}"

# List remaining backups
echo -e "\n${GREEN}=== Available Backups ===${NC}"
ls -lh "${BACKUP_DIR}"/backup-*.sql.gz 2>/dev/null || echo "No backups found"

# Optional: Upload to S3 (uncomment if using AWS)
# if [ -n "${AWS_S3_BACKUP_BUCKET:-}" ]; then
#     echo -e "${YELLOW}Uploading to S3...${NC}"
#     aws s3 cp "${BACKUP_FILE}" "s3://${AWS_S3_BACKUP_BUCKET}/backups/$(basename ${BACKUP_FILE})"
#     echo -e "${GREEN}✓ Uploaded to S3${NC}"
# fi

echo -e "\n${GREEN}=== Backup Complete ===${NC}"
