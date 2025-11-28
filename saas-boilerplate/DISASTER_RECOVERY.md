# Disaster Recovery Plan

**Last Updated**: November 28, 2025  
**Version**: 1.0  
**Owner**: DevOps Team

This document outlines procedures for recovering from catastrophic failures and ensuring business continuity.

---

## Table of Contents

1. [Recovery Objectives](#recovery-objectives)
2. [Backup Strategy](#backup-strategy)
3. [Recovery Procedures](#recovery-procedures)
4. [Failover Procedures](#failover-procedures)
5. [Testing Schedule](#testing-schedule)

---

## Recovery Objectives

### Recovery Time Objective (RTO)

**Target**: 4 hours maximum downtime

| Scenario | RTO | Priority |
|----------|-----|----------|
| Database failure | 1 hour | P0 |
| Application crash | 30 minutes | P0 |
| Infrastructure failure | 4 hours | P1 |
| Regional outage | 8 hours | P2 |

### Recovery Point Objective (RPO)

**Target**: Maximum 1 hour of data loss

- **Database**: Continuous replication + hourly snapshots
- **Media Files**: Real-time S3 replication
- **Application State**: Redis persistence enabled

---

## Backup Strategy

### Database Backups

**Automated Daily Backups**:
```bash
# Backup script (runs daily at 2 AM UTC)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec db pg_dump -U postgres saas_production | gzip > backup_${DATE}.sql.gz
aws s3 cp backup_${DATE}.sql.gz s3://saas-backups/database/
```

**Retention Policy**:
- Daily backups: 30 days
- Weekly backups: 90 days
- Monthly backups: 1 year

**Point-in-Time Recovery**: Enabled (up to 7 days)

### Media Files Backup

**S3 Cross-Region Replication**:
```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket saas-media-production \
  --versioning-configuration Status=Enabled

# Enable replication
aws s3api put-bucket-replication \
  --bucket saas-media-production \
  --replication-configuration file://replication-config.json
```

**Lifecycle Policy**:
- Keep versions for 90 days
- Delete old versions after 90 days

---

## Recovery Procedures

### Complete Database Recovery

**Scenario**: Database corruption or complete data loss

**Steps**:
```bash
# 1. Identify latest backup
aws s3 ls s3://saas-backups/database/ | tail -5

# 2. Download backup
aws s3 cp s3://saas-backups/database/backup_YYYYMMDD_HHMMSS.sql.gz .

# 3. Stop application
docker-compose -f docker-compose.prod.yml stop backend celery

# 4. Drop and recreate database
docker-compose exec db psql -U postgres -c "DROP DATABASE saas_production;"
docker-compose exec db psql -U postgres -c "CREATE DATABASE saas_production;"

# 5. Restore from backup
gunzip < backup_*.sql.gz | docker-compose exec -T db psql -U postgres saas_production

# 6. Run migrations (if needed)
docker-compose run --rm backend python manage.py migrate

# 7. Restart services
docker-compose -f docker-compose.prod.yml up -d

# 8. Verify
curl https://api.yourdomain.com/api/v1/health/
```

**Estimated Time**: 30-60 minutes

---

### Application Recovery

**Scenario**: Application containers crashed or corrupted

**Steps**:
```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild containers
docker-compose -f docker-compose.prod.yml build

# 3. Restart services
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify health
curl https://api.yourdomain.com/api/v1/health/

# 5. Check logs for errors
docker-compose -f docker-compose.prod.yml logs -f backend
```

**Estimated Time**: 15-30 minutes

---

### Infrastructure Rebuild

**Scenario**: Complete server failure, need to rebuild from scratch

**Prerequisites**:
- Infrastructure as Code (Terraform/CloudFormation)
- Latest database backup
- Environment variables documented

**Steps**:
1. **Provision New Infrastructure**
   ```bash
   # Using Terraform
   cd infrastructure/
   terraform init
   terraform apply
   ```

2. **Configure Server**
   ```bash
   # SSH into new server
   ssh ubuntu@new-server-ip

   # Install Docker
   curl -fsSL https://get.docker.com | sh

   # Clone repository
   git clone https://github.com/yourorg/saas-boilerplate.git
   cd saas-boilerplate

   # Copy environment files
   # (stored in secure location)
   cp /secure/location/.env.production backend/.env
   cp /secure/location/.env.production frontend/.env.production
   ```

3. **Restore Database**
   ```bash
   # Download latest backup
   aws s3 cp s3://saas-backups/database/backup_latest.sql.gz .

   # Start database
   docker-compose -f docker-compose.prod.yml up -d db

   # Restore
   gunzip < backup_latest.sql.gz | docker-compose exec -T db psql -U postgres saas_production
   ```

4. **Start Application**
   ```bash
   # Build and start all services
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d

   # Verify
   curl http://localhost:8000/api/v1/health/
   ```

5. **Update DNS**
   ```bash
   # Point domain to new server IP
   # (Use DNS provider or Route53)
   ```

**Estimated Time**: 2-4 hours

---

## Failover Procedures

### Multi-Region Failover

**Scenario**: Primary region becomes unavailable

**Architecture**:
- Primary: us-east-1
- Secondary: us-west-2
- Database replication: Cross-region read replica

**Steps**:
1. **Promote Read Replica**
   ```bash
   aws rds promote-read-replica \
     --db-instance-identifier saas-production-replica \
     --region us-west-2
   ```

2. **Update Application Configuration**
   ```bash
   # Update DATABASE_URL to point to new primary
   # Restart application in secondary region
   ```

3. **Update DNS**
   ```bash
   # Update Route53 to point to secondary region
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z1234567890ABC \
     --change-batch file://failover-dns.json
   ```

4. **Verify Failover**
   ```bash
   # Check application health
   curl https://api.yourdomain.com/api/v1/health/
   
   # Verify writes work
   # Test critical user flows
   ```

**Estimated Time**: 30-60 minutes

---

## Testing Schedule

### Backup Verification

**Monthly**:
```bash
# Test database restore
# 1. Download random backup
# 2. Restore to test environment
# 3. Verify data integrity
# 4. Document results
```

**Quarterly**:
```bash
# Full disaster recovery drill
# 1. Simulate complete infrastructure failure
# 2. Follow recovery procedures
# 3. Measure time to recovery
# 4. Update procedures based on findings
```

### Test Checklist

- [ ] Download backup successfully
- [ ] Restore database from backup
- [ ] Application starts without errors
- [ ] User login works
- [ ] Payment processing works
- [ ] All critical features functional
- [ ] Recovery time within RTO
- [ ] Data loss within RPO

---

## Contact Information

### Emergency Contacts

- **On-Call Engineer**: [PagerDuty: +1-XXX-XXX-XXXX]
- **DevOps Lead**: [Email/Phone]
- **CTO**: [Email/Phone]
- **Database Admin**: [Email/Phone]

### Vendor Support

- **AWS Support**: [Premium Support Number]
- **Database Provider**: [Support Contact]
- **CDN Provider**: [Support Contact]

---

## Post-Incident Procedures

### Post-Mortem Template

1. **Incident Summary**
   - What happened?
   - When did it happen?
   - How long was the outage?

2. **Root Cause Analysis**
   - Why did it happen?
   - What was the root cause?
   - What were contributing factors?

3. **Recovery Actions**
   - What steps were taken?
   - How long did each step take?
   - Were procedures effective?

4. **Lessons Learned**
   - What went well?
   - What could be improved?
   - What should we change?

5. **Action Items**
   - [ ] Update documentation
   - [ ] Implement preventive measures
   - [ ] Train team on new procedures
   - [ ] Schedule follow-up review

---

## Resources

- [OPERATIONS.md](./OPERATIONS.md) - Operations runbook
- [MONITORING.md](./MONITORING.md) - Monitoring setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures

---

**Last Updated**: November 28, 2025  
**Next Review**: February 28, 2026  
**Review Frequency**: Quarterly
