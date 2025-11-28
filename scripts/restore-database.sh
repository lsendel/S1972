#!/bin/bash

################################################################################
# PostgreSQL Database Restore Script
#
# This script restores a PostgreSQL database from a compressed backup
#
# Usage:
#   ./restore-database.sh <backup_file>
#
# Example:
#   ./restore-database.sh /var/backups/postgresql/backup_20240101_020000.sql.gz
################################################################################

set -euo pipefail

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "ERROR: No backup file specified"
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"
LOG_FILE="/var/log/saas-restore.log"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE" | tee -a "$LOG_FILE"
    exit 1
fi

# Load environment variables
if [ -f "/var/www/saas-platform/saas-boilerplate/backend/.env" ]; then
    source /var/www/saas-platform/saas-boilerplate/backend/.env
else
    echo "ERROR: .env file not found" | tee -a "$LOG_FILE"
    exit 1
fi

# Database credentials from .env
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Confirmation prompt
echo "WARNING: This will replace the current database with the backup!"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Log start
echo "[$(date)] Starting database restore from $BACKUP_FILE..." | tee -a "$LOG_FILE"

# Create a backup of current database before restore
CURRENT_BACKUP="/tmp/pre-restore-backup_$(date +%Y%m%d_%H%M%S).sql.gz"
echo "[$(date)] Creating safety backup of current database..." | tee -a "$LOG_FILE"
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$CURRENT_BACKUP"
echo "[$(date)] Safety backup created: $CURRENT_BACKUP" | tee -a "$LOG_FILE"

# Drop existing connections to the database
echo "[$(date)] Terminating existing database connections..." | tee -a "$LOG_FILE"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate database
echo "[$(date)] Dropping and recreating database..." | tee -a "$LOG_FILE"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Restore from backup
echo "[$(date)] Restoring from backup..." | tee -a "$LOG_FILE"
gunzip < "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "[$(date)] Database restore completed successfully" | tee -a "$LOG_FILE"
    echo "[$(date)] Safety backup kept at: $CURRENT_BACKUP" | tee -a "$LOG_FILE"
else
    echo "[$(date)] ERROR: Database restore failed!" | tee -a "$LOG_FILE"
    echo "[$(date)] Attempting to restore from safety backup..." | tee -a "$LOG_FILE"
    gunzip < "$CURRENT_BACKUP" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo "[$(date)] Restore process completed" | tee -a "$LOG_FILE"
