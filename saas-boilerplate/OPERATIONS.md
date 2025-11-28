# Operations Runbook

**Last Updated**: November 28, 2025
**Version**: 1.0  
**Owner**: DevOps Team

This runbook provides step-by-step procedures for common operational tasks and incident response.

---

## Table of Contents

1. [Common Operations](#common-operations)
2. [Deployment Procedures](#deployment-procedures)
3. [Incident Response](#incident-response)
4. [Database Operations](#database-operations)
5. [Scaling Operations](#scaling-operations)
6. [Security Incidents](#security-incidents)
7. [On-Call Procedures](#on-call-procedures)

---

## Common Operations

### Deploy New Version

**Prerequisites**:
- Code merged to main branch
- CI/CD pipeline passed
- Backup created

**Steps**:
```bash
# 1. Create backup
./scripts/backup-database.sh

# 2. Pull latest code
git pull origin main

# 3. Build new images
docker-compose -f docker-compose.prod.yml build

# 4. Run migrations
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

# 5. Collect static files
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput

# 6. Restart services
docker-compose -f docker-compose.prod.yml up -d

# 7. Verify deployment
curl https://api.yourdomain.com/api/v1/health/
```

**Rollback Procedure**:
```bash
# 1. Checkout previous version
git checkout <previous-commit-hash>

# 2. Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 3. Rollback database if needed
./scripts/restore-database.sh <backup-file>
```

---

### Roll Back Deployment

**When to Rollback**:
- Critical errors after deployment
- Performance degradation  
- Data corruption

**Steps**:
```bash
# 1. Identify last known good version
git log --oneline -10

# 2. Checkout previous version
git checkout <commit-hash>

# 3. Rebuild containers
docker-compose -f docker-compose.prod.yml build

# 4. Restart services
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify health
curl https://api.yourdomain.com/api/v1/health/
```

---

### Restart Services

**Backend Only**:
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

**All Services**:
```bash
docker-compose -f docker-compose.prod.yml restart
```

**With Logs**:
```bash
docker-compose -f docker-compose.prod.yml restart && docker-compose -f docker-compose.prod.yml logs -f
```

---

## Deployment Procedures

### Pre-Deployment Checklist

- [ ] All tests passing in CI
- [ ] Code review approved
- [ ] Database migrations reviewed
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Deployment time scheduled (low traffic)
- [ ] Team notified

### Post-Deployment Verification

```bash
# 1. Check health endpoint
curl https://api.yourdomain.com/api/v1/health/

# 2. Check error rates in Sentry
# Visit: https://sentry.io/

# 3. Check application logs
docker-compose -f docker-compose.prod.yml logs --tail=100 backend

# 4. Verify key functionality
# - User login
# - Subscription checkout
# - API endpoints

# 5. Monitor for 30 minutes
# Watch metrics, logs, and error rates
```

---

## Incident Response

### High Error Rate

**Symptoms**: Sentry showing spike in errors, users reporting issues

**Investigation**:
```bash
# 1. Check recent deployments
git log --oneline -5

# 2. View recent errors in Sentry
# Group by error type, identify pattern

# 3. Check application logs
docker-compose -f docker-compose.prod.yml logs --tail=500 backend | grep ERROR

# 4. Check database connectivity
docker-compose -f docker-compose.prod.yml exec backend python manage.py dbshell
# Run: SELECT 1;
```

**Resolution**:
- If error started after deployment → Rollback
- If database issue → Check connections, restart if needed
- If external service issue → Implement circuit breaker, notify users

---

### Slow Response Times

**Symptoms**: API requests taking >5 seconds, timeouts

**Investigation**:
```bash
# 1. Check Sentry Performance traces
# Identify slow transactions

# 2. Check database query performance
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d saas_production
# Run: SELECT * FROM pg_stat_activity WHERE state = 'active';

# 3. Check CPU/Memory usage
docker stats

# 4. Check cache hit rate
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO stats
```

**Resolution**:
- Optimize slow queries (add indexes)
- Increase cache timeout
- Scale infrastructure (more CPUs, memory)
- Enable connection pooling

---

### Database Connection Issues

**Symptoms**: "Unable to connect to database" errors

**Investigation**:
```bash
# 1. Check if database container is running
docker ps | grep db

# 2. Check database logs
docker-compose -f docker-compose.prod.yml logs db --tail=100

# 3. Test connection
docker-compose -f docker-compose.prod.yml exec backend python manage.py dbshell

# 4. Check connection pool
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

**Resolution**:
```bash
# Restart database (caution!)
docker-compose -f docker-compose.prod.yml restart db

# If connection pool exhausted
# Update DATABASES['default']['CONN_MAX_AGE'] in settings
# Restart backend
```

---

## Database Operations

### Manual Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres saas_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_*.sql

# Upload to S3 (recommended)
aws s3 cp backup_*.sql.gz s3://your-backup-bucket/
```

### Restore from Backup

```bash
# 1. Stop backend services
docker-compose -f docker-compose.prod.yml stop backend celery

# 2. Drop existing database
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -c "DROP DATABASE saas_production;"

# 3. Create fresh database
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -c "CREATE DATABASE saas_production;"

# 4. Restore from backup
gunzip < backup_20251128_120000.sql.gz | docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres saas_production

# 5. Restart services
docker-compose -f docker-compose.prod.yml up -d
```

### Run Migrations

```bash
# Dry run (check what will be applied)
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate --plan

# Apply migrations
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

# Verify
docker-compose -f docker-compose.prod.yml run --rm backend python manage.py showmigrations
```

---

## Scaling Operations

### Horizontal Scaling (More Containers)

```bash
# Scale backend to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale Celery workers to 5
docker-compose -f docker-compose.prod.yml up -d --scale celery=5

# Verify
docker ps
```

### Vertical Scaling (More Resources)

Edit `docker-compose.prod.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'    # Increase from 1.0
          memory: 4G      # Increase from 2G
```

Restart:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Security Incidents

### Suspected Breach

**Immediate Actions**:
1. **Isolate** - Take affected systems offline
2. **Preserve** - Capture logs, database state
3. **Notify** - Alert security team, management
4. **Investigate** - Review access logs, error logs
5. **Remediate** - Patch vulnerability, reset credentials
6. **Document** - Write incident report

**Commands**:
```bash
# 1. Capture logs immediately
docker-compose -f docker-compose.prod.yml logs > incident_logs_$(date +%Y%m%d_%H%M%S).log

# 2. Check active sessions
docker-compose -f docker-compose.prod.yml exec backend python manage.py shell
>>> from django.contrib.sessions.models import Session
>>> Session.objects.filter(expire_date__gte=timezone.now()).count()

# 3. Review access logs
docker-compose -f docker-compose.prod.yml logs nginx | grep -E "(401|403|500)"

# 4. Take offline if needed
docker-compose -f docker-compose.prod.yml down
```

---

### Rotate Secrets

**When to Rotate**:
- Every 90 days (scheduled)
- After suspected breach
- When employee leaves

**Steps**:
```bash
# 1. Generate new Django secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# 2. Generate new field encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# 3. Update .env.production file
# Edit DJANGO_SECRET_KEY and FIELD_ENCRYPTION_KEY

# 4. Restart services
docker-compose -f docker-compose.prod.yml restart

# 5. Update Stripe webhook secret (if rotating)
# Get new secret from Stripe dashboard
# Update STRIPE_WEBHOOK_SECRET in .env.production
```

---

## On-Call Procedures

### Incident Severity Levels

| Level | Response Time | Examples |
|-------|--------------|----------|
| **P0 - Critical** | 15 minutes | Complete outage, data breach |
| **P1 - High** | 1 hour | Partial outage, payment failures |
| **P2 - Medium** | 4 hours | Performance degradation |
| **P3 - Low** | Next business day | Minor bugs |

### On-Call Checklist

**When Alerted**:
1. **Acknowledge** - Acknowledge alert in PagerDuty/Slack
2. **Assess** - Check dashboards, error rates, uptime
3. **Investigate** - Review logs, recent deployments
4. **Escalate** - If needed, page senior engineer
5. **Communicate** - Update team in Slack, status page
6. **Resolve** - Apply fix, verify resolution
7. **Document** - Write post-mortem

---

## Useful Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100

# Follow with grep
docker-compose -f docker-compose.prod.yml logs -f backend | grep ERROR
```

### Check Service Health
```bash
# Health endpoint
curl https://api.yourdomain.com/api/v1/health/

# Container status
docker ps

# Resource usage
docker stats

# Service logs
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
```

### Database Queries
```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec db psql -U postgres saas_production

# Useful queries
SELECT count(*) FROM accounts_user;
SELECT count(*) FROM organizations_organization;
SELECT count(*) FROM subscriptions_subscription WHERE status = 'active';
```

---

## Contact Information

- **On-Call Engineer**: [PagerDuty rotation]
- **Engineering Lead**: [Email/Phone]
- **CTO**: [Email/Phone]
- **Security Team**: security@yourdomain.com

---

## Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [MONITORING.md](./MONITORING.md) - Monitoring setup
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) - DR procedures

---

**Last Updated**: November 28, 2025
**Review Schedule**: Quarterly
**Maintained By**: DevOps Team
