# CI/CD Quick Reference Card

**Quick reference for daily CI/CD operations**
Print this out or bookmark it!

---

## 🚀 Common Commands

### Local Development

```bash
# Backend checks (run before pushing)
cd backend
ruff check .                    # Lint
ruff format .                   # Format
mypy apps config                # Type check
pytest                          # Run tests
pytest --cov=apps              # With coverage

# Frontend checks
cd frontend
npm run lint                    # Lint
npx tsc --noEmit               # Type check
npm test                        # Unit tests
npm run test:e2e:quick         # Quick E2E
npm run test:coverage          # With coverage

# Pre-commit hooks
pre-commit run --all-files     # Run all hooks
pre-commit install             # Install hooks
```

### Deployment

```bash
# Health checks
./scripts/health-check.sh staging
./scripts/health-check.sh production

# Deploy (via GitHub Actions)
git push origin main           # Triggers deployment

# Emergency rollback
./scripts/rollback.sh production
```

---

## 📋 Workflow Status

### Check CI Status

```bash
# List recent runs
gh run list --limit 10

# Watch specific run
gh run watch <run-id>

# View logs
gh run view <run-id> --log
```

### View URLs

- **Actions**: `https://github.com/ORG/REPO/actions`
- **Deployments**: `https://github.com/ORG/REPO/deployments`
- **Security**: `https://github.com/ORG/REPO/security`
- **Packages**: `https://github.com/ORG/REPO/packages`

---

## 🔍 Debugging Workflows

### Failed Workflow

1. Click workflow run in Actions tab
2. Click failed job
3. Expand failed step
4. Read error message
5. Download artifacts if available

### Common Fixes

| Error | Fix |
|-------|-----|
| Linting errors | Run `ruff check . --fix` |
| Type errors | Fix type hints, run `mypy` |
| Test failures | Run `pytest -v` locally |
| E2E timeout | Check backend logs |
| Secret not found | Add to GitHub Secrets |
| Permission denied | Check workflow permissions |

---

## 🏷️ Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Refactoring
- `test` - Adding tests
- `chore` - Maintenance

### Examples

```bash
feat(auth): Add two-factor authentication
fix(billing): Correct tax calculation
docs(api): Update auth examples
test(users): Add profile tests
chore(deps): Update Django to 5.1
```

---

## 🌿 Branch Strategy

### Branch Names

- `feature/` - New features
- `fix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test additions

### Workflow

```bash
# Create branch
git checkout -b feature/my-feature

# Work and commit
git add .
git commit -m "feat: Add feature"

# Push and create PR
git push -u origin feature/my-feature
gh pr create

# After approval
# Squash and merge via GitHub UI
```

---

## 🧪 Testing Quick Reference

### Test Tags

```typescript
// Quick smoke test (runs on PRs)
test('@quick should work', async () => {
  // Fast test
});

// Full test (runs on push)
test('comprehensive test', async () => {
  // Detailed test
});
```

### Running Specific Tests

```bash
# Backend
pytest -k test_user             # Name match
pytest tests/test_auth.py       # Specific file
pytest -m slow                  # Marked tests

# Frontend
npm test -- UserProfile         # Component name
npm test -- --grep @quick       # Tagged tests
npm run test:e2e:debug         # Debug mode
```

---

## 🔒 Security Quick Checks

### Before Committing

```bash
# Check for secrets
detect-secrets scan

# Security linting
bandit -r apps config

# Dependency check
pip-audit                       # Backend
npm audit                       # Frontend
```

### If Secret Detected

1. **DO NOT** commit
2. Remove secret from code
3. Use environment variable
4. Add to `.gitignore` if needed
5. Rotate secret if was committed

---

## 📦 Dependency Updates

### Dependabot PRs

1. Review changes in PR
2. Check for breaking changes
3. Run tests locally if major update
4. Merge if tests pass

### Manual Updates

```bash
# Backend
pip install --upgrade <package>
pip freeze > requirements.txt

# Frontend
npm update <package>
npm audit fix
```

---

## 🚨 Incident Response

### P0 - Critical (Service Down)

```bash
# 1. Check status
./scripts/health-check.sh production

# 2. Review logs
ssh deploy@server 'docker logs backend'

# 3. Rollback if needed
./scripts/rollback.sh production

# 4. Notify team
# Post in #incidents channel
```

### Quick Rollback

```bash
./scripts/rollback.sh production
# Type: ROLLBACK to confirm
```

---

## 📊 Metrics to Monitor

### Daily

- [ ] CI success rate
- [ ] Deployment frequency
- [ ] Test pass rate

### Weekly

- [ ] Error rate trends
- [ ] Performance metrics
- [ ] Security scan results

### Monthly

- [ ] Test coverage trends
- [ ] Dependency updates
- [ ] Documentation currency

---

## 🔗 Quick Links

### Documentation

- **Index**: `CI_CD_INDEX.md`
- **Quick Start**: `QUICKSTART_CI_CD.md` (30 min)
- **Full Setup**: `SETUP_CHECKLIST.md` (2-3 hrs)
- **Deployment**: `DEPLOYMENT_RUNBOOK.md`
- **Contributing**: `CONTRIBUTING.md`

### GitHub

- **New Issue**: `https://github.com/ORG/REPO/issues/new/choose`
- **New PR**: `gh pr create`
- **Actions**: `https://github.com/ORG/REPO/actions`

---

## 🎯 Common Tasks

### Create a PR

```bash
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: Description"
git push -u origin feature/my-feature
gh pr create
```

### Deploy to Production

1. Merge PR to `develop`
2. Test on staging
3. Merge `develop` to `main`
4. Approve deployment in GitHub
5. Monitor for 30 minutes

### Fix Failing CI

1. View error in Actions tab
2. Reproduce locally
3. Fix issue
4. Commit and push
5. Verify CI passes

### Add New Secret

1. Go to Settings → Environments
2. Select environment (staging/production)
3. Add secret
4. Update `.github/SECRETS_TEMPLATE.md`

---

## ⚡ Keyboard Shortcuts

**GitHub**:
- `t` - File finder
- `s` - Focus search
- `g c` - Go to code
- `g i` - Go to issues
- `g p` - Go to pull requests

**GitHub CLI**:
- `gh pr list` - List PRs
- `gh pr status` - PR status
- `gh issue list` - List issues
- `gh run list` - List workflow runs

---

## 📞 Who to Contact

| Issue | Contact |
|-------|---------|
| CI/CD failures | DevOps team |
| Deployment issues | On-call engineer |
| Security concerns | Security team |
| General questions | Team lead |

---

## 🆘 Emergency Contacts

- **On-Call**: [Phone/Slack]
- **DevOps Lead**: [Contact]
- **Security**: [Contact]

---

## 💡 Pro Tips

1. **Run tests locally** before pushing
2. **Use pre-commit hooks** to catch issues early
3. **Tag E2E tests** with @quick for faster PRs
4. **Review CI logs** even when passing
5. **Keep PRs small** for faster reviews
6. **Write clear commit messages**
7. **Update docs** when changing features
8. **Monitor after deployment** for 30 min

---

## 📌 Checklist Templates

### Before Pushing

- [ ] Tests pass locally
- [ ] Linting clean
- [ ] No console.logs in production code
- [ ] Secrets not committed
- [ ] Documentation updated

### Before Merging PR

- [ ] All CI checks pass
- [ ] Code reviewed and approved
- [ ] Tests added for new features
- [ ] CHANGELOG updated (if significant)
- [ ] Breaking changes documented

### Before Production Deploy

- [ ] Tested on staging
- [ ] Team notified
- [ ] Database migrations reviewed
- [ ] Rollback plan ready
- [ ] Monitoring dashboards open

---

**Print this card and keep it handy! 📄**

**Full docs**: [`CI_CD_INDEX.md`](CI_CD_INDEX.md)
