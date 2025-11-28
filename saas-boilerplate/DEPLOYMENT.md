# Production Deployment Guide

This guide covers deploying the SaaS Boilerplate to production using Docker Compose with Traefik as a reverse proxy.

## Prerequisites

- Server with Docker and Docker Compose installed (Ubuntu 22.04 LTS recommended)
- Domain name pointed to your server's IP address
- SSL certificate (automated via Let's Encrypt)
- Minimum 2GB RAM, 2 CPU cores, 20GB disk space

## Initial Server Setup

### 1. Install Docker & Docker Compose

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 2. Configure Firewall

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3. Create Docker Network

```bash
docker network create web
```

## Configuration

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/saas-boilerplate.git
cd saas-boilerplate
```

### 2. Create Production Environment File

```bash
cp backend/.env.production.example backend/.env
```

Edit `backend/.env` with your production values:

```bash
# Required Configuration
DJANGO_SECRET_KEY=<generate-50+-char-random-string>
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# Database
DB_NAME=saas_production
DB_USER=postgres
DB_PASSWORD=<strong-password>

# Redis
REDIS_PASSWORD=<strong-password>

# Field Encryption (CRITICAL for TOTP secrets)
FIELD_ENCRYPTION_KEY=<generate-with-fernet>

# Generate encryption key:
python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid example)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=<sendgrid-api-key>
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Sentry (optional but recommended)
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production

# GitHub Container Registry
GITHUB_REPOSITORY=yourusername/saas-boilerplate
IMAGE_TAG=latest
```

### 3. Generate Traefik Dashboard Password

```bash
# Generate bcrypt password hash
echo $(htpasswd -nb admin your-password-here)
# Copy output to .env as TRAEFIK_DASHBOARD_AUTH
```

## Deployment

### 1. Pull Docker Images

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull latest images
docker compose -f docker-compose.prod.yml pull
```

### 2. Run Database Migrations

```bash
# Start database only
docker compose -f docker-compose.prod.yml up -d db redis

# Wait for database to be ready
sleep 10

# Run migrations
docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate
```

### 3. Create Superuser

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py createsuperuser
```

### 4. Collect Static Files

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput
```

### 5. Start All Services

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 6. Verify Deployment

```bash
# Check running containers
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Test health endpoint
curl https://api.yourdomain.com/api/v1/health/

# Access your site
# Frontend: https://yourdomain.com
# API: https://api.yourdomain.com
# Admin: https://api.yourdomain.com/admin
# Traefik Dashboard: https://traefik.yourdomain.com
```

## Database Backups

### Automated Backups (Recommended)

Set up daily backups via cron:

```bash
# Create backups directory
mkdir -p /opt/saas-boilerplate/backups

# Add to crontab (crontab -e)
0 2 * * * cd /opt/saas-boilerplate && ./scripts/backup-database.sh /opt/saas-boilerplate/backups 30 >> /var/log/backup.log 2>&1
```

### Manual Backup

```bash
./scripts/backup-database.sh ./backups 30
```

### Restore from Backup

```bash
./scripts/restore-database.sh ./backups/backup-20250128-120000.sql.gz
```

## SSL/TLS Certificates

Traefik automatically handles Let's Encrypt certificates. Verify:

```bash
# Check certificate
docker compose -f docker-compose.prod.yml exec traefik cat /letsencrypt/acme.json | jq
```

Certificates renew automatically. If issues occur:

```bash
# Remove and regenerate
docker compose -f docker-compose.prod.yml down
rm traefik-letsencrypt/*
docker compose -f docker-compose.prod.yml up -d
```

## Monitoring & Logs

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Prometheus Metrics (Optional)

Access Prometheus dashboard: `https://prometheus.yourdomain.com`

### Sentry Error Tracking

Configure SENTRY_DSN in `.env` to enable error tracking at https://sentry.io

## Scaling

### Horizontal Scaling (Multiple Workers)

Edit `docker-compose.prod.yml`:

```yaml
celery-worker:
  deploy:
    replicas: 4  # Increase from 2
```

Apply changes:

```bash
docker compose -f docker-compose.prod.yml up -d --scale celery-worker=4
```

### Vertical Scaling (Resource Limits)

Edit resource limits in `docker-compose.prod.yml`:

```yaml
db:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 4G
```

## Updates & Deployments

### Zero-Downtime Deployment

```bash
# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Run migrations (backend-only startup)
docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

# Restart services one by one
docker compose -f docker-compose.prod.yml up -d --no-deps --build backend
docker compose -f docker-compose.prod.yml up -d --no-deps --build frontend
docker compose -f docker-compose.prod.yml up -d --no-deps celery-worker
docker compose -f docker-compose.prod.yml up -d --no-deps celery-beat
```

### Rollback

```bash
# Pull specific version
IMAGE_TAG=v1.2.3 docker compose -f docker-compose.prod.yml pull

# Restart with specific version
IMAGE_TAG=v1.2.3 docker compose -f docker-compose.prod.yml up -d
```

## Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Set strong `DJANGO_SECRET_KEY` (50+ characters)
- [ ] Set `FIELD_ENCRYPTION_KEY` (Fernet key)
- [ ] Configure firewall (UFW or cloud security groups)
- [ ] Enable HTTPS (automatic via Traefik)
- [ ] Set up database backups
- [ ] Configure Sentry for error tracking
- [ ] Review CORS_ALLOWED_ORIGINS
- [ ] Test password reset emails
- [ ] Verify health check endpoints
- [ ] Set up monitoring/alerting
- [ ] Enable fail2ban for SSH protection
- [ ] Regular security updates (`apt-get update && apt-get upgrade`)

## Troubleshooting

### Database Connection Issues

```bash
# Check database logs
docker compose -f docker-compose.prod.yml logs db

# Test connection
docker compose -f docker-compose.prod.yml exec backend python manage.py dbshell
```

### SSL Certificate Issues

```bash
# Check Traefik logs
docker compose -f docker-compose.prod.yml logs traefik

# Verify DNS points to server
dig yourdomain.com

# Test HTTP challenge
curl http://yourdomain.com/.well-known/acme-challenge/test
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Celery Workers Not Processing

```bash
# Check Celery logs
docker compose -f docker-compose.prod.yml logs celery-worker

# Inspect Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

## Maintenance

### Database Vacuum (PostgreSQL)

```bash
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d saas_production -c "VACUUM ANALYZE;"
```

### Docker Cleanup

```bash
# Remove unused images/containers
docker system prune -af

# Remove old volumes (CAREFUL!)
docker volume prune
```

### Log Rotation

Logs rotate automatically with Docker's logging driver. To configure:

Edit `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:

```bash
sudo systemctl restart docker
```

## Support

For issues:
1. Check application logs
2. Check Sentry for errors
3. Review this guide's troubleshooting section
4. Check GitHub Issues

## Next Steps

- Set up CloudWatch/ELK for log aggregation
- Configure APM monitoring (Datadog/New Relic)
- Set up uptime monitoring (Pingdom/UptimeRobot)
- Implement blue-green deployments
- Set up disaster recovery procedures
