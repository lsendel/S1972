# CI/CD Improvement Plan

Comprehensive plan to enhance the GitHub Actions workflows with security hardening, fast feedback loops, container security, and deployment automation.

## Table of Contents

- [Overview](#overview)
- [Phase 1: Security & Hardening](#phase-1-security--hardening)
- [Phase 2: Fast Feedback Loops](#phase-2-fast-feedback-loops)
- [Phase 3: Container Build & Security Scan](#phase-3-container-build--security-scan)
- [Phase 4: Security Static Checks](#phase-4-security-static-checks)
- [Phase 5: Performance & Caching](#phase-5-performance--caching)
- [Phase 6: E2E Test Stability](#phase-6-e2e-test-stability)
- [Phase 7: Deployment Pipeline](#phase-7-deployment-pipeline)
- [Phase 8: Documentation](#phase-8-documentation)
- [Implementation Timeline](#implementation-timeline)
- [Success Metrics](#success-metrics)

---

## Overview

### Current State

**Workflows**:
- ✅ Backend CI (lint, type-check, test, security)
- ✅ Frontend CI (lint, type-check, unit tests, E2E tests, build)
- ⚠️ Missing: Container builds, deployment pipeline, migration checks
- ⚠️ Missing: Advanced security scanning, SBOM generation

**Issues to Address**:
- Overly permissive GitHub token permissions
- No migration drift detection on PRs
- No container image scanning or signing
- Missing pip/npm hash verification
- No caching for dependencies
- E2E tests are flaky without retries
- No deployment automation
- Missing local dev parity documentation

### Goals

1. **Security First**: Least-privilege permissions, vulnerability scanning, signed artifacts
2. **Fast Feedback**: Migration checks, pre-commit validation in < 2 minutes
3. **Reliability**: Stable E2E tests, comprehensive test matrix
4. **Automation**: One-click deployments with safeguards
5. **Developer Experience**: Local commands match CI exactly

### Estimated Effort

| Phase | Effort | Priority | Dependencies |
|-------|--------|----------|--------------|
| Phase 1 | 2-4 hours | 🔴 Critical | None |
| Phase 2 | 1-2 hours | 🟠 High | None |
| Phase 3 | 4-6 hours | 🟠 High | Phase 1 |
| Phase 4 | 2-3 hours | 🟡 Medium | Phase 1 |
| Phase 5 | 1-2 hours | 🟡 Medium | None |
| Phase 6 | 2-3 hours | 🟡 Medium | None |
| Phase 7 | 6-8 hours | 🟠 High | Phases 1, 3 |
| Phase 8 | 2-3 hours | 🟢 Low | All phases |

**Total Estimated Time**: 20-31 hours (2.5-4 work days)

---

## Phase 1: Security & Hardening

**Priority**: 🔴 **Critical**
**Effort**: 2-4 hours
**Dependencies**: None

### Objectives

- Implement least-privilege permissions per job
- Add explicit timeouts to prevent runaway jobs
- Set global CI environment variable
- Remove unnecessary permissions from test jobs

### Tasks

#### 1.1 Update Backend CI Permissions

**File**: `.github/workflows/backend-ci.yml`

```yaml
# Add at workflow level
env:
  CI: true

permissions:
  contents: read  # Default for all jobs

jobs:
  lint:
    permissions:
      contents: read  # Read source code only
    timeout-minutes: 10
    # ...

  security:
    permissions:
      contents: read
      security-events: write  # For CodeQL/SARIF upload
    timeout-minutes: 15
    # ...

  test:
    permissions:
      contents: read
      pull-requests: write  # For coverage comments (optional)
    timeout-minutes: 20
    # ...

  build:
    permissions:
      contents: read
    timeout-minutes: 10
    # ...

  e2e:
    permissions:
      contents: read
    timeout-minutes: 30  # E2E takes longer
    # ...
```

#### 1.2 Update Frontend CI Permissions

**File**: `.github/workflows/frontend-ci.yml`

```yaml
env:
  CI: true

permissions:
  contents: read

jobs:
  lint:
    permissions:
      contents: read
    timeout-minutes: 10
    # ...

  security:
    permissions:
      contents: read
    timeout-minutes: 10
    # ...

  test:
    permissions:
      contents: read
      pull-requests: write  # For coverage (optional)
    timeout-minutes: 15
    # ...

  build:
    permissions:
      contents: read
    timeout-minutes: 15
    # ...

  e2e:
    permissions:
      contents: read
    timeout-minutes: 35
    # ...
```

#### 1.3 Remove Codecov id-token Permission

**Rationale**: Tests don't need OIDC tokens; Codecov works with GITHUB_TOKEN or API token

```yaml
# Remove from test jobs
# permissions:
#   id-token: write  # ❌ Remove this

# Keep only:
permissions:
  contents: read
  pull-requests: write  # Only if posting coverage comments
```

### Verification

```bash
# Check permissions locally
gh api repos/:owner/:repo/actions/permissions --jq '.default_workflow_permissions'

# Verify workflow syntax
actionlint .github/workflows/*.yml
```

### Success Criteria

- ✅ All jobs have explicit `timeout-minutes`
- ✅ Each job has minimal required permissions
- ✅ No job has `id-token: write` unless needed (deployments only)
- ✅ Global `CI=true` environment variable set

---

## Phase 2: Fast Feedback Loops

**Priority**: 🟠 **High**
**Effort**: 1-2 hours
**Dependencies**: None

### Objectives

- Detect migration drift in < 1 minute
- Run pre-commit checks in CI
- Provide fast feedback before expensive test suites

### Tasks

#### 2.1 Add Migration Gate Job

**File**: `.github/workflows/migration-check.yml` (new)

```yaml
name: Migration Check

on:
  pull_request:
    paths:
      - 'backend/apps/**/migrations/**'
      - 'backend/apps/**/models.py'
      - '.github/workflows/migration-check.yml'

env:
  CI: true

permissions:
  contents: read
  pull-requests: write  # For PR comments

jobs:
  check-migrations:
    name: Check for Migration Drift
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install dependencies
        working-directory: ./backend
        run: |
          python -m pip install --upgrade pip
          pip install -e .

      - name: Check for missing migrations
        working-directory: ./backend
        env:
          DATABASE_URL: sqlite:///db.sqlite3
          DJANGO_SETTINGS_MODULE: config.settings.test
          DJANGO_SECRET_KEY: ci-test-key-$(date +%s)
        run: |
          python manage.py makemigrations --check --dry-run --verbosity 2

      - name: Show migration plan
        working-directory: ./backend
        env:
          DATABASE_URL: sqlite:///db.sqlite3
          DJANGO_SETTINGS_MODULE: config.settings.test
          DJANGO_SECRET_KEY: ci-test-key-$(date +%s)
        run: |
          python manage.py showmigrations --plan

      - name: Comment on PR
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '⚠️ **Migration drift detected!** Run `python manage.py makemigrations` and commit the new migration files.'
            })
```

#### 2.2 Add Pre-commit CI Job

**File**: `.github/workflows/pre-commit.yml` (new)

```yaml
name: Pre-commit Checks

on:
  pull_request:
  push:
    branches: [main, develop]

env:
  CI: true

permissions:
  contents: read

jobs:
  pre-commit:
    name: Run Pre-commit Hooks
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install pre-commit
        run: pip install pre-commit

      - name: Cache pre-commit hooks
        uses: actions/cache@v4
        with:
          path: ~/.cache/pre-commit
          key: pre-commit-${{ hashFiles('.pre-commit-config.yaml') }}
          restore-keys: |
            pre-commit-

      - name: Run pre-commit
        working-directory: ./backend
        run: pre-commit run --all-files --show-diff-on-failure
```

### Verification

```bash
# Test migration check locally
cd backend
python manage.py makemigrations --check --dry-run

# Test pre-commit locally
pre-commit run --all-files
```

### Success Criteria

- ✅ Migration drift detected in < 1 minute on PRs
- ✅ Pre-commit runs on all files in < 10 minutes
- ✅ Automatic PR comments on migration failures
- ✅ Fast feedback before running full test suite

---

## Phase 3: Container Build & Security Scan

**Priority**: 🟠 **High**
**Effort**: 4-6 hours
**Dependencies**: Phase 1

### Objectives

- Build multi-platform Docker images
- Generate SBOMs for supply chain security
- Scan images for vulnerabilities
- Sign images with Cosign
- Publish to registry with GitHub Environments

### Tasks

#### 3.1 Create Backend Dockerfile

**File**: `backend/Dockerfile` (if not exists)

```dockerfile
# Multi-stage build for smaller images
FROM python:3.12-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Final stage
FROM python:3.12-slim

WORKDIR /app

# Copy from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application
COPY . .

# Run as non-root
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/api/v1/health/')"

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

#### 3.2 Create Frontend Dockerfile

**File**: `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3.3 Create Container Build Workflow

**File**: `.github/workflows/container-build.yml` (new)

```yaml
name: Container Build & Scan

on:
  pull_request:
    paths:
      - 'backend/**'
      - 'frontend/**'
      - '.github/workflows/container-build.yml'
  push:
    branches: [main]
    tags: ['v*']

env:
  CI: true
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

permissions:
  contents: read
  packages: write  # For pushing to GHCR
  security-events: write  # For uploading SARIF
  id-token: write  # For cosign signing

jobs:
  build-backend:
    name: Build & Scan Backend
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true

      - name: Generate SBOM with Syft
        uses: anchore/sbom-action@v0
        with:
          image: ${{ steps.meta.outputs.tags }}
          format: spdx-json
          output-file: backend-sbom.spdx.json

      - name: Scan image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.meta.outputs.tags }}
          format: 'sarif'
          output: 'trivy-backend-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-backend-results.sarif'
          category: 'trivy-backend'

      - name: Install Cosign
        if: github.event_name != 'pull_request'
        uses: sigstore/cosign-installer@v3

      - name: Sign image with Cosign
        if: github.event_name != 'pull_request'
        env:
          COSIGN_EXPERIMENTAL: "true"
        run: |
          cosign sign --yes \
            ${{ steps.meta.outputs.tags }}

      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v4
        with:
          name: backend-sbom
          path: backend-sbom.spdx.json
          retention-days: 90

  build-frontend:
    name: Build & Scan Frontend
    runs-on: ubuntu-latest
    timeout-minutes: 25

    steps:
      # Similar to backend but for frontend
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          platforms: linux/amd64,linux/arm64
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true

      - name: Scan with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.meta.outputs.tags }}
          format: 'sarif'
          output: 'trivy-frontend-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-frontend-results.sarif'
          category: 'trivy-frontend'

      - name: Sign image
        if: github.event_name != 'pull_request'
        env:
          COSIGN_EXPERIMENTAL: "true"
        run: |
          cosign sign --yes ${{ steps.meta.outputs.tags }}
```

### Verification

```bash
# Build locally
docker build -t backend:test ./backend
docker build -t frontend:test ./frontend

# Scan locally with Trivy
trivy image backend:test
trivy image frontend:test

# Generate SBOM locally
syft backend:test -o spdx-json=backend-sbom.json
```

### Success Criteria

- ✅ Multi-platform images (amd64, arm64) built
- ✅ SBOMs generated and stored as artifacts
- ✅ Trivy scans uploaded to Security tab
- ✅ Images signed with Cosign
- ✅ Images pushed to GHCR on tags
- ✅ No CRITICAL/HIGH vulnerabilities in production images

---

## Phase 4: Security Static Checks

**Priority**: 🟡 **Medium**
**Effort**: 2-3 hours
**Dependencies**: Phase 1

### Objectives

- Add Bandit for Python security linting
- Add pip-audit for dependency vulnerabilities
- Enhance npm audit for frontend dependencies
- Integrate with GitHub Security tab

### Tasks

#### 4.1 Add Bandit to Backend CI

**File**: `.github/workflows/backend-ci.yml`

```yaml
jobs:
  security:
    name: Security Checks
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
      security-events: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install security tools
        run: |
          pip install bandit[toml] pip-audit

      - name: Run Bandit
        run: |
          bandit -r apps/ -f sarif -o bandit-results.sarif
        continue-on-error: true

      - name: Upload Bandit results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: bandit-results.sarif
          category: bandit

      - name: Run pip-audit
        run: |
          pip-audit --desc --format json --output pip-audit-results.json
        continue-on-error: true

      - name: Upload pip-audit artifact
        uses: actions/upload-artifact@v4
        with:
          name: pip-audit-results
          path: pip-audit-results.json
```

#### 4.2 Configure Bandit

**File**: `backend/pyproject.toml`

```toml
[tool.bandit]
exclude_dirs = [
    "*/tests/*",
    "*/migrations/*",
    "*/test_*.py",
]
skips = ["B101"]  # Skip assert_used in tests
```

#### 4.3 Enhance npm audit

**File**: `.github/workflows/frontend-ci.yml`

```yaml
jobs:
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run npm audit (production only)
        working-directory: ./frontend
        run: |
          npm audit --omit=dev --audit-level=high --json > npm-audit.json
        continue-on-error: true

      - name: Check for high/critical vulnerabilities
        working-directory: ./frontend
        run: |
          VULN_COUNT=$(jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' npm-audit.json)
          if [ "$VULN_COUNT" -gt 0 ]; then
            echo "::warning::Found $VULN_COUNT high/critical vulnerabilities"
            jq '.vulnerabilities' npm-audit.json
          fi

      - name: Upload audit results
        uses: actions/upload-artifact@v4
        with:
          name: npm-audit-results
          path: frontend/npm-audit.json
```

### Verification

```bash
# Backend
cd backend
bandit -r apps/ -f screen
pip-audit --desc

# Frontend
cd frontend
npm audit --omit=dev --audit-level=high
```

### Success Criteria

- ✅ Bandit runs on all Python code
- ✅ Results uploaded to Security tab
- ✅ pip-audit checks dependencies
- ✅ npm audit scans production dependencies
- ✅ CI fails on CRITICAL severity findings

---

## Phase 5: Performance & Caching

**Priority**: 🟡 **Medium**
**Effort**: 1-2 hours
**Dependencies**: None

### Objectives

- Cache pip dependencies
- Cache npm dependencies
- Add test matrix for multiple Python/Node versions
- Reduce CI run time by 30-50%

### Tasks

#### 5.1 Add Pip Caching

**File**: `.github/workflows/backend-ci.yml`

```yaml
jobs:
  test:
    steps:
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'  # Automatic caching
          cache-dependency-path: 'backend/pyproject.toml'

      # Or manual caching for more control:
      - name: Cache pip packages
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: pip-${{ runner.os }}-${{ hashFiles('backend/pyproject.toml') }}
          restore-keys: |
            pip-${{ runner.os }}-
```

#### 5.2 Add NPM Caching

**File**: `.github/workflows/frontend-ci.yml`

```yaml
jobs:
  test:
    steps:
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'  # Automatic caching
          cache-dependency-path: 'frontend/package-lock.json'

      # Or manual caching:
      - name: Cache npm packages
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: npm-${{ runner.os }}-${{ hashFiles('frontend/package-lock.json') }}
          restore-keys: |
            npm-${{ runner.os }}-
```

#### 5.3 Add Test Matrix

**File**: `.github/workflows/backend-ci.yml`

```yaml
jobs:
  test:
    name: Test (Python ${{ matrix.python-version }}, Django ${{ matrix.django-version }})
    runs-on: ubuntu-latest
    timeout-minutes: 20

    strategy:
      fail-fast: false
      matrix:
        python-version: ['3.11', '3.12']
        django-version: ['5.1', '5.2']

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -e .
          pip install Django==${{ matrix.django-version }}.*

      - name: Run tests
        run: pytest --cov=apps
```

**File**: `.github/workflows/frontend-ci.yml`

```yaml
jobs:
  test:
    name: Test (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    timeout-minutes: 15

    strategy:
      fail-fast: false
      matrix:
        node-version: ['20', '22']

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Run tests
        run: npm test
```

### Verification

```bash
# Check cache hit rates in Actions logs
# Should see: "Cache restored from key: pip-..."

# Time CI runs before/after caching
# Expect 30-50% reduction in setup time
```

### Success Criteria

- ✅ Pip packages cached across runs
- ✅ NPM packages cached across runs
- ✅ Test matrix covers Python 3.11/3.12
- ✅ Test matrix covers Node 20/22
- ✅ CI runs 30%+ faster with caching

---

## Phase 6: E2E Test Stability

**Priority**: 🟡 **Medium**
**Effort**: 2-3 hours
**Dependencies**: None

### Objectives

- Add retries for flaky E2E tests
- Reduce flakiness with parallel workers
- Capture traces and videos on failure
- Split E2E into quick vs full suites

### Tasks

#### 6.1 Update Playwright Config

**File**: `frontend/playwright.config.ts`

```typescript
export default defineConfig({
  // ...existing config

  // Reduce flakiness
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 2 : 0,
  maxFailures: 5,

  use: {
    // ...existing use config

    // Better error diagnostics
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Reporter config
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }],
  ],

  // Test tags for splitting
  projects: [
    {
      name: 'quick',
      testMatch: /.*\.spec\.ts/,
      grep: /@quick/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'full',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

#### 6.2 Tag E2E Tests

**File**: `frontend/e2e/auth.spec.ts`

```typescript
// Quick smoke tests
test('should redirect to login @quick', async ({ page }) => {
  // ...
})

// Full test suite
test('should handle full authentication flow', async ({ page }) => {
  // ...
})
```

#### 6.3 Update E2E Workflow

**File**: `.github/workflows/frontend-ci.yml`

```yaml
jobs:
  e2e-quick:
    name: E2E Quick Smoke Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read

    steps:
      # ...setup steps

      - name: Run quick E2E tests
        working-directory: ./frontend
        run: npm run test:e2e -- --project=quick --workers=2

      - name: Upload traces
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces-quick
          path: frontend/test-results/
          retention-days: 7

  e2e-full:
    name: E2E Full Test Suite
    runs-on: ubuntu-latest
    timeout-minutes: 35
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read

    steps:
      # ...setup steps

      - name: Run full E2E tests
        working-directory: ./frontend
        run: npm run test:e2e -- --project=full --workers=2

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: |
            frontend/test-results/
            frontend/test-results.json
          retention-days: 30
```

### Verification

```bash
# Test locally with retries
cd frontend
npm run test:e2e -- --retries=2

# Test with workers
npm run test:e2e -- --workers=2

# Test quick suite
npm run test:e2e -- --project=quick
```

### Success Criteria

- ✅ Retries enabled (2x) on CI
- ✅ Tests run with 2 workers for stability
- ✅ Traces captured on first retry
- ✅ Videos saved on failures only
- ✅ Quick smoke tests run in < 10 minutes
- ✅ Full suite runs on main branch only
- ✅ < 1% flake rate on E2E tests

---

## Phase 7: Deployment Pipeline

**Priority**: 🟠 **High**
**Effort**: 6-8 hours
**Dependencies**: Phases 1, 3

### Objectives

- Automate deployments from main/tags
- Run database migrations safely
- Perform post-deployment health checks
- Use GitHub Environments for staging/production
- Require manual approval for production

### Tasks

#### 7.1 Create GitHub Environments

**Settings** → **Environments** → Create:

1. **staging**
   - Deployment branches: `main`
   - No required reviewers
   - Secrets: `STAGING_*` variables

2. **production**
   - Deployment branches: `tags/v*`
   - Required reviewers: 1-2 team members
   - Secrets: `PRODUCTION_*` variables

#### 7.2 Create Deployment Workflow

**File**: `.github/workflows/deploy.yml` (new)

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        type: choice
        options:
          - staging
          - production

env:
  CI: true
  REGISTRY: ghcr.io

permissions:
  contents: read
  packages: write
  id-token: write

jobs:
  determine-environment:
    name: Determine Deployment Target
    runs-on: ubuntu-latest
    timeout-minutes: 5
    outputs:
      environment: ${{ steps.set-env.outputs.environment }}

    steps:
      - name: Determine environment
        id: set-env
        run: |
          if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
            echo "environment=${{ inputs.environment }}" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == refs/tags/v* ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
          else
            echo "environment=staging" >> $GITHUB_OUTPUT
          fi

  deploy:
    name: Deploy to ${{ needs.determine-environment.outputs.environment }}
    needs: determine-environment
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment:
      name: ${{ needs.determine-environment.outputs.environment }}
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Pull latest images
        run: |
          docker pull ${{ env.REGISTRY }}/${{ github.repository }}/backend:main
          docker pull ${{ env.REGISTRY }}/${{ github.repository }}/frontend:main

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Run database migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DJANGO_SETTINGS_MODULE: config.settings.production
          DJANGO_SECRET_KEY: ${{ secrets.DJANGO_SECRET_KEY }}
        run: |
          docker run --rm \
            -e DATABASE_URL \
            -e DJANGO_SETTINGS_MODULE \
            -e DJANGO_SECRET_KEY \
            ${{ env.REGISTRY }}/${{ github.repository }}/backend:main \
            python manage.py migrate --noinput

      - name: Run deployment checks
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DJANGO_SECRET_KEY: ${{ secrets.DJANGO_SECRET_KEY }}
        run: |
          docker run --rm \
            -e DATABASE_URL \
            -e DJANGO_SECRET_KEY \
            ${{ env.REGISTRY }}/${{ github.repository }}/backend:main \
            python manage.py check --deploy

      - name: Deploy to server
        id: deploy
        run: |
          # Replace with your deployment method (ECS, K8s, etc.)
          echo "url=https://${{ needs.determine-environment.outputs.environment }}.example.com" >> $GITHUB_OUTPUT

      - name: Wait for deployment
        run: sleep 30

      - name: Health check
        run: |
          URL="${{ steps.deploy.outputs.url }}/api/v1/health/"
          MAX_ATTEMPTS=10
          ATTEMPT=0

          while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
            if curl -f -s "$URL" > /dev/null; then
              echo "✅ Health check passed"
              exit 0
            fi
            ATTEMPT=$((ATTEMPT + 1))
            echo "⏳ Waiting for health check ($ATTEMPT/$MAX_ATTEMPTS)..."
            sleep 10
          done

          echo "❌ Health check failed after $MAX_ATTEMPTS attempts"
          exit 1

      - name: Smoke test authenticated flow
        env:
          BASE_URL: ${{ steps.deploy.outputs.url }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
        run: |
          # Test login
          curl -f -X POST "$BASE_URL/api/v1/auth/login/" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}" \
            -c cookies.txt

          # Test authenticated endpoint
          curl -f "$BASE_URL/api/v1/auth/me/" -b cookies.txt

          echo "✅ Smoke test passed"

      - name: Notify deployment status
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const status = '${{ job.status }}'
            const env = '${{ needs.determine-environment.outputs.environment }}'
            const url = '${{ steps.deploy.outputs.url }}'

            const emoji = status === 'success' ? '✅' : '❌'
            const message = `${emoji} Deployment to **${env}** ${status}\n\nURL: ${url}`

            github.rest.repos.createCommitComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              commit_sha: context.sha,
              body: message
            })
```

### Verification

```bash
# Test deployment locally
docker-compose up -d
docker-compose exec backend python manage.py check --deploy

# Test health check
curl http://localhost:8000/api/v1/health/
```

### Success Criteria

- ✅ Staging deploys automatically on main push
- ✅ Production requires manual approval
- ✅ Migrations run before deployment
- ✅ Health checks pass before marking success
- ✅ Smoke tests verify basic functionality
- ✅ Deployment status posted as commit comment
- ✅ Rollback possible via re-running previous tag

---

## Phase 8: Documentation

**Priority**: 🟢 **Low**
**Effort**: 2-3 hours
**Dependencies**: All phases

### Objectives

- Document all CI/CD pipelines
- Provide local development parity commands
- List required secrets
- Create troubleshooting guide

### Tasks

#### 8.1 Create CI/CD Guide

**File**: `CI_CD.md` (new)

```markdown
# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment.

## Workflows

### Backend CI (`backend-ci.yml`)

**Triggers**: PR, push to main/develop
**Jobs**:
- Lint (Ruff)
- Type check (mypy)
- Security scan (Bandit, pip-audit)
- Tests (pytest with coverage)
- Build check

**Local equivalent**:
```bash
cd backend
ruff check .
mypy apps config
bandit -r apps/
pip-audit
pytest --cov=apps
```

### Frontend CI (`frontend-ci.yml`)

**Triggers**: PR, push to main/develop
**Jobs**:
- Lint (ESLint)
- Type check (TypeScript)
- Security scan (npm audit)
- Unit tests (Vitest)
- E2E tests (Playwright)
- Build check

**Local equivalent**:
```bash
cd frontend
npm run lint
npx tsc --noEmit
npm audit --omit=dev --audit-level=high
npm test
npm run test:e2e:setup && npm run test:e2e
npm run build
```

### Migration Check (`migration-check.yml`)

**Triggers**: PR with model changes
**Jobs**:
- Check for missing migrations
- Show migration plan

**Local equivalent**:
```bash
cd backend
python manage.py makemigrations --check --dry-run
python manage.py showmigrations --plan
```

### Container Build (`container-build.yml`)

**Triggers**: PR, push to main, tags
**Jobs**:
- Build multi-platform images
- Generate SBOM
- Scan with Trivy
- Sign with Cosign
- Push to GHCR

**Local equivalent**:
```bash
docker build -t backend:local ./backend
docker build -t frontend:local ./frontend
trivy image backend:local
syft backend:local -o spdx-json
```

### Deployment (`deploy.yml`)

**Triggers**: Push to main (staging), tags (production), manual
**Jobs**:
- Determine environment
- Run migrations
- Deploy containers
- Health check
- Smoke test

**Local equivalent**:
```bash
python manage.py migrate
python manage.py check --deploy
curl http://localhost:8000/api/v1/health/
```

## Required Secrets

### Repository Secrets

- `CODECOV_TOKEN`: Codecov upload token (optional with GitHub App)
- `TEST_USER_EMAIL`: Email for smoke tests
- `TEST_USER_PASSWORD`: Password for smoke tests

### Environment Secrets (Staging)

- `DATABASE_URL`: PostgreSQL connection string
- `DJANGO_SECRET_KEY`: Django secret key
- `REDIS_URL`: Redis connection string
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

### Environment Secrets (Production)

Same as staging, plus:
- `SENTRY_DSN`: Sentry error tracking DSN
- `FIELD_ENCRYPTION_KEY`: Field-level encryption key

## Test Settings

**Backend**: Uses `config.settings.test`

```bash
export DJANGO_SETTINGS_MODULE=config.settings.test
```

**Frontend**: Uses `.env.e2e`

```bash
cp .env.e2e.example .env.e2e
```

## Troubleshooting

### Migration check failing

```bash
# Create missing migrations
python manage.py makemigrations

# Commit the new migration files
git add apps/*/migrations/*.py
git commit -m "Add migrations"
```

### E2E tests flaky

```bash
# Run with retries locally
npm run test:e2e -- --retries=2

# Run with headed mode to debug
npm run test:e2e -- --headed --project=chromium

# Check backend is running
curl http://localhost:8000/api/v1/health/
```

### Container build failing

```bash
# Build locally to debug
docker build --progress=plain ./backend

# Check for missing dependencies
docker run --rm backend:local pip list
```

### Deployment failing health check

```bash
# Check logs
docker-compose logs backend

# Verify environment variables
docker-compose config

# Test health endpoint manually
curl -v http://localhost:8000/api/v1/health/
```

## Performance

### CI Run Times (Target)

| Workflow | Duration | Notes |
|----------|----------|-------|
| Migration check | < 1 min | Fast feedback |
| Pre-commit | < 5 min | Lint/format only |
| Backend CI | 8-12 min | With caching |
| Frontend CI | 10-15 min | Including E2E quick |
| Container build | 15-20 min | Multi-platform |
| Deployment | 10-15 min | Including health checks |

### Optimization Tips

1. **Use caching**: pip/npm caches save 30-50% time
2. **Run in parallel**: Lint + test + build concurrently
3. **Fail fast**: migration-check before full CI
4. **Split E2E**: Quick suite for PRs, full for main
5. **Matrix smartly**: Test LTS versions only

## Best Practices

1. **Always run tests locally first**
2. **Keep CI fast** (< 15 minutes for PRs)
3. **Use required checks** for critical workflows
4. **Monitor flaky tests** and fix immediately
5. **Review security scan results** weekly
6. **Rotate secrets** quarterly
7. **Test deployment process** monthly

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Build Docs](https://docs.docker.com/build/)
- [Playwright CI Docs](https://playwright.dev/docs/ci)
- [Trivy Scanning](https://aquasecurity.github.io/trivy/)
```

### Verification

```bash
# Verify all commands work locally
cd backend && ruff check . && mypy apps config && pytest
cd ../frontend && npm run lint && npm test

# Check documentation completeness
grep -r "TODO" CI_CD.md  # Should be empty
```

### Success Criteria

- ✅ Complete CI/CD documentation
- ✅ Local dev parity for all CI commands
- ✅ All required secrets documented
- ✅ Troubleshooting guide with common issues
- ✅ Performance targets documented

---

## Implementation Timeline

### Week 1: Critical Security & Fast Feedback

**Days 1-2**: Phase 1 - Security & Hardening (4 hours)
- Update all workflow permissions
- Add timeouts
- Set CI=true globally

**Day 3**: Phase 2 - Fast Feedback (2 hours)
- Migration check workflow
- Pre-commit CI

**Days 4-5**: Phase 4 - Security Static Checks (3 hours)
- Bandit integration
- pip-audit
- Enhanced npm audit

### Week 2: Containers & Performance

**Days 1-3**: Phase 3 - Container Build & Scan (6 hours)
- Dockerfiles
- Build workflow
- SBOM + Trivy + Cosign

**Day 4**: Phase 5 - Performance & Caching (2 hours)
- Dependency caching
- Test matrix

**Day 5**: Phase 6 - E2E Stability (3 hours)
- Playwright config
- Test tagging
- Split suites

### Week 3: Deployment & Documentation

**Days 1-3**: Phase 7 - Deployment Pipeline (8 hours)
- GitHub Environments
- Deployment workflow
- Health checks & smoke tests

**Days 4-5**: Phase 8 - Documentation (3 hours)
- CI/CD guide
- Troubleshooting
- Best practices

---

## Success Metrics

### Security

- ✅ Zero overly-permissive jobs
- ✅ All images scanned before deployment
- ✅ All images signed with Cosign
- ✅ SBOMs generated for supply chain tracking
- ✅ < 5 high/critical vulnerabilities allowed

### Performance

- ✅ Migration check < 1 minute
- ✅ Backend CI < 12 minutes (with cache)
- ✅ Frontend CI < 15 minutes (with cache)
- ✅ 30%+ time reduction from caching

### Reliability

- ✅ E2E flake rate < 1%
- ✅ Deployment success rate > 95%
- ✅ Health checks catch 100% of broken deployments
- ✅ Zero production incidents from failed migrations

### Developer Experience

- ✅ All CI commands runnable locally
- ✅ Fast feedback (migration/lint) < 5 minutes
- ✅ Clear error messages on failures
- ✅ Comprehensive documentation

---

## Risk Mitigation

### Risk: Pipeline Complexity

**Mitigation**:
- Implement phases incrementally
- Test each phase before moving forward
- Document as you go
- Keep workflows DRY with composite actions

### Risk: Flaky E2E Tests

**Mitigation**:
- Add retries (2x)
- Use stable workers count
- Capture traces for debugging
- Monitor flake rate weekly

### Risk: Slow CI

**Mitigation**:
- Aggressive caching
- Parallel job execution
- Split fast/slow checks
- Only run full E2E on main

### Risk: Deployment Failures

**Mitigation**:
- Manual approval for production
- Comprehensive health checks
- Smoke tests for critical paths
- Rollback capability via tags

### Risk: Secret Sprawl

**Mitigation**:
- Use GitHub Environments
- Document all secrets
- Rotate quarterly
- Use OIDC where possible

---

## Next Steps

1. ✅ Review and approve this plan
2. ⏳ Create tracking issue for each phase
3. ⏳ Assign phases to sprints
4. ⏳ Begin implementation with Phase 1
5. ⏳ Weekly review meetings to track progress

---

**Total Estimated Effort**: 20-31 hours (2.5-4 work days)

**Recommended Approach**: Implement 1-2 phases per week over 3 weeks for sustainable progress.
