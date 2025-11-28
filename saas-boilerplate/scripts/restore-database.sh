#!/bin/bash
#
# Database Restore Script
# Restores PostgreSQL database from backup
#
# Usage:
#   ./scripts/restore-database.sh <backup_file>
#
# Example:
#   ./scripts/restore-database.sh ./backups/backup-20250128-120000.sql.gz
#

set -e
set -u

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Backup file path required${NC}"
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"

# Validate backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}=== Database Restore Script ===${NC}"
echo "Backup file: ${BACKUP_FILE}"

# Parse DATABASE_URL if set
if [ -n "${DATABASE_URL:-}" ]; then
    DB_USER=$(echo "${DATABASE_URL}" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo "${DATABASE_URL}" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo "${DATABASE_URL}" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "${DATABASE_URL}" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "${DATABASE_URL}" | sed -n 's/.*\/\(.*\)/\1/p')
fi

: "${DB_NAME:?Error: DB_NAME not set}"
: "${DB_USER:?Error: DB_USER not set}"
: "${DB_HOST:=localhost}"
: "${DB_PORT:=5432}"

echo "Target database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"

# Warning prompt
echo -e "${RED}WARNING: This will OVERWRITE the current database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

export PGPASSWORD="${DB_PASSWORD}"

# Decompress if gzipped
RESTORE_FILE="${BACKUP_FILE}"
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup...${NC}"
    RESTORE_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "${BACKUP_FILE}" > "${RESTORE_FILE}"
fi

# Drop and recreate database (optional - comment out if you want to merge)
echo -e "${YELLOW}Dropping existing database...${NC}"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "DROP DATABASE IF EXISTS ${DB_NAME};"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "CREATE DATABASE ${DB_NAME};"

# Restore backup
echo -e "${YELLOW}Restoring backup...${NC}"
if pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v "${RESTORE_FILE}"; then
    echo -e "${GREEN}✓ Database restored successfully!${NC}"
else
    echo -e "${RED}✗ Restore failed!${NC}"
    exit 1
fi

# Clean up decompressed file if we created it
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    rm -f "${RESTORE_FILE}"
fi

echo -e "\n${GREEN}=== Restore Complete ===${NC}"
