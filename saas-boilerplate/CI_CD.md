# CI/CD Pipeline Documentation

This document provides a comprehensive guide to the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the SaaS Boilerplate project.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Setup Instructions](#setup-instructions)
- [Required Secrets](#required-secrets)
- [Local Development Parity](#local-development-parity)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

The CI/CD pipeline is built on GitHub Actions and consists of 8 main workflows:

1. **Backend CI** - Lint, type check, security scan, and test backend code
2. **Frontend CI** - Lint, type check, security scan, test, build, and E2E tests
3. **Migration Check** - Fast feedback on database migration issues
4. **Pre-commit Checks** - Quick lint and security checks for fast feedback
5. **Container Build & Scan** - Build, scan, and sign Docker images
6. **Test Matrix** - Test across multiple Python, Node, and database versions
7. **Deploy** - Automated deployment to staging and production
8. **CodeQL** - Security analysis (if configured)

### Pipeline Architecture

```
┌─────────────────┐
│  Pull Request   │
└────────┬────────┘
         │
         ├──► Pre-commit Checks (< 5 min)
         ├──► Migration Check (< 5 min)
         ├──► Backend CI (10-20 min)
         ├──► Frontend CI (15-35 min)
         └──► Container Build & Scan (PR only, no push)
                    │
         ┌──────────┴──────────┐
         │   Merge to develop  │
         └──────────┬──────────┘
                    │
                    ├──► All CI workflows
                    ├──► Container Build & Push to GHCR
                    └──► Auto-deploy to Staging
                              │
         ┌────────────────────┴─────────────────────┐
         │            Merge to main                 │
         └────────────────────┬─────────────────────┘
                              │
                              ├──► All CI workflows
                              ├──► Container Build & Push to GHCR
                              └──► Deploy to Production (manual approval)
```

---

## Workflows

### 1. Backend CI (`backend-ci.yml`)

**Triggers**: Pull requests and pushes affecting `backend/**` or the workflow file

**Jobs**:

- **lint** (10 min timeout)
  - Runs Ruff linter and formatter
  - Runs mypy type checker
  - Permissions: `contents: read`

- **security** (15 min timeout)
  - Runs Bandit security scanner (outputs to Security tab via SARIF)
  - Runs pip-audit for dependency vulnerabilities
  - Uploads security reports as artifacts
  - Permissions: `contents: read`, `security-events: write`

- **test** (20 min timeout)
  - Runs pytest with coverage
  - Uses PostgreSQL 17 and Redis 8 services
  - Uploads coverage to Codecov
  - Permissions: `contents: read`, `pull-requests: write`

- **check-migrations** (5 min timeout)
  - Checks for missing Django migrations
  - Permissions: `contents: read`

**Key Features**:
- Uses pip caching for faster builds
- Parallel job execution
- Continue-on-error for security scans (don't fail build)
- Health checks for database services

### 2. Frontend CI (`frontend-ci.yml`)

**Triggers**: Pull requests and pushes affecting `frontend/**` or the workflow file

**Jobs**:

- **lint** (10 min timeout)
  - Runs ESLint
  - Runs TypeScript compiler check
  - Permissions: `contents: read`

- **security** (10 min timeout)
  - Runs npm audit with multiple severity levels
  - Uploads audit reports as artifacts
  - Permissions: `contents: read`

- **test** (15 min timeout)
  - Runs Vitest unit tests with coverage
  - Uploads coverage to Codecov
  - Permissions: `contents: read`, `pull-requests: write`

- **build** (15 min timeout)
  - Builds production bundle
  - Checks build size
  - Permissions: `contents: read`

- **e2e** (35 min timeout)
  - Starts backend services (PostgreSQL, Redis, Django)
  - Runs Playwright E2E tests
  - On PRs: Runs quick smoke tests (`@quick` tagged tests)
  - On pushes: Runs full test suite
  - Captures traces, videos, and screenshots on failure
  - Permissions: `contents: read`

**Key Features**:
- Uses npm caching for faster builds
- Playwright browser caching
- Automatic backend service startup for E2E tests
- Smart test selection (quick vs full)
- Comprehensive artifact uploads for debugging

### 3. Migration Check (`migration-check.yml`)

**Triggers**: Pull requests affecting models, migrations, or settings

**Jobs**:

- **check-migrations** (5 min timeout)
  - Checks for missing migrations with `makemigrations --check`
  - Generates migration preview on failure
  - Comments on PR with migration issues
  - Checks for conflicting migration numbers
  - Permissions: `contents: read`, `pull-requests: write`

**Key Features**:
- Fast feedback (< 5 minutes)
- Automatic PR comments with actionable information
- Prevents merge of PRs with missing migrations

### 4. Pre-commit Checks (`pre-commit.yml`)

**Triggers**: Pull requests affecting Python or TypeScript files

**Jobs**:

- **backend-quick-checks** (5 min timeout)
  - Runs Ruff linter and formatter (fast)
  - Quick type check with mypy
  - Permissions: `contents: read`

- **frontend-quick-checks** (5 min timeout)
  - Runs ESLint
  - TypeScript type check
  - Permissions: `contents: read`

- **security-quick-scan** (5 min timeout)
  - TruffleHog secret scanning
  - Pattern matching for common security issues
  - Permissions: `contents: read`

- **summary** (1 min timeout)
  - Aggregates results from all checks
  - Permissions: `contents: read`

**Key Features**:
- Extremely fast feedback (< 5 minutes total)
- Runs in parallel with full CI
- Catches common issues early
- Minimal dependencies installed

### 5. Container Build & Scan (`container-build.yml`)

**Triggers**: Pushes and pull requests affecting backend/frontend or the workflow file

**Jobs**:

- **build-backend** (20 min timeout)
  - Builds backend Docker image
  - Generates SBOM with Syft (SPDX + CycloneDX)
  - Scans with Trivy (uploads to Security tab)
  - Signs with Cosign (keyless, on push only)
  - Pushes to GHCR (on push only)
  - Permissions: `contents: read`, `packages: write`, `security-events: write`, `id-token: write`

- **build-frontend** (15 min timeout)
  - Same process as backend for frontend image
  - Permissions: Same as backend

- **security-summary** (5 min timeout)
  - Downloads all SBOMs
  - Generates security summary in GitHub UI
  - Permissions: `contents: read`

**Key Features**:
- Multi-stage Docker builds (already in Dockerfiles)
- BuildKit caching for faster builds
- SBOM generation for supply chain security
- Vulnerability scanning with SARIF output
- Keyless image signing with Sigstore Cosign
- Smart tagging (branch, SHA, latest)
- 90-day SBOM retention

### 6. Test Matrix (`test-matrix.yml`)

**Triggers**:
- Nightly schedule (2 AM UTC)
- Push to main branch
- Pull requests to main
- Manual workflow dispatch

**Jobs**:

- **backend-matrix** (25 min timeout)
  - Tests Python 3.11, 3.12, 3.13
  - Tests Django 5.1, 5.2
  - Matrix includes experimental flag for cutting-edge versions
  - Permissions: `contents: read`

- **frontend-matrix** (20 min timeout)
  - Tests Node.js 20, 22, 23
  - Tests on Ubuntu, Windows, macOS
  - Only LTS versions tested on Windows/macOS to save time
  - Permissions: `contents: read`

- **database-matrix** (20 min timeout)
  - Tests PostgreSQL 15, 16, 17
  - Permissions: `contents: read`

- **summary** (5 min timeout)
  - Generates test matrix results summary
  - Fails if any non-experimental configuration fails
  - Permissions: `contents: read`

**Key Features**:
- Comprehensive compatibility testing
- Runs nightly to catch regressions early
- `fail-fast: false` to see all failures
- Experimental version flagging
- Display version information for debugging

### 7. Deploy (`deploy.yml`)

**Triggers**:
- Push to main branch (→ production)
- Push to develop branch (→ staging)
- Manual workflow dispatch

**Jobs**:

- **setup** (5 min timeout)
  - Determines target environment from branch or manual input
  - Outputs: environment, should-deploy
  - Permissions: `contents: read`

- **pre-deployment-tests** (15 min timeout)
  - Runs full backend and frontend test suites
  - Can be skipped via workflow dispatch (use with caution)
  - Permissions: `contents: read`

- **build-and-push** (30 min timeout)
  - Builds and pushes container images
  - Tags images with environment and SHA
  - Outputs: backend-image, frontend-image
  - Permissions: `contents: read`, `packages: write`, `id-token: write`

- **deploy-staging** (15 min timeout)
  - Deploys to staging environment
  - Runs database migrations
  - Waits for stabilization
  - Runs smoke tests (health check)
  - Environment: `staging`
  - Permissions: `contents: read`, `deployments: write`

- **deploy-production** (20 min timeout)
  - **Requires manual approval** (configured in GitHub Environment)
  - Creates database backup before migrations
  - Deploys to production environment
  - Longer stabilization wait (60s vs 30s)
  - Comprehensive smoke tests (health + readiness)
  - Environment: `production`
  - Permissions: `contents: read`, `deployments: write`

- **post-deployment** (5 min timeout)
  - Generates deployment summary
  - Checks overall deployment status
  - Permissions: `contents: read`

**Key Features**:
- Automatic staging deployment from develop branch
- Manual approval required for production
- Pre-deployment testing gate
- Database backup before production migrations
- Comprehensive smoke tests
- Deployment status tracking
- Rollback instructions on failure
- Environment-specific configuration

---

## Setup Instructions

### 1. GitHub Repository Settings

#### Enable GitHub Actions

1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions", select "Allow all actions and reusable workflows"
3. Under "Workflow permissions", select "Read and write permissions"
4. Enable "Allow GitHub Actions to create and approve pull requests"

#### Configure Environments

Create two environments for deployment:

##### Staging Environment

1. Go to **Settings** → **Environments**
2. Click "New environment"
3. Name: `staging`
4. Click "Configure environment"
5. Optionally add environment protection rules:
   - Required reviewers: None (auto-deploy)
   - Wait timer: 0 minutes
6. Add environment secrets (see Required Secrets section)
7. Add environment URL: `https://staging.example.com`

##### Production Environment

1. Create another environment named `production`
2. **Enable protection rules**:
   - ✅ Required reviewers: Add team members who can approve production deployments
   - ✅ Wait timer: Optional (e.g., 5 minutes to allow cancellation)
   - ✅ Deployment branches: Only `main` branch
3. Add environment secrets (see Required Secrets section)
4. Add environment URL: `https://example.com`

### 2. Enable GitHub Container Registry (GHCR)

1. Go to **Settings** → **Actions** → **General**
2. Under "Workflow permissions", ensure "Read and write permissions" is selected
3. Container images will be pushed to `ghcr.io/YOUR_ORG/YOUR_REPO/backend` and `/frontend`

### 3. Enable Security Features

#### Code Scanning

1. Go to **Settings** → **Security & analysis**
2. Enable "Dependency graph"
3. Enable "Dependabot alerts"
4. Enable "Dependabot security updates"
5. Enable "Code scanning" (CodeQL)

#### Secret Scanning

1. Enable "Secret scanning"
2. Enable "Push protection" (prevents accidental secret commits)

---

## Required Secrets

### Repository Secrets

Add these at **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

#### Required for All Workflows

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `CODECOV_TOKEN` | Codecov upload token (optional) | `abc123...` |

#### Required for Deployment

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DEPLOY_SSH_KEY` | SSH private key for deployment server | `-----BEGIN...` |
| `DEPLOY_HOST_STAGING` | Staging server hostname | `staging.example.com` |
| `DEPLOY_HOST_PRODUCTION` | Production server hostname | `example.com` |
| `DEPLOY_USER` | SSH username for deployment | `deploy` |

### Environment Secrets

Add these to each environment (**Settings** → **Environments** → Select environment → **Add secret**):

#### Staging Environment Secrets

| Secret Name | Description |
|-------------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `DJANGO_SECRET_KEY` | Django secret key (50+ chars) |
| `FIELD_ENCRYPTION_KEY` | Fernet encryption key (32 chars) |
| `STRIPE_SECRET_KEY` | Stripe test mode secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `EMAIL_HOST_PASSWORD` | SMTP password |
| `SENTRY_DSN` | Sentry DSN (optional) |

#### Production Environment Secrets

Same as staging, but with production values:
- Use production database
- Use Stripe live mode keys
- Use production SMTP credentials

### GitHub App Tokens (Optional)

For better API rate limits and enhanced features:

| Secret Name | Description |
|-------------|-------------|
| `GH_APP_ID` | GitHub App ID |
| `GH_APP_PRIVATE_KEY` | GitHub App private key |

---

## Local Development Parity

Run the same checks locally that run in CI to catch issues before pushing.

### Backend

```bash
cd backend

# Install dependencies (same as CI)
pip install -e .
pip install -e .[dev]

# Linting (same as CI lint job)
ruff check .
ruff format --check .

# Type checking (same as CI)
mypy apps config

# Security scanning (same as CI security job)
bandit -r apps config -ll -f screen
pip-audit

# Run tests (same as CI test job)
pytest --cov=apps --cov-report=term-missing

# Check for missing migrations (same as migration-check.yml)
python manage.py makemigrations --check --dry-run --noinput
```

### Frontend

```bash
cd frontend

# Install dependencies (same as CI)
npm ci

# Linting (same as CI lint job)
npm run lint

# Type checking (same as CI)
npx tsc --noEmit

# Security scanning (same as CI security job)
npm audit --audit-level=high

# Unit tests (same as CI test job)
npm test -- --run --coverage

# Build check (same as CI build job)
npm run build

# E2E tests - quick smoke tests (same as CI on PRs)
npm run test:e2e:quick

# E2E tests - full suite (same as CI on pushes)
npm run test:e2e

# E2E tests - with UI for debugging
npm run test:e2e:ui
```

### Container Builds

```bash
# Build backend image (same as container-build.yml)
cd backend
docker build -t backend:local .

# Build frontend image
cd ../frontend
docker build -t frontend:local .

# Run containers locally
cd ..
docker-compose up
```

### Pre-commit Hooks (Optional but Recommended)

Install pre-commit hooks to automatically run checks before commits:

```bash
# Install pre-commit
pip install pre-commit

# Install git hooks
cd backend
pre-commit install

# Run manually on all files
pre-commit run --all-files
```

---

## Troubleshooting

### Common Issues

#### 1. CI Fails with "Missing migrations"

**Symptom**: Migration check job fails with "Missing migrations detected"

**Solution**:
```bash
cd backend
python manage.py makemigrations
git add apps/*/migrations/*.py
git commit -m "Add missing migrations"
git push
```

#### 2. E2E Tests Timeout

**Symptom**: E2E tests fail with timeout errors

**Possible Causes**:
1. Backend not ready when tests start
2. Database migrations not applied
3. Test expectations too strict

**Solutions**:
- Check backend logs in CI artifacts
- Increase timeout in playwright.config.ts if legitimately slow
- Use `@quick` tag for faster smoke tests on PRs
- Verify backend health endpoint works locally

**Debug Locally**:
```bash
# Start backend first
cd backend
docker-compose up -d db redis
python manage.py migrate
python manage.py runserver

# In another terminal, run E2E tests
cd frontend
npm run test:e2e:debug  # Opens Playwright inspector
```

#### 3. Container Build Fails

**Symptom**: Docker build step fails

**Common Issues**:
- Missing dependencies in pyproject.toml or package.json
- Build args not passed correctly
- Multi-stage build issues

**Debug Locally**:
```bash
# Build with same settings as CI
docker build --no-cache -f backend/Dockerfile ./backend

# Check logs for specific error
docker build -f backend/Dockerfile ./backend 2>&1 | grep -i error
```

#### 4. Security Scan Failures

**Symptom**: Bandit or npm audit finds vulnerabilities

**For Bandit (Python)**:
- Review findings in Security tab
- If false positive, add `# nosec` comment with justification
- Example: `password_hash = hashlib.sha256(...)  # nosec B303 - not used for security`

**For pip-audit**:
- Upgrade affected packages: `pip install --upgrade <package>`
- Check if fix is available
- Document known issues if no fix exists

**For npm audit**:
```bash
cd frontend

# Try automatic fixes
npm audit fix

# For breaking changes, review manually
npm audit

# Update specific package
npm update <package>
```

#### 5. Deployment Fails

**Symptom**: Deploy job fails at deployment step

**Common Issues**:
- Missing environment secrets
- Incorrect SSH credentials
- Server not accessible

**Debug Steps**:
1. Verify all environment secrets are set
2. Test SSH access manually:
   ```bash
   ssh -i deploy_key deploy@staging.example.com
   ```
3. Check server logs:
   ```bash
   ssh deploy@staging.example.com 'docker-compose logs'
   ```
4. Verify health endpoint:
   ```bash
   curl https://staging.example.com/api/v1/health/
   ```

#### 6. Test Matrix Failures

**Symptom**: Tests pass on main CI but fail on test matrix

**Possible Causes**:
- Version-specific incompatibilities
- Flaky tests
- Race conditions in parallel execution

**Solutions**:
- Check if failure is in experimental version (can be ignored)
- Run locally with specific version:
  ```bash
  # Test with Python 3.11
  pyenv install 3.11
  pyenv local 3.11
  pytest
  ```
- Review test matrix job logs for version-specific errors

### Debug CI Workflows Locally

Use [act](https://github.com/nektos/act) to run GitHub Actions locally:

```bash
# Install act
brew install act  # macOS
# or
sudo apt-get install act  # Linux

# Run a specific job
act -j lint

# Run full workflow
act -W .github/workflows/backend-ci.yml

# Use custom secrets
act -j deploy --secret-file .secrets
```

### Viewing CI Artifacts

1. Go to the Actions tab in GitHub
2. Click on the workflow run
3. Scroll to "Artifacts" section at the bottom
4. Download available artifacts:
   - `security-reports` - Bandit and pip-audit results
   - `npm-audit-report` - npm security scan
   - `backend-sbom` / `frontend-sbom` - Software bill of materials
   - `playwright-report` - E2E test HTML report
   - `playwright-traces` - Playwright traces for failed tests
   - `playwright-videos` - Videos of failed E2E tests

### Re-running Failed Jobs

1. Go to the Actions tab
2. Click on the failed workflow run
3. Click "Re-run failed jobs" (top right)
4. Or "Re-run all jobs" to run everything again

---

## Best Practices

### 1. Writing Tests for CI

**Tag E2E tests appropriately**:
```typescript
// Quick smoke test - runs on every PR
test('@quick should load homepage', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/SaaS/)
})

// Full test - only runs on push to main/develop
test('should complete full user journey', async ({ page }) => {
  // ... comprehensive test
})
```

**Use proper timeouts**:
```typescript
// Increase timeout for slow operations
test('should process large file', async ({ page }) => {
  test.setTimeout(60000)  // 60 seconds
  // ...
})
```

### 2. Managing Secrets

**Never commit secrets**:
- Use `.env.example` with dummy values
- Store real secrets in GitHub Secrets
- Use secret scanning to catch accidents

**Rotate secrets regularly**:
- Production secrets: Every 90 days
- Staging secrets: Every 180 days
- Document last rotation date

### 3. Deployment Strategy

**Staging First**:
1. Merge PR to `develop`
2. Auto-deploy to staging
3. Run smoke tests and manual QA
4. If issues found, fix in new PR
5. Once stable, merge `develop` to `main`

**Production Deployment**:
1. Merge to `main` triggers build
2. Manual approval required
3. Backup database before migration
4. Deploy during low-traffic window
5. Monitor for 30 minutes post-deployment
6. Keep previous version ready for rollback

### 4. Monitoring CI Performance

**Track metrics**:
- Average workflow duration
- Failure rate per workflow
- Most common failure causes
- Cache hit rates

**Optimize slow workflows**:
- Use caching effectively
- Run independent jobs in parallel
- Split large test suites
- Use appropriate runner sizes

### 5. Security Practices

**Review security scan results weekly**:
- Prioritize HIGH and CRITICAL vulnerabilities
- Update dependencies regularly
- Document accepted risks

**Code review security changes**:
- All changes to workflows require review
- Changes to Dockerfiles require security review
- Changes to deployment scripts require senior review

---

## Workflow Maintenance

### Updating Workflows

1. **Make changes in a branch**
2. **Test workflows on pull request** (workflows with `pull_request` trigger will run)
3. **Review changes carefully** - workflows have elevated permissions
4. **Merge to main** only after approval

### Dependency Updates

**Python dependencies** (backend):
```bash
# Check for outdated packages
pip list --outdated

# Update specific package
pip install --upgrade <package>

# Update all
pip install --upgrade -r requirements.txt  # if using requirements.txt
```

**Node dependencies** (frontend):
```bash
# Check for updates
npm outdated

# Update specific package
npm update <package>

# Update all (with major versions)
npx npm-check-updates -u
npm install
```

**GitHub Actions**:
- Dependabot is configured to update action versions
- Review and merge Dependabot PRs regularly

---

## Support and Resources

### Documentation Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Playwright Documentation](https://playwright.dev)
- [pytest Documentation](https://docs.pytest.org)
- [Django Testing](https://docs.djangoproject.com/en/stable/topics/testing/)

### Getting Help

1. **Check workflow logs** in GitHub Actions tab
2. **Review this documentation** for common issues
3. **Search GitHub Issues** for similar problems
4. **Ask in team chat** with workflow run URL
5. **Create GitHub Issue** for persistent problems

### Maintenance Schedule

- **Daily**: Monitor workflow runs, address failures
- **Weekly**: Review security scan results
- **Monthly**: Update dependencies, review metrics
- **Quarterly**: Audit secrets, rotate credentials, review overall CI/CD health

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-01-XX | Initial CI/CD pipeline implementation | Team |
| 2025-01-XX | Added comprehensive documentation | Team |

---

*Last Updated: 2025-01-XX*
