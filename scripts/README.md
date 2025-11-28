# Backup and Restore Scripts

This directory contains automated backup and restore scripts for the SaaS platform.

## Scripts Overview

### Database Backups

#### `backup-database.sh`
Backs up PostgreSQL database (non-Docker deployment).

```bash
# Usage
./backup-database.sh [backup_dir] [retention_days]

# Example
./backup-database.sh /var/backups/postgresql 7

# Automated with cron (daily at 2 AM)
crontab -e
0 2 * * * /path/to/scripts/backup-database.sh
```

#### `backup-docker.sh`
Backs up PostgreSQL database running in Docker.

```bash
# Update PROJECT_DIR in script first
nano backup-docker.sh

# Usage
./backup-docker.sh [backup_dir] [retention_days]

# Example
./backup-docker.sh /var/backups/saas-platform 7

# Automated with cron
0 2 * * * /path/to/scripts/backup-docker.sh
```

### Database Restore

#### `restore-database.sh`
Restores PostgreSQL database from backup (non-Docker).

```bash
# Usage
./restore-database.sh <backup_file>

# Example
./restore-database.sh /var/backups/postgresql/backup_20240101_020000.sql.gz
```

**Safety Features:**
- Creates safety backup before restore
- Requires confirmation prompt
- Can rollback if restore fails

#### `restore-docker.sh`
Restores PostgreSQL database from backup (Docker).

```bash
# Update PROJECT_DIR in script first
nano restore-docker.sh

# Usage
./restore-docker.sh <backup_file>

# Example
./restore-docker.sh /var/backups/saas-platform/backup_20240101_020000.sql.gz
```

### Media Files Backup

#### `backup-media.sh`
Backs up media files directory.

```bash
# Usage
./backup-media.sh [backup_dir] [retention_days]

# Example - keep 30 days of media backups
./backup-media.sh /var/backups/media 30

# Automated with cron (daily at 3 AM)
0 3 * * * /path/to/scripts/backup-media.sh
```

## Installation

### 1. Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

### 2. Update Configuration

For Docker scripts, update the `PROJECT_DIR` variable:

```bash
nano scripts/backup-docker.sh
nano scripts/restore-docker.sh

# Update this line:
PROJECT_DIR="/path/to/S1972"
```

### 3. Create Log Directory

```bash
sudo mkdir -p /var/log
sudo touch /var/log/saas-backup.log
sudo touch /var/log/saas-restore.log
sudo chown $USER:$USER /var/log/saas-*.log
```

### 4. Set Up Automated Backups

```bash
crontab -e

# Add the following lines:

# Database backup (daily at 2 AM)
0 2 * * * /path/to/scripts/backup-database.sh

# Media backup (daily at 3 AM)
0 3 * * * /path/to/scripts/backup-media.sh
```

For Docker deployments:

```bash
crontab -e

# Database backup (daily at 2 AM)
0 2 * * * /path/to/scripts/backup-docker.sh

# Media backup (daily at 3 AM)
0 3 * * * /path/to/scripts/backup-media.sh
```

## Backup Retention

Default retention periods:
- Database backups: 7 days
- Media backups: 30 days

Adjust by passing retention days as the second argument:

```bash
# Keep database backups for 14 days
./backup-database.sh /var/backups/postgresql 14

# Keep media backups for 60 days
./backup-media.sh /var/backups/media 60
```

## Off-site Backups

For production, consider syncing backups to off-site storage:

### AWS S3

```bash
# Install AWS CLI
sudo apt install awscli

# Configure credentials
aws configure

# Sync backups to S3 (daily at 4 AM)
crontab -e
0 4 * * * aws s3 sync /var/backups/ s3://your-bucket/backups/ --delete
```

### Rsync to Remote Server

```bash
# Set up SSH key authentication first

# Sync backups (daily at 4 AM)
crontab -e
0 4 * * * rsync -avz /var/backups/ user@remote-server:/backups/saas-platform/
```

## Monitoring

### Check Backup Logs

```bash
# View backup log
tail -f /var/log/saas-backup.log

# View restore log
tail -f /var/log/saas-restore.log
```

### Verify Backups

```bash
# List all database backups
ls -lh /var/backups/postgresql/

# Check backup file integrity
gunzip -t /var/backups/postgresql/backup_20240101_020000.sql.gz

# List all media backups
ls -lh /var/backups/media/
```

### Alert on Backup Failures

Add email notifications to cron jobs:

```bash
crontab -e

# Email on failure
MAILTO=admin@yourdomain.com
0 2 * * * /path/to/scripts/backup-database.sh || echo "Database backup failed"
```

## Disaster Recovery

### Full Restore Process

1. **Restore Database:**
   ```bash
   ./restore-database.sh /var/backups/postgresql/backup_latest.sql.gz
   ```

2. **Restore Media Files:**
   ```bash
   tar -xzf /var/backups/media/media_backup_latest.tar.gz -C /var/www/saas-platform/saas-boilerplate/backend/
   ```

3. **Restart Services:**
   ```bash
   # Non-Docker
   sudo supervisorctl restart all

   # Docker
   docker-compose -f docker-compose.production.yml restart
   ```

4. **Verify Application:**
   - Check health endpoints
   - Test user login
   - Verify data integrity

## Best Practices

1. **Test Restores Regularly** - Verify backups work by testing restore process monthly
2. **Monitor Backup Size** - Track backup file sizes to detect issues
3. **Use Off-site Storage** - Always maintain backups in a different location
4. **Document Recovery Time** - Know your RTO (Recovery Time Objective)
5. **Encrypt Sensitive Backups** - Use GPG for additional security
6. **Version Backups** - Keep multiple versions (7 days minimum)
7. **Alert on Failures** - Set up monitoring for backup job failures

## Troubleshooting

### Permission Denied

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix log file permissions
sudo chown $USER:$USER /var/log/saas-*.log
```

### Backup Directory Full

```bash
# Check disk space
df -h

# Manually clean old backups
find /var/backups -name "backup_*.sql.gz" -mtime +7 -delete
```

### Restore Fails

Check the safety backup created before restore:
```bash
ls /tmp/pre-restore-backup_*.sql.gz
./restore-database.sh /tmp/pre-restore-backup_XXXXXXXX_XXXXXX.sql.gz
```

## Security Considerations

- Backup files contain sensitive data - secure them appropriately
- Limit access to backup directories
- Consider encrypting backups for compliance
- Rotate backup encryption keys regularly
- Audit backup access logs

---

For more information, see:
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
- [DOCKER_DEPLOYMENT.md](../DOCKER_DEPLOYMENT.md)
