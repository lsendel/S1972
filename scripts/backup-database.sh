#!/bin/bash

################################################################################
# PostgreSQL Database Backup Script
#
# This script creates compressed backups of the PostgreSQL database
# and manages retention (keeps last 7 days by default)
#
# Usage:
#   ./backup-database.sh [backup_dir] [retention_days]
#
# Example:
#   ./backup-database.sh /var/backups/postgresql 7
################################################################################

set -euo pipefail

# Configuration
BACKUP_DIR="${1:-/var/backups/postgresql}"
RETENTION_DAYS="${2:-7}"
DATE=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/var/log/saas-backup.log"

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

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/backup_${DATE}.sql.gz"

# Log start
echo "[$(date)] Starting database backup..." | tee -a "$LOG_FILE"

# Create backup
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Backup completed successfully: $BACKUP_FILE ($BACKUP_SIZE)" | tee -a "$LOG_FILE"
else
    echo "[$(date)] ERROR: Backup failed!" | tee -a "$LOG_FILE"
    exit 1
fi

# Clean up old backups
echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days..." | tee -a "$LOG_FILE"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# List remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
echo "[$(date)] Current backup count: $BACKUP_COUNT" | tee -a "$LOG_FILE"

# Unset password
unset PGPASSWORD

echo "[$(date)] Backup process completed" | tee -a "$LOG_FILE"
