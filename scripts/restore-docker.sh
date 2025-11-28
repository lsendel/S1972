#!/bin/bash

################################################################################
# Docker PostgreSQL Database Restore Script
#
# This script restores a PostgreSQL database running in Docker from a backup
#
# Usage:
#   ./restore-docker.sh <backup_file>
#
# Example:
#   ./restore-docker.sh /var/backups/saas-platform/backup_20240101_020000.sql.gz
################################################################################

set -euo pipefail

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "ERROR: No backup file specified"
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"
PROJECT_DIR="/path/to/S1972"  # Update this path
LOG_FILE="/var/log/saas-restore.log"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production.yml"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE" | tee -a "$LOG_FILE"
    exit 1
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Load environment variables
if [ -f ".env" ]; then
    source .env
else
    echo "ERROR: .env file not found in $PROJECT_DIR" | tee -a "$LOG_FILE"
    exit 1
fi

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
echo "[$(date)] Starting Docker database restore from $BACKUP_FILE..." | tee -a "$LOG_FILE"

# Stop services that use the database
echo "[$(date)] Stopping backend services..." | tee -a "$LOG_FILE"
docker-compose -f "$COMPOSE_FILE" stop backend celery-worker celery-beat

# Create a safety backup before restore
CURRENT_BACKUP="/tmp/pre-restore-backup_$(date +%Y%m%d_%H%M%S).sql.gz"
echo "[$(date)] Creating safety backup of current database..." | tee -a "$LOG_FILE"
docker-compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$CURRENT_BACKUP"
echo "[$(date)] Safety backup created: $CURRENT_BACKUP" | tee -a "$LOG_FILE"

# Drop and recreate database
echo "[$(date)] Dropping and recreating database..." | tee -a "$LOG_FILE"
docker-compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker-compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Restore from backup
echo "[$(date)] Restoring from backup..." | tee -a "$LOG_FILE"
gunzip < "$BACKUP_FILE" | docker-compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -U "$DB_USER" -d "$DB_NAME"

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "[$(date)] Database restore completed successfully" | tee -a "$LOG_FILE"
else
    echo "[$(date)] ERROR: Database restore failed!" | tee -a "$LOG_FILE"
    echo "[$(date)] Attempting to restore from safety backup..." | tee -a "$LOG_FILE"
    gunzip < "$CURRENT_BACKUP" | docker-compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U "$DB_USER" -d "$DB_NAME"
    exit 1
fi

# Restart services
echo "[$(date)] Restarting backend services..." | tee -a "$LOG_FILE"
docker-compose -f "$COMPOSE_FILE" start backend celery-worker celery-beat

echo "[$(date)] Restore process completed" | tee -a "$LOG_FILE"
echo "[$(date)] Safety backup kept at: $CURRENT_BACKUP" | tee -a "$LOG_FILE"
