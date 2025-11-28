# CI/CD Quick Start Guide

Get your CI/CD pipeline up and running in 30 minutes!

**Perfect for**: Getting a basic CI/CD pipeline working quickly
**For comprehensive setup**: See `SETUP_CHECKLIST.md`

---

## Prerequisites

- GitHub repository admin access
- GitHub CLI installed (`brew install gh` or see [cli.github.com](https://cli.github.com))
- 30 minutes of time

---

## 5-Step Quick Setup

### Step 1: Enable GitHub Features (5 minutes)

Run the setup helper script:

```bash
cd saas-boilerplate
./scripts/setup-github-environments.sh
```

This will guide you through:
- ✅ Enabling GitHub Actions
- ✅ Creating staging and production environments
- ✅ Enabling security features

**Alternative**: Manually follow instructions printed by the script

---

### Step 2: Generate and Add Secrets (10 minutes)

**Generate secrets**:

```bash
# Django secret key
python -c "from django.core.management.utils import get_random_secret_key; print('DJANGO_SECRET_KEY:', get_random_secret_key())"

# Encryption key
python -c "from cryptography.fernet import Fernet; print('FIELD_ENCRYPTION_KEY:', Fernet.generate_key().decode())"
```

**Add to GitHub**:

1. Go to: Settings → Environments → **staging** → Add Secret
2. Add minimum required secrets:
   - `DATABASE_URL`: `postgresql://user:pass@host:5432/db`
   - `REDIS_URL`: `redis://host:6379/0`
   - `DJANGO_SECRET_KEY`: (from above)
   - `FIELD_ENCRYPTION_KEY`: (from above)

3. Repeat for **production** environment (use different values!)

**Full secrets list**: See `.github/SECRETS_TEMPLATE.md`

---

### Step 3: Test CI Workflows (5 minutes)

Create a test pull request:

```bash
# Create test branch
git checkout -b test/ci-setup

# Make a small change
echo "# CI/CD Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: CI/CD pipeline setup"
git push -u origin test/ci-setup

# Create PR
gh pr create --title "Test: CI/CD Setup" --body "Testing CI/CD workflows"
```

**Verify**:
- Go to Actions tab: `https://github.com/YOUR_ORG/YOUR_REPO/actions`
- Check that workflows are running:
  - ✅ Pre-commit Checks (< 5 min)
  - ✅ Backend CI
  - ✅ Frontend CI
  - ✅ Container Build

**If workflows don't run**: Check Actions permissions in Settings → Actions

---

### Step 4: Configure Deployment (5 minutes)

**Option A: Skip Deployment (Test CI Only)**

Comment out deployment steps in `.github/workflows/deploy.yml`:

```yaml
# Temporarily disable actual deployment
- name: Deploy backend
  run: |
    echo "🚀 Deployment would happen here"
    echo "See scripts/deploy.sh for deployment template"
```

**Option B: Configure Basic Deployment**

1. Set up deployment server (see `SETUP_CHECKLIST.md` Phase 4)
2. Add deployment secrets:
   - `DEPLOY_SSH_KEY`
   - `DEPLOY_HOST`
   - `DEPLOY_USER`
3. Customize `scripts/deploy.sh` for your infrastructure

---

### Step 5: Test Full Pipeline (5 minutes)

**Test staging deployment**:

```bash
# Merge test PR to develop
git checkout develop
git merge test/ci-setup
git push origin develop
```

Watch the deployment:
- Go to: `https://github.com/YOUR_ORG/YOUR_REPO/deployments`
- Verify staging deployment triggered
- Check status (will skip actual deploy if not configured)

**Test production approval**:

```bash
# Merge to main
git checkout main
git merge develop
git push origin main
```

Verify:
- Production deployment waits for manual approval
- Approve and watch deployment complete

---

## What You Get

### ✅ Automated CI

- **Pre-commit checks** - Fast lint/security scan (< 5 min)
- **Backend CI** - Lint, type check, security scan, tests
- **Frontend CI** - Lint, type check, security scan, tests, E2E tests
- **Container builds** - Docker images with security scanning
- **Test matrix** - Multi-version testing (nightly)

### ✅ Security

- **Secret scanning** - Prevents committing secrets
- **Dependency scanning** - Bandit, pip-audit, npm audit
- **Container scanning** - Trivy vulnerability scanning
- **SBOM generation** - Software bill of materials
- **Image signing** - Cosign cryptographic signing

### ✅ Deployment

- **Staging** - Auto-deploy from develop branch
- **Production** - Manual approval required
- **Health checks** - Automated smoke tests
- **Rollback** - Quick rollback script

---

## Quick Commands

### Run checks locally (before pushing)

```bash
# Backend
cd backend
ruff check .                    # Lint
pytest                          # Tests
bandit -r apps config           # Security

# Frontend
cd frontend
npm run lint                    # Lint
npm test                        # Tests
npm audit                       # Security
```

### View CI results

```bash
# Open Actions tab in browser
gh run list
gh run view <run-id>
gh run watch
```

### Check deployment status

```bash
# Test health checks
./scripts/health-check.sh staging
./scripts/health-check.sh production

# View logs
ssh deploy@server 'docker logs -f backend'
```

### Emergency rollback

```bash
./scripts/rollback.sh staging
./scripts/rollback.sh production
```

---

## Common Issues

### ❌ Workflows not running

**Fix**:
1. Settings → Actions → General
2. Allow all actions
3. Read and write permissions

### ❌ Secrets not found

**Fix**:
1. Verify secret added to correct environment (staging/production)
2. Check secret name matches exactly (case-sensitive)
3. Ensure workflow specifies `environment: staging`

### ❌ E2E tests fail

**Fix**:
1. Check backend started successfully in CI
2. Review E2E test logs in Actions
3. Download artifacts for screenshots/videos

### ❌ Deployment fails

**Fix**:
1. Verify server SSH access works
2. Check deployment logs
3. Verify all environment secrets added
4. Test deploy script locally

**Full troubleshooting**: See `CI_CD.md`

---

## What's Next?

### Immediate

- [ ] Review `CI_CD.md` for comprehensive documentation
- [ ] Complete `SETUP_CHECKLIST.md` for full setup
- [ ] Configure deployment for your infrastructure
- [ ] Set up monitoring (Sentry, uptime checks)

### Ongoing

- [ ] Review security scan results weekly
- [ ] Update dependencies regularly (Dependabot)
- [ ] Optimize slow CI workflows
- [ ] Add more tests as needed

---

## Documentation

| Document | Purpose |
|----------|---------|
| **QUICKSTART_CI_CD.md** | This file - Quick 30-minute setup |
| **SETUP_CHECKLIST.md** | Complete setup checklist (2-3 hours) |
| **CI_CD.md** | Comprehensive guide with troubleshooting |
| **CI_CD_IMPLEMENTATION_SUMMARY.md** | Technical implementation details |
| **.github/SECRETS_TEMPLATE.md** | All required secrets reference |

---

## Help & Support

### Self-Service

1. **Check documentation** - Start with `CI_CD.md`
2. **Review logs** - GitHub Actions tab shows detailed logs
3. **Download artifacts** - Screenshots, videos, reports
4. **Test locally** - Run same commands as CI

### Getting Help

1. **GitHub Issues** - Search existing issues
2. **Team Chat** - Share workflow run URL
3. **Create Issue** - For persistent problems

---

## Success Checklist

Your quick setup is complete when:

- ✅ Test PR triggers all CI workflows
- ✅ All workflows pass (green checkmarks)
- ✅ Security scans appear in Security tab
- ✅ Container images build successfully
- ✅ Can view workflow results and artifacts
- ✅ Deployment workflow exists (even if skipped)
- ✅ Production requires manual approval

---

## Metrics

Track your CI/CD success:

| Metric | Target |
|--------|--------|
| PR feedback time | < 5 minutes (pre-commit) |
| Full CI time | < 20 minutes |
| Deployment time | < 10 minutes |
| Test success rate | > 95% |
| Security findings | Review weekly |

---

## Advanced Topics

Once your basic pipeline works, explore:

- **Performance optimization** - Cache improvements, parallel jobs
- **Advanced deployments** - Blue-green, canary releases
- **Enhanced monitoring** - APM, log aggregation
- **Additional environments** - QA, demo, staging2
- **Integration tests** - More comprehensive testing
- **Load testing** - Include in CI pipeline

See `CI_CD.md` for advanced configurations.

---

## Need More Time?

**30 minutes not enough?** Use the comprehensive checklist:

```bash
cat SETUP_CHECKLIST.md
```

This provides detailed step-by-step instructions for complete setup.

---

**Questions?** Review `CI_CD.md` or create a GitHub Issue.

🚀 **Happy Shipping!**
