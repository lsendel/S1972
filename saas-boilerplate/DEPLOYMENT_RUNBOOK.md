# Deployment Runbook

This runbook provides step-by-step procedures for common deployment scenarios and incident response.

**Audience**: DevOps, SREs, Senior Developers
**Last Updated**: 2025-01-XX

---

## Table of Contents

- [Standard Deployment](#standard-deployment)
- [Hotfix Deployment](#hotfix-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Database Migrations](#database-migrations)
- [Incident Response](#incident-response)
- [Post-Deployment Verification](#post-deployment-verification)

---

## Standard Deployment

### Staging Deployment

**Trigger**: Merge to `develop` branch
**Approval**: Not required (automatic)
**Duration**: ~10 minutes

#### Procedure

1. **Pre-Deployment**
   ```bash
   # Verify develop branch is up to date
   git checkout develop
   git pull origin develop

   # Check CI status
   gh run list --branch develop --limit 5
   ```

2. **Merge Feature**
   ```bash
   # From feature branch
   git checkout develop
   git merge feature/my-feature
   git push origin develop
   ```

3. **Monitor Deployment**
   - Watch Actions tab: `https://github.com/ORG/REPO/actions`
   - Pre-deployment tests run first (~5 min)
   - Container build and push (~5 min)
   - Staging deployment (~3 min)

4. **Verify Deployment**
   ```bash
   # Run health checks
   ./scripts/health-check.sh staging

   # Manual verification
   open https://staging.example.com
   ```

5. **Post-Deployment**
   - Test new features on staging
   - Run smoke tests
   - Check application logs
   - Monitor error rates in Sentry

#### Success Criteria

- ✅ All CI tests passed
- ✅ Container images built and pushed
- ✅ Health checks pass
- ✅ No errors in application logs
- ✅ Features work as expected

---

### Production Deployment

**Trigger**: Merge to `main` branch
**Approval**: **Required** (manual)
**Duration**: ~15 minutes

#### Pre-Deployment Checklist

- [ ] Features tested on staging
- [ ] No critical bugs in staging
- [ ] Database migrations reviewed and tested
- [ ] Rollback plan prepared
- [ ] Team notified of deployment
- [ ] Customer-facing changes communicated
- [ ] Off-peak hours (if possible)

#### Procedure

1. **Prepare for Deployment**
   ```bash
   # Ensure main is synced with develop
   git checkout main
   git pull origin main
   git merge develop

   # Review changes
   git log main..develop --oneline

   # Check for migration changes
   git diff main..develop --name-only | grep migrations
   ```

2. **Create Deployment PR** (Optional but recommended)
   ```bash
   # Create release branch
   git checkout -b release/v1.2.3

   # Update version numbers if needed
   # Commit and push
   git push -u origin release/v1.2.3

   # Create PR to main
   gh pr create --base main --title "Release v1.2.3"
   ```

3. **Merge to Main**
   ```bash
   # After PR approval
   git checkout main
   git merge release/v1.2.3
   git push origin main

   # Tag release
   git tag -a v1.2.3 -m "Release v1.2.3"
   git push origin v1.2.3
   ```

4. **Monitor and Approve**
   - Go to Actions tab
   - Wait for pre-deployment tests (~5 min)
   - Container build completes (~5 min)
   - **Review deployment request**
   - Go to Environments → production
   - **Click "Review deployments"**
   - **Click "Approve and deploy"**

5. **Monitor Deployment**
   ```bash
   # Watch deployment logs in real-time
   gh run watch

   # Or view in browser
   open https://github.com/ORG/REPO/actions
   ```

6. **Verify Deployment**
   ```bash
   # Comprehensive health checks
   ./scripts/health-check.sh production

   # Manual verification
   open https://example.com
   ```

7. **Post-Deployment** (Critical - first 30 minutes)
   - Monitor error rates (Sentry)
   - Check application logs
   - Monitor server metrics (CPU, memory, disk)
   - Watch for user reports
   - Test critical user flows

#### Success Criteria

- ✅ All pre-deployment tests passed
- ✅ Deployment approved by authorized personnel
- ✅ Database migrations applied successfully
- ✅ Health checks pass
- ✅ No spike in error rates
- ✅ Core features functional
- ✅ Rollback plan ready if needed

---

## Hotfix Deployment

**Urgency**: High (production issue)
**Timeline**: 30-60 minutes

### When to Use

- Critical bugs in production
- Security vulnerabilities
- Service outages
- Data integrity issues

### Procedure

1. **Assess Severity**
   - Is production down? → **Emergency rollback first**
   - Is data at risk? → **Prioritize fix**
   - Can it wait until next release? → **Standard deployment**

2. **Create Hotfix Branch**
   ```bash
   # From main branch (production)
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-issue
   ```

3. **Develop Fix**
   ```bash
   # Make minimal changes to fix issue
   # Test locally
   git add .
   git commit -m "hotfix: Fix critical issue #123"
   git push -u origin hotfix/critical-issue
   ```

4. **Fast-Track Review**
   ```bash
   # Create PR to main
   gh pr create --base main --title "HOTFIX: Critical issue" --label hotfix

   # Request immediate review
   # Notify team in Slack/Discord
   ```

5. **Deploy Immediately**
   ```bash
   # After approval
   git checkout main
   git merge hotfix/critical-issue
   git push origin main

   # Monitor deployment closely
   gh run watch
   ```

6. **Backport to Develop**
   ```bash
   # After production deployment succeeds
   git checkout develop
   git merge hotfix/critical-issue
   git push origin develop
   ```

7. **Verify and Monitor**
   - Verify fix resolves issue
   - Monitor error rates for 1 hour
   - Document incident in postmortem

---

## Rollback Procedures

### When to Rollback

- Health checks failing
- Spike in error rates (>5x normal)
- Critical feature broken
- Database corruption detected
- Security issue introduced

### Quick Rollback (< 5 minutes)

```bash
# Emergency rollback to previous version
./scripts/rollback.sh production

# Confirm rollback
# Type: ROLLBACK

# Verify rollback succeeded
./scripts/health-check.sh production
```

### Manual Rollback

```bash
# SSH to production server
ssh deploy@example.com

# List recent deployments
tail -20 ~/app/deployment.log

# Identify previous working version
# Restore containers to previous version
docker stop backend frontend
docker start backend-previous frontend-previous

# Verify health
curl https://example.com/api/v1/health/
```

### Database Migration Rollback

```bash
# Connect to production server
ssh deploy@example.com

# List applied migrations
docker exec backend python manage.py showmigrations

# Rollback specific migration
docker exec backend python manage.py migrate app_name migration_name

# Verify application works
curl https://example.com/api/v1/health/
```

### Post-Rollback

- [ ] Verify application is healthy
- [ ] Notify team of rollback
- [ ] Update status page
- [ ] Investigate root cause
- [ ] Schedule fix deployment

---

## Database Migrations

### Pre-Migration Checklist

- [ ] Migrations tested on staging
- [ ] Backup created (production only)
- [ ] Migration is backward compatible if possible
- [ ] Rollback procedure documented
- [ ] Large migrations scheduled during maintenance window

### Production Migration Process

1. **Create Backup**
   ```bash
   # Automatic backup before migration
   # Or manual backup:
   ssh deploy@example.com
   docker exec db pg_dump -U $USER $DB > backup-$(date +%Y%m%d-%H%M%S).sql
   gzip backup-*.sql
   ```

2. **Apply Migration**
   ```bash
   # During deployment
   # Migrations run automatically in deploy workflow

   # Or manual:
   ssh deploy@example.com
   docker exec backend python manage.py migrate
   ```

3. **Verify Migration**
   ```bash
   # Check migration status
   docker exec backend python manage.py showmigrations

   # Test application
   ./scripts/health-check.sh production
   ```

### Dangerous Migrations

**Operations requiring extra care**:
- Adding NOT NULL columns to large tables
- Dropping columns with data
- Changing column types
- Adding indexes to large tables
- Renaming tables

**Best Practices**:
1. Split into multiple releases
2. Use background jobs for data migrations
3. Add columns as nullable first
4. Schedule during maintenance window
5. Monitor database performance

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P0 | Critical - Service Down | < 15 min | Total outage, data loss |
| P1 | High - Major Impact | < 1 hour | Core feature broken, security issue |
| P2 | Medium - Degraded | < 4 hours | Non-critical feature broken |
| P3 | Low - Minor | < 24 hours | UI glitch, minor bug |

### P0 - Critical Incident

1. **Immediate Response** (0-5 minutes)
   ```bash
   # Check overall health
   ./scripts/health-check.sh production

   # Check error rates
   # Go to Sentry dashboard

   # Check infrastructure
   # Go to hosting provider dashboard
   ```

2. **Triage** (5-15 minutes)
   - Identify root cause
   - Assess impact
   - Determine if rollback needed

3. **Mitigate** (15-30 minutes)
   ```bash
   # Option A: Rollback
   ./scripts/rollback.sh production

   # Option B: Quick fix
   # Deploy hotfix following procedure above

   # Option C: Manual intervention
   ssh deploy@example.com
   # Restart services, clear cache, etc.
   ```

4. **Communicate**
   - Update status page
   - Notify customers if necessary
   - Update team in incident channel

5. **Post-Incident** (After resolution)
   - Write postmortem within 48 hours
   - Identify preventive measures
   - Update runbooks

### Communication Template

**Initial Report**:
```
🚨 INCIDENT: [Brief description]
Status: Investigating
Impact: [User impact]
Started: [Time]
Team: Working on resolution
Updates: Every 15 minutes
```

**Update**:
```
🔍 UPDATE: [Progress update]
Status: [Investigating/Mitigating/Resolved]
Next steps: [What we're doing]
ETA: [If known]
```

**Resolution**:
```
✅ RESOLVED: [Brief description]
Duration: [Start - End time]
Cause: [Root cause]
Resolution: [How it was fixed]
Follow-up: Postmortem in 48h
```

---

## Post-Deployment Verification

### Automated Checks

```bash
# Run comprehensive health check
./scripts/health-check.sh production

# Expected output:
# ✓ Health endpoint
# ✓ Readiness endpoint
# ✓ Homepage
# ✓ SSL certificate
# ✓ All health checks passed
```

### Manual Verification Checklist

- [ ] Homepage loads
- [ ] User can login
- [ ] User can signup (if applicable)
- [ ] Core features work
- [ ] Payment flow works (if changed)
- [ ] Email sending works
- [ ] Admin panel accessible

### Monitoring Checklist (First 30 minutes)

- [ ] Error rate normal (< 0.5%)
- [ ] Response time normal (< 500ms p95)
- [ ] CPU usage normal (< 70%)
- [ ] Memory usage normal (< 80%)
- [ ] No new Sentry errors
- [ ] Database connections stable
- [ ] Redis connections stable

### Tools

```bash
# Application logs
ssh deploy@example.com 'docker logs -f --tail=100 backend'

# Sentry dashboard
open https://sentry.io/organizations/your-org/issues/

# Server metrics
# Check your hosting provider's dashboard
# AWS CloudWatch, DigitalOcean Monitoring, etc.
```

---

## Emergency Contacts

| Role | Name | Contact | Backup |
|------|------|---------|--------|
| On-Call Engineer | TBD | TBD | TBD |
| DevOps Lead | TBD | TBD | TBD |
| CTO/Tech Lead | TBD | TBD | TBD |
| Hosting Provider | TBD | TBD | - |

---

## Useful Commands

```bash
# Check deployment status
gh run list --workflow=deploy.yml --limit 5

# View specific deployment
gh run view <run-id>

# Check container images
gh api /user/packages/container/backend/versions | jq '.[] | {id: .id, tags: .metadata.container.tags}'

# SSH to server
ssh deploy@example.com

# View logs
ssh deploy@example.com 'docker logs -f backend'
ssh deploy@example.com 'docker logs -f frontend'

# Check disk space
ssh deploy@example.com 'df -h'

# Check memory
ssh deploy@example.com 'free -h'

# Check running containers
ssh deploy@example.com 'docker ps'

# Database connection
ssh deploy@example.com 'docker exec -it db psql -U $USER $DB'
```

---

## Maintenance Windows

**Recommended Schedule**:
- Minor deployments: Anytime (with approval)
- Major deployments: Tuesday-Thursday, 2-4 AM EST
- Database migrations: Tuesday-Thursday, 2-4 AM EST
- Avoid: Fridays, Mondays, holidays

**Notification Requirements**:
- Minor: 24 hours notice
- Major: 1 week notice
- Breaking changes: 2 weeks notice

---

## Related Documentation

- [CI/CD Guide](CI_CD.md) - Complete CI/CD documentation
- [Setup Checklist](SETUP_CHECKLIST.md) - Initial setup guide
- [Quick Start](QUICKSTART_CI_CD.md) - Quick setup guide
- [Secrets Template](.github/SECRETS_TEMPLATE.md) - Required secrets

---

**Version**: 1.0
**Last Review**: [Date]
**Next Review**: [Date + 3 months]
