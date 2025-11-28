# CI/CD Setup Checklist

Use this checklist to set up the complete CI/CD pipeline for the SaaS Boilerplate project.

**Estimated Time**: 2-3 hours
**Prerequisites**: GitHub admin access, server access (for deployment)

---

## Phase 1: GitHub Repository Configuration

### 1.1 Enable GitHub Actions

- [ ] Go to **Settings** → **Actions** → **General**
- [ ] Set "Actions permissions" to "Allow all actions and reusable workflows"
- [ ] Set "Workflow permissions" to "Read and write permissions"
- [ ] Enable "Allow GitHub Actions to create and approve pull requests"

**URL**: `https://github.com/YOUR_ORG/YOUR_REPO/settings/actions`

---

### 1.2 Enable Security Features

- [ ] Go to **Settings** → **Security & analysis**
- [ ] Enable "Dependency graph"
- [ ] Enable "Dependabot alerts"
- [ ] Enable "Dependabot security updates"
- [ ] Enable "Code scanning" → Set up CodeQL analysis
- [ ] Enable "Secret scanning"
- [ ] Enable "Push protection" (prevents committing secrets)

**URL**: `https://github.com/YOUR_ORG/YOUR_REPO/settings/security_analysis`

**Why**: Automated security monitoring and prevention

---

### 1.3 Configure Branch Protection Rules

- [ ] Go to **Settings** → **Branches**
- [ ] Add rule for `main` branch:
  - [ ] Require pull request before merging
  - [ ] Require approvals: 1
  - [ ] Dismiss stale reviews
  - [ ] Require status checks to pass:
    - [ ] Backend CI - lint
    - [ ] Backend CI - test
    - [ ] Frontend CI - lint
    - [ ] Frontend CI - test
    - [ ] Frontend CI - build
    - [ ] Pre-commit Checks - summary
  - [ ] Require conversation resolution
  - [ ] Do not allow bypassing (even for admins)

- [ ] Add rule for `develop` branch (optional, similar rules)

**URL**: `https://github.com/YOUR_ORG/YOUR_REPO/settings/branches`

**Why**: Enforce code quality and review process

---

## Phase 2: GitHub Environments Setup

### 2.1 Create Staging Environment

- [ ] Go to **Settings** → **Environments**
- [ ] Click "New environment"
- [ ] Name: `staging`
- [ ] Protection rules:
  - [ ] Required reviewers: **None** (auto-deploy)
  - [ ] Wait timer: 0 minutes
  - [ ] Deployment branches: `develop`, `main`
- [ ] Add environment URL: `https://staging.example.com` (update domain)

**URL**: `https://github.com/YOUR_ORG/YOUR_REPO/settings/environments`

---

### 2.2 Create Production Environment

- [ ] Go to **Settings** → **Environments**
- [ ] Click "New environment"
- [ ] Name: `production`
- [ ] Protection rules:
  - [ ] **Required reviewers**: Add team members (at least 1)
  - [ ] **Wait timer**: 5 minutes (recommended, allows cancellation)
  - [ ] **Deployment branches**: `main` ONLY
  - [ ] Prevent self-review: Enabled
- [ ] Add environment URL: `https://example.com` (update domain)

**Why**: Manual approval gate for production deployments

---

## Phase 3: Secrets Configuration

### 3.1 Generate Secrets

Open terminal and generate all required secrets:

```bash
# Django secret key (50+ characters)
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Field encryption key (Fernet)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Strong password (32 characters)
openssl rand -base64 32

# SSH key for deployment
ssh-keygen -t ed25519 -C "deploy@github-actions" -f deploy_key_staging
ssh-keygen -t ed25519 -C "deploy@github-actions" -f deploy_key_production
```

**Important**: Save all generated values securely (use password manager)

---

### 3.2 Add Repository Secrets (Optional)

- [ ] Go to **Settings** → **Secrets and variables** → **Actions**
- [ ] Click "New repository secret"
- [ ] Add (optional):
  - [ ] `CODECOV_TOKEN` - From codecov.io (if using)

**URL**: `https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions`

---

### 3.3 Add Staging Environment Secrets

- [ ] Go to **Settings** → **Environments** → **staging**
- [ ] Click "Add secret" and add all secrets from the table below:

| Secret Name | Value/How to Get |
|-------------|------------------|
| `DATABASE_URL` | `postgresql://user:pass@staging-db.example.com:5432/db` |
| `REDIS_URL` | `redis://staging-redis.example.com:6379/0` |
| `DJANGO_SECRET_KEY` | From generation step above (50+ chars) |
| `FIELD_ENCRYPTION_KEY` | From generation step above |
| `FRONTEND_URL` | `https://staging.example.com` |
| `BACKEND_URL` | `https://api-staging.example.com` |
| `STRIPE_SECRET_KEY` | `sk_test_...` (from Stripe Dashboard - test mode) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (from Stripe Dashboard) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Stripe Webhooks) |
| `EMAIL_HOST` | `smtp.sendgrid.net` or your SMTP server |
| `EMAIL_PORT` | `587` |
| `EMAIL_HOST_USER` | Your SMTP username |
| `EMAIL_HOST_PASSWORD` | Your SMTP password/API key |
| `DEFAULT_FROM_EMAIL` | `noreply@staging.example.com` |
| `DEPLOY_SSH_KEY` | Contents of `deploy_key_staging` (full key) |
| `DEPLOY_HOST` | `staging.example.com` |
| `DEPLOY_USER` | `deploy` |
| `SENTRY_DSN` | From sentry.io (optional) |

**Reference**: See `.github/SECRETS_TEMPLATE.md` for detailed descriptions

---

### 3.4 Add Production Environment Secrets

- [ ] Go to **Settings** → **Environments** → **production**
- [ ] Add **DIFFERENT** secrets from staging (especially credentials!)

| Secret Name | Value/How to Get |
|-------------|------------------|
| `DATABASE_URL` | **Production database** (strong password!) |
| `REDIS_URL` | **Production Redis** |
| `DJANGO_SECRET_KEY` | **NEW key, different from staging** |
| `FIELD_ENCRYPTION_KEY` | **NEW key, CRITICAL - different from staging** |
| `FRONTEND_URL` | `https://example.com` |
| `BACKEND_URL` | `https://api.example.com` |
| `STRIPE_SECRET_KEY` | `sk_live_...` **LIVE MODE** |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (production webhook) |
| `EMAIL_HOST` | Production SMTP server |
| `EMAIL_PORT` | `587` |
| `EMAIL_HOST_USER` | Production SMTP username |
| `EMAIL_HOST_PASSWORD` | Production SMTP password |
| `DEFAULT_FROM_EMAIL` | `noreply@example.com` |
| `DEPLOY_SSH_KEY` | Contents of `deploy_key_production` |
| `DEPLOY_HOST` | `example.com` |
| `DEPLOY_USER` | `deploy` |
| `SENTRY_DSN` | Production Sentry DSN (highly recommended) |

**Critical**: Production secrets MUST be different from staging!

---

## Phase 4: Server Setup (Deployment Targets)

### 4.1 Staging Server Setup

**On your staging server**:

```bash
# Create deploy user
sudo adduser deploy

# Add SSH public key
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys
# Paste contents of deploy_key_staging.pub
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys

# Install Docker (if not already)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy

# Create app directory
sudo -u deploy mkdir -p /home/deploy/app
sudo -u deploy mkdir -p /home/deploy/backups

# Test SSH connection
ssh -i deploy_key_staging deploy@staging.example.com
```

- [ ] Deploy user created
- [ ] SSH key added
- [ ] Docker installed
- [ ] App directories created
- [ ] SSH connection verified

---

### 4.2 Production Server Setup

**On your production server** (same steps, different key):

```bash
# Same as staging, but use deploy_key_production.pub
# Ensure strong security practices!
```

- [ ] Deploy user created
- [ ] SSH key added (production key)
- [ ] Docker installed
- [ ] App directories created
- [ ] Backups directory configured
- [ ] SSH connection verified

---

## Phase 5: Update Deployment Configuration

### 5.1 Customize Deployment Script

- [ ] Edit `scripts/deploy.sh`
- [ ] Update deployment commands for your infrastructure:
  - [ ] If using Docker Compose: Update compose commands
  - [ ] If using Kubernetes: Update kubectl commands
  - [ ] If using other: Add appropriate deployment commands
- [ ] Update health check URLs
- [ ] Test locally with dry-run

---

### 5.2 Update GitHub Actions Deploy Workflow

- [ ] Edit `.github/workflows/deploy.yml`
- [ ] Replace TODO comments with actual commands
- [ ] Update URLs in smoke tests
- [ ] Configure backup strategy (production)

---

## Phase 6: Testing

### 6.1 Test Pre-commit Checks

```bash
# Create test branch
git checkout -b test/ci-pipeline

# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "test: CI pipeline"
git push -u origin test/ci-pipeline

# Create PR
gh pr create --title "Test: CI Pipeline" --body "Testing CI/CD setup"
```

- [ ] PR created successfully
- [ ] Pre-commit checks run (< 5 minutes)
- [ ] Backend CI triggered
- [ ] Frontend CI triggered
- [ ] All checks passed

**Verify**: Check Actions tab for workflow runs

---

### 6.2 Test Security Scanning

- [ ] Check **Security** tab → **Code scanning**
- [ ] Verify Bandit results appear
- [ ] Verify Trivy scan results appear
- [ ] Review any findings

**URL**: `https://github.com/YOUR_ORG/YOUR_REPO/security/code-scanning`

---

### 6.3 Test Container Build

- [ ] Merge test PR
- [ ] Check that container-build workflow runs
- [ ] Verify images pushed to GHCR
- [ ] Check SBOM artifacts generated
- [ ] Verify Cosign signing (on push to main/develop)

**URL**: `https://github.com/YOUR_ORG/YOUR_REPO/packages`

---

### 6.4 Test Staging Deployment

```bash
# Merge to develop branch
git checkout develop
git merge test/ci-pipeline
git push origin develop
```

- [ ] Staging deployment triggered automatically
- [ ] Pre-deployment tests passed
- [ ] Images built and pushed
- [ ] Staging deployment completed
- [ ] Health checks passed
- [ ] Staging site accessible

**Verify**: Check deployment status in Environments tab

---

### 6.5 Test Production Approval Workflow

```bash
# Merge to main branch (after staging verification)
git checkout main
git merge develop
git push origin main
```

- [ ] Production deployment triggered
- [ ] **Manual approval required** (verify this!)
- [ ] Review deployment details
- [ ] Approve deployment
- [ ] Production deployment completed
- [ ] Comprehensive smoke tests passed
- [ ] Production site accessible

---

## Phase 7: Monitoring Setup

### 7.1 Enable Notifications (Optional)

- [ ] Set up Slack webhook (if using)
- [ ] Add `SLACK_WEBHOOK_URL` to repository secrets
- [ ] Test notification

---

### 7.2 Monitor First Deployments

```bash
# Test health checks locally
./scripts/health-check.sh staging
./scripts/health-check.sh production

# Monitor application logs
ssh deploy@staging.example.com 'docker logs -f backend'
```

- [ ] Staging health check passed
- [ ] Production health check passed
- [ ] Application logs reviewed
- [ ] No errors detected

---

## Phase 8: Documentation and Training

### 8.1 Team Documentation

- [ ] Share CI_CD.md with team
- [ ] Share SECRETS_TEMPLATE.md with authorized personnel
- [ ] Document deployment process
- [ ] Create runbook for common issues

---

### 8.2 Team Training

- [ ] Train team on CI/CD workflow
- [ ] Demonstrate how to:
  - [ ] Create PRs that trigger CI
  - [ ] Review CI results
  - [ ] Approve production deployments
  - [ ] Rollback if needed
  - [ ] Access logs and artifacts

---

## Phase 9: Continuous Improvement

### 9.1 Establish Monitoring

- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (Sentry)
- [ ] Set up performance monitoring (APM)
- [ ] Create alerting rules

---

### 9.2 Schedule Regular Maintenance

Add to calendar:

- [ ] **Weekly**: Review CI/CD metrics and failures
- [ ] **Weekly**: Update dependencies (Dependabot PRs)
- [ ] **Monthly**: Review security scan results
- [ ] **Monthly**: Optimize slow workflows
- [ ] **Quarterly**: Rotate secrets
- [ ] **Quarterly**: Audit access permissions
- [ ] **Quarterly**: Review and update documentation

---

## Quick Reference

### Essential URLs

| Resource | URL |
|----------|-----|
| Actions Dashboard | `https://github.com/YOUR_ORG/YOUR_REPO/actions` |
| Environments | `https://github.com/YOUR_ORG/YOUR_REPO/deployments` |
| Security Tab | `https://github.com/YOUR_ORG/YOUR_REPO/security` |
| Secrets Settings | `https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions` |
| Container Registry | `https://github.com/YOUR_ORG/YOUR_REPO/packages` |

### Essential Commands

```bash
# Test health checks
./scripts/health-check.sh staging
./scripts/health-check.sh production

# Manual deployment (if needed)
./scripts/deploy.sh staging backend-image:tag frontend-image:tag

# Rollback
./scripts/rollback.sh staging
./scripts/rollback.sh production

# View logs
ssh deploy@staging.example.com 'docker logs -f backend'

# Run tests locally
cd backend && pytest
cd frontend && npm test
```

---

## Troubleshooting

### Issue: Workflows not running

**Solution**:
1. Check Actions permissions in repository settings
2. Verify workflow triggers in YAML files
3. Check branch protection rules

### Issue: Secrets not found

**Solution**:
1. Verify secrets added to correct environment
2. Check secret names match exactly (case-sensitive)
3. Ensure job specifies `environment: staging` or `production`

### Issue: Deployment fails

**Solution**:
1. Check deployment logs in Actions tab
2. Verify server is accessible via SSH
3. Check health endpoint manually
4. Review server logs: `ssh deploy@server 'docker logs backend'`

**Full Troubleshooting Guide**: See `CI_CD.md` → Troubleshooting section

---

## Success Criteria

CI/CD setup is complete when:

- ✅ All workflows run successfully on PR
- ✅ Security scans report to Security tab
- ✅ Container images build and push to GHCR
- ✅ Staging deploys automatically from develop
- ✅ Production requires manual approval
- ✅ Health checks pass after deployment
- ✅ Team can deploy confidently
- ✅ Rollback process works

---

## Next Steps After Setup

1. **Deploy your first feature**
   - Create feature branch
   - Make changes
   - Open PR
   - Merge to develop (auto-deploys to staging)
   - Test on staging
   - Merge to main (deploy to production with approval)

2. **Monitor and iterate**
   - Review workflow performance
   - Optimize slow steps
   - Add more tests as needed
   - Refine deployment process

3. **Scale up**
   - Add more environments (e.g., qa, demo)
   - Implement blue-green deployments
   - Add canary deployments
   - Enhance monitoring

---

**Completion Time**: ______ (fill in when done)
**Completed By**: ______ (name)
**Date**: ______ (date)

**Notes**:
(Add any setup-specific notes or deviations from this checklist)

---

🎉 **Congratulations!** Your CI/CD pipeline is now production-ready!

For questions or issues, refer to:
- `CI_CD.md` - Comprehensive guide
- `.github/SECRETS_TEMPLATE.md` - Secrets reference
- `CI_CD_IMPLEMENTATION_SUMMARY.md` - Implementation details
