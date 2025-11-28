# Docker Production Deployment Guide

This guide covers deploying the SaaS platform using Docker and Docker Compose.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Building Images](#building-images)
5. [Running Services](#running-services)
6. [SSL Setup](#ssl-setup)
7. [Monitoring](#monitoring)
8. [Backups](#backups)
9. [Scaling](#scaling)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Docker 24+ ([Install Guide](https://docs.docker.com/get-docker/))
- Docker Compose 2.20+ ([Install Guide](https://docs.docker.com/compose/install/))
- Domain name with DNS access
- At least 4GB RAM and 20GB disk space

### External Services
- Stripe account (for payments)
- SMTP server (SendGrid, Mailgun, etc.)
- Sentry account (optional, for error monitoring)

---

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourusername/yourrepo.git
cd yourrepo

# 2. Create environment file
cp .env.docker.example .env
nano .env  # Update with your values

# 3. Create backend environment file
cp saas-boilerplate/backend/.env.example saas-boilerplate/backend/.env
nano saas-boilerplate/backend/.env  # Update with your values

# 4. Build and start services
docker-compose -f docker-compose.production.yml up -d

# 5. Run migrations
docker-compose -f docker-compose.production.yml exec backend python manage.py migrate

# 6. Create superuser
docker-compose -f docker-compose.production.yml exec backend python manage.py createsuperuser

# 7. Check status
docker-compose -f docker-compose.production.yml ps
```

Your application should now be running at:
- Frontend: http://localhost
- API: http://localhost/api (proxied through nginx)

---

## Environment Configuration

### Root .env File

Copy `.env.docker.example` to `.env` and configure:

```bash
# Database credentials
DB_NAME=saas_production
DB_USER=saas_user
DB_PASSWORD=strong-random-password-here

# Redis password
REDIS_PASSWORD=another-strong-password

# Django secret key
DJANGO_SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

# Email (example with SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Stripe keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Sentry
SENTRY_DSN=https://...@sentry.io/...
```

### Backend .env File

The backend container also needs its own `.env` file at `saas-boilerplate/backend/.env`.

Copy from `saas-boilerplate/backend/.env.example` and configure similarly.

### Frontend Environment

Frontend environment is baked into the build. Update `saas-boilerplate/frontend/.env.production`:

```bash
VITE_API_URL=https://api.yourdomain.com
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_SENTRY_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0
```

**Note**: After changing frontend environment, rebuild the frontend image.

---

## Building Images

### Build All Services

```bash
docker-compose -f docker-compose.production.yml build
```

### Build Specific Service

```bash
# Backend only
docker-compose -f docker-compose.production.yml build backend

# Frontend only
docker-compose -f docker-compose.production.yml build frontend
```

### Build with No Cache

```bash
docker-compose -f docker-compose.production.yml build --no-cache
```

---

## Running Services

### Start All Services

```bash
docker-compose -f docker-compose.production.yml up -d
```

### Stop All Services

```bash
docker-compose -f docker-compose.production.yml down
```

### Restart Specific Service

```bash
docker-compose -f docker-compose.production.yml restart backend
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.production.yml logs --tail=100 backend
```

### Check Service Status

```bash
docker-compose -f docker-compose.production.yml ps
```

---

## SSL Setup

### Option 1: Let's Encrypt with Certbot (Automated)

**1. Initial Certificate Acquisition**

First, modify `nginx/conf.d/saas-platform.conf` to serve HTTP only (comment out HTTPS server blocks).

Then run:

```bash
# Start nginx
docker-compose -f docker-compose.production.yml up -d nginx

# Obtain certificates
docker-compose -f docker-compose.production.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --no-eff-email

docker-compose -f docker-compose.production.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d api.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --no-eff-email
```

**2. Update Nginx Configuration**

Uncomment the HTTPS server blocks in `nginx/conf.d/saas-platform.conf`.

**3. Restart Nginx**

```bash
docker-compose -f docker-compose.production.yml restart nginx
```

**4. Auto-renewal**

The certbot container automatically renews certificates every 12 hours.

### Option 2: Custom SSL Certificates

Place your certificates in:
- `./certbot/conf/live/yourdomain.com/fullchain.pem`
- `./certbot/conf/live/yourdomain.com/privkey.pem`
- `./certbot/conf/live/api.yourdomain.com/fullchain.pem`
- `./certbot/conf/live/api.yourdomain.com/privkey.pem`

Then update nginx configuration and restart.

---

## Monitoring

### Health Checks

All services have health checks configured. View health status:

```bash
docker-compose -f docker-compose.production.yml ps
```

Healthy services show `healthy` status.

### Application Logs

```bash
# Backend application logs
docker-compose -f docker-compose.production.yml logs -f backend

# Celery worker logs
docker-compose -f docker-compose.production.yml logs -f celery-worker

# Celery beat logs
docker-compose -f docker-compose.production.yml logs -f celery-beat

# Nginx logs
docker-compose -f docker-compose.production.yml logs -f nginx
```

### Database Logs

```bash
docker-compose -f docker-compose.production.yml logs -f postgres
```

### Resource Usage

```bash
# View resource usage for all containers
docker stats

# Specific container
docker stats saas-backend
```

### Sentry Integration

Sentry is configured in both backend and frontend. Errors are automatically reported to your Sentry project.

---

## Backups

### Database Backups

**Manual Backup:**

```bash
# Create backup
docker-compose -f docker-compose.production.yml exec postgres \
  pg_dump -U saas_user saas_production | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Automated Backups with Cron:**

Create `/usr/local/bin/backup-docker-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/saas-platform"
DATE=$(date +"%Y%m%d_%H%M%S")
COMPOSE_FILE="/path/to/docker-compose.production.yml"

mkdir -p $BACKUP_DIR

cd /path/to/project
docker-compose -f $COMPOSE_FILE exec -T postgres \
  pg_dump -U saas_user saas_production | gzip > $BACKUP_DIR/backup_${DATE}.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

Make executable and add to crontab:

```bash
sudo chmod +x /usr/local/bin/backup-docker-db.sh
crontab -e

# Add line:
0 2 * * * /usr/local/bin/backup-docker-db.sh
```

**Restore from Backup:**

```bash
# Stop backend services
docker-compose -f docker-compose.production.yml stop backend celery-worker celery-beat

# Restore database
gunzip < backup_20240101_020000.sql.gz | \
  docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U saas_user saas_production

# Restart services
docker-compose -f docker-compose.production.yml start backend celery-worker celery-beat
```

### Media Files Backup

```bash
# Backup media files
docker-compose -f docker-compose.production.yml exec backend \
  tar -czf /tmp/media_backup.tar.gz /app/media

docker cp saas-backend:/tmp/media_backup.tar.gz ./media_backup_$(date +%Y%m%d).tar.gz
```

---

## Scaling

### Horizontal Scaling

**Scale Celery Workers:**

```bash
# Scale to 3 workers
docker-compose -f docker-compose.production.yml up -d --scale celery-worker=3
```

**Scale Backend (requires load balancer):**

Modify `docker-compose.production.yml`:

```yaml
backend:
  deploy:
    replicas: 3
```

Then use an external load balancer (AWS ALB, Nginx, etc.) to distribute traffic.

### Vertical Scaling

**Resource Limits:**

Add to services in `docker-compose.production.yml`:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs service-name

# Check if ports are already in use
sudo lsof -i :80
sudo lsof -i :443

# Rebuild and restart
docker-compose -f docker-compose.production.yml build service-name
docker-compose -f docker-compose.production.yml up -d service-name
```

### Database Connection Errors

```bash
# Check if postgres is healthy
docker-compose -f docker-compose.production.yml ps postgres

# Check postgres logs
docker-compose -f docker-compose.production.yml logs postgres

# Verify database credentials in .env
cat .env | grep DB_

# Test connection manually
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U saas_user -d saas_production -c "SELECT 1;"
```

### Permission Errors

```bash
# Fix ownership on volumes
docker-compose -f docker-compose.production.yml exec backend chown -R appuser:appuser /app/media
docker-compose -f docker-compose.production.yml exec backend chown -R appuser:appuser /app/staticfiles
```

### Static Files Not Loading

```bash
# Rebuild backend with static collection
docker-compose -f docker-compose.production.yml build backend
docker-compose -f docker-compose.production.yml up -d backend

# Verify static files volume
docker-compose -f docker-compose.production.yml exec nginx ls -la /var/www/static
```

### Redis Connection Issues

```bash
# Check Redis health
docker-compose -f docker-compose.production.yml ps redis

# Test connection
docker-compose -f docker-compose.production.yml exec redis redis-cli -a your-redis-password ping
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
docker-compose -f docker-compose.production.yml ps backend

# Check backend health
docker-compose -f docker-compose.production.yml exec backend curl http://localhost:8000/api/v1/health/

# Check nginx logs
docker-compose -f docker-compose.production.yml logs nginx
```

---

## Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose -f docker-compose.production.yml build

# Run migrations (if any)
docker-compose -f docker-compose.production.yml exec backend python manage.py migrate

# Restart services (zero-downtime with proper setup)
docker-compose -f docker-compose.production.yml up -d
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (WARNING: This removes data!)
docker volume prune

# Remove stopped containers
docker container prune
```

---

## Production Checklist

- [ ] Environment variables configured in `.env`
- [ ] Backend `.env` file configured
- [ ] Frontend environment variables set
- [ ] SSL certificates obtained and configured
- [ ] Database backups scheduled
- [ ] Sentry configured for error monitoring
- [ ] Email sending tested
- [ ] Stripe webhooks configured
- [ ] OAuth providers configured
- [ ] Resource limits set for containers
- [ ] Log rotation configured
- [ ] Monitoring dashboards set up
- [ ] Firewall rules configured
- [ ] Domain DNS records pointed to server
- [ ] Health checks verified
- [ ] Performance tested

---

**Your SaaS platform is now running with Docker!**

For non-Docker deployment, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
