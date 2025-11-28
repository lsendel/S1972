#!/bin/bash

################################################################################
# Docker PostgreSQL Database Backup Script
#
# This script creates compressed backups of the PostgreSQL database
# running in a Docker container
#
# Usage:
#   ./backup-docker.sh [backup_dir] [retention_days]
#
# Example:
#   ./backup-docker.sh /var/backups/saas-platform 7
################################################################################

set -euo pipefail

# Configuration
PROJECT_DIR="/path/to/S1972"  # Update this path
BACKUP_DIR="${1:-/var/backups/saas-platform}"
RETENTION_DAYS="${2:-7}"
DATE=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/var/log/saas-backup.log"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production.yml"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/backup_${DATE}.sql.gz"

# Log start
echo "[$(date)] Starting Docker database backup..." | tee -a "$LOG_FILE"

# Navigate to project directory
cd "$PROJECT_DIR"

# Load environment variables
if [ -f ".env" ]; then
    source .env
else
    echo "ERROR: .env file not found in $PROJECT_DIR" | tee -a "$LOG_FILE"
    exit 1
fi

# Create backup
docker-compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

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

echo "[$(date)] Backup process completed" | tee -a "$LOG_FILE"
