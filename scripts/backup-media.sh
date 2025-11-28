#!/bin/bash

################################################################################
# Media Files Backup Script
#
# This script creates compressed backups of media files
#
# Usage:
#   ./backup-media.sh [backup_dir] [retention_days]
#
# Example:
#   ./backup-media.sh /var/backups/media 30
################################################################################

set -euo pipefail

# Configuration
MEDIA_DIR="/var/www/saas-platform/saas-boilerplate/backend/media"
BACKUP_DIR="${1:-/var/backups/media}"
RETENTION_DAYS="${2:-30}"
DATE=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/var/log/saas-backup.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/media_backup_${DATE}.tar.gz"

# Log start
echo "[$(date)] Starting media files backup..." | tee -a "$LOG_FILE"

# Check if media directory exists
if [ ! -d "$MEDIA_DIR" ]; then
    echo "ERROR: Media directory not found: $MEDIA_DIR" | tee -a "$LOG_FILE"
    exit 1
fi

# Create backup
tar -czf "$BACKUP_FILE" -C "$(dirname "$MEDIA_DIR")" "$(basename "$MEDIA_DIR")"

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Media backup completed successfully: $BACKUP_FILE ($BACKUP_SIZE)" | tee -a "$LOG_FILE"
else
    echo "[$(date)] ERROR: Media backup failed!" | tee -a "$LOG_FILE"
    exit 1
fi

# Clean up old backups
echo "[$(date)] Cleaning up media backups older than $RETENTION_DAYS days..." | tee -a "$LOG_FILE"
find "$BACKUP_DIR" -name "media_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# List remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "media_backup_*.tar.gz" | wc -l)
echo "[$(date)] Current media backup count: $BACKUP_COUNT" | tee -a "$LOG_FILE"

echo "[$(date)] Media backup process completed" | tee -a "$LOG_FILE"
