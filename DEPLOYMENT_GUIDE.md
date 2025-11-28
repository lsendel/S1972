# Production Deployment Guide

This guide covers deploying the Django + React SaaS platform to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Redis Setup](#redis-setup)
7. [Celery Workers](#celery-workers)
8. [SSL Certificates](#ssl-certificates)
9. [Monitoring](#monitoring)
10. [Backup Strategy](#backup-strategy)
11. [Scaling](#scaling)

---

## Prerequisites

### Required Services
- PostgreSQL 16+
- Redis 7+
- SMTP server (SendGrid, Mailgun, etc.)
- Stripe account (for payments)
- Domain name with DNS access

### Optional Services
- Sentry (error monitoring)
- AWS S3 (media/static files)
- CDN (CloudFlare, CloudFront)

---

## Environment Setup

### 1. Server Requirements

**Minimum Specs:**
- 2 CPU cores
- 4GB RAM
- 20GB SSD
- Ubuntu 22.04 LTS

**Recommended Specs:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.12
sudo apt install python3.12 python3.12-venv python3-pip -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Install supervisor for process management
sudo apt install supervisor -y
```

---

## Backend Deployment

### 1. Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/yourusername/yourrepo.git saas-platform
cd saas-platform/saas-boilerplate/backend
```

### 2. Create Virtual Environment

```bash
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -e .
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your production values
nano .env
```

**Key variables to set:**
- `DJANGO_SECRET_KEY` - Generate with `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
- `DJANGO_ALLOWED_HOSTS`
- Database credentials
- Email configuration
- Stripe keys
- Sentry DSN

### 4. Run Migrations

```bash
# Set Django settings
export DJANGO_SETTINGS_MODULE=config.settings.production

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --no-input
```

### 5. Configure Gunicorn

Create `/etc/supervisor/conf.d/gunicorn.conf`:

```ini
[program:gunicorn]
command=/var/www/saas-platform/saas-boilerplate/backend/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 4 --timeout 120
directory=/var/www/saas-platform/saas-boilerplate/backend
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/gunicorn/gunicorn.log
stderr_logfile=/var/log/gunicorn/gunicorn.err.log
environment=DJANGO_SETTINGS_MODULE="config.settings.production"
```

Create log directory:
```bash
sudo mkdir -p /var/log/gunicorn
sudo touch /var/log/gunicorn/gunicorn.log
sudo touch /var/log/gunicorn/gunicorn.err.log
sudo chown -R www-data:www-data /var/log/gunicorn
```

Start Gunicorn:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start gunicorn
```

---

## Frontend Deployment

### 1. Build Frontend

```bash
cd /var/www/saas-platform/saas-boilerplate/frontend

# Install dependencies
npm ci --production

# Create production .env
cp .env.example .env.production
nano .env.production

# Build
npm run build
```

### 2. Configure Nginx

Create `/etc/nginx/sites-available/saas-platform`:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/saas-platform/saas-boilerplate/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /static/ {
        alias /var/www/saas-platform/saas-boilerplate/backend/staticfiles/;
    }

    location /media/ {
        alias /var/www/saas-platform/saas-boilerplate/backend/media/;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/saas-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Database Setup

### 1. Create Production Database

```bash
sudo -u postgres psql

CREATE DATABASE saas_production;
CREATE USER saas_user WITH PASSWORD 'your-secure-password';
ALTER ROLE saas_user SET client_encoding TO 'utf8';
ALTER ROLE saas_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE saas_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE saas_production TO saas_user;
\q
```

### 2. Enable SSL Connections

Edit `/etc/postgresql/16/main/postgresql.conf`:
```
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## Redis Setup

### 1. Configure Redis

Edit `/etc/redis/redis.conf`:
```
bind 127.0.0.1
protected-mode yes
requirepass your-redis-password
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Restart Redis:
```bash
sudo systemctl restart redis
```

---

## Celery Workers

### 1. Configure Celery Worker

Create `/etc/supervisor/conf.d/celery-worker.conf`:

```ini
[program:celery-worker]
command=/var/www/saas-platform/saas-boilerplate/backend/venv/bin/celery -A config worker -l info
directory=/var/www/saas-platform/saas-boilerplate/backend
user=www-data
numprocs=1
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/celery/worker.log
stderr_logfile=/var/log/celery/worker.err.log
environment=DJANGO_SETTINGS_MODULE="config.settings.production"
```

### 2. Configure Celery Beat (Scheduler)

Create `/etc/supervisor/conf.d/celery-beat.conf`:

```ini
[program:celery-beat]
command=/var/www/saas-platform/saas-boilerplate/backend/venv/bin/celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
directory=/var/www/saas-platform/saas-boilerplate/backend
user=www-data
numprocs=1
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/celery/beat.log
stderr_logfile=/var/log/celery/beat.err.log
environment=DJANGO_SETTINGS_MODULE="config.settings.production"
```

Create log directory and start:
```bash
sudo mkdir -p /var/log/celery
sudo chown -R www-data:www-data /var/log/celery
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start celery-worker
sudo supervisorctl start celery-beat
```

---

## SSL Certificates

### 1. Obtain Let's Encrypt Certificates

```bash
# For frontend
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For API
sudo certbot --nginx -d api.yourdomain.com
```

### 2. Auto-renewal

Certbot automatically sets up renewal. Test with:
```bash
sudo certbot renew --dry-run
```

---

## Monitoring

### 1. Sentry Setup

Backend is already configured. Just set `SENTRY_DSN` in `.env`.

Frontend requires build-time configuration in `.env.production`.

### 2. System Monitoring

**Install monitoring tools:**
```bash
sudo apt install htop iotop nethogs -y
```

**Check logs:**
```bash
# Gunicorn
sudo tail -f /var/log/gunicorn/gunicorn.log

# Celery
sudo tail -f /var/log/celery/worker.log

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Supervisor
sudo supervisorctl status
```

---

## Backup Strategy

### 1. Database Backups

Create `/usr/local/bin/backup-database.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="saas_production"

mkdir -p $BACKUP_DIR

pg_dump -U saas_user -h localhost $DB_NAME | gzip > $BACKUP_DIR/backup_${DATE}.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-database.sh
```

Add cron job (daily at 2 AM):
```bash
sudo crontab -e

# Add line:
0 2 * * * /usr/local/bin/backup-database.sh
```

### 2. Media Files Backup

If using local storage, back up media files:
```bash
0 3 * * * rsync -a /var/www/saas-platform/saas-boilerplate/backend/media/ /var/backups/media/
```

---

## Scaling

### Horizontal Scaling

**1. Load Balancer**
- Use Nginx or HAProxy
- Distribute traffic across multiple app servers

**2. Database**
- Read replicas for read-heavy workloads
- Connection pooling with PgBouncer

**3. Redis**
- Redis Sentinel for high availability
- Redis Cluster for partitioning

**4. Celery**
- Add more worker instances
- Use separate queues for different task types

### Vertical Scaling

**Increase resources:**
```bash
# Monitor resource usage
htop
df -h
free -m

# Adjust Gunicorn workers
# Rule of thumb: (2 x CPU cores) + 1
```

---

## Post-Deployment Checklist

- [ ] DNS records configured
- [ ] SSL certificates installed
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Static files collected
- [ ] Superuser created
- [ ] Gunicorn running
- [ ] Celery workers running
- [ ] Nginx configured
- [ ] Backups scheduled
- [ ] Monitoring configured
- [ ] Email sending tested
- [ ] Stripe webhooks configured
- [ ] OAuth providers configured
- [ ] Security headers verified
- [ ] HTTPS redirect working
- [ ] Performance tested

---

## Troubleshooting

### Common Issues

**1. 502 Bad Gateway**
- Check Gunicorn is running: `sudo supervisorctl status gunicorn`
- Check logs: `sudo tail -f /var/log/gunicorn/gunicorn.err.log`

**2. Static files not loading**
- Run `python manage.py collectstatic`
- Check Nginx static file paths

**3. Database connection errors**
- Verify database credentials
- Check PostgreSQL is running: `sudo systemctl status postgresql`

**4. Celery tasks not executing**
- Check worker status: `sudo supervisorctl status celery-worker`
- Check Redis connection
- Verify environment variables

---

## Security Hardening

### 1. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2Ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Regular Updates

```bash
sudo apt update && sudo apt upgrade -y
```

---

**Deployment complete!** Your SaaS platform is now running in production.

For ongoing maintenance, monitor logs, keep dependencies updated, and maintain regular backups.
