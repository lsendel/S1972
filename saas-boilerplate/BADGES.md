# GitHub Actions Status Badges

Add these badges to your README.md to show CI/CD status at a glance.

## How to Add Badges

Copy the markdown below and paste it at the top of your `README.md` file.

**Replace**:
- `YOUR_ORG` with your GitHub organization/username
- `YOUR_REPO` with your repository name

---

## Badge Templates

### Full Badge Set

```markdown
# Your Project Name

[![Backend CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/frontend-ci.yml)
[![Container Build](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/container-build.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/container-build.yml)
[![Deploy](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/YOUR_ORG/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_ORG/YOUR_REPO)
```

### Minimal Badge Set

```markdown
# Your Project Name

[![CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions)
[![Deploy](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/deployments)
```

### With Custom Styling

```markdown
# Your Project Name

![Backend CI](https://img.shields.io/github/actions/workflow/status/YOUR_ORG/YOUR_REPO/backend-ci.yml?branch=main&label=backend&logo=python)
![Frontend CI](https://img.shields.io/github/actions/workflow/status/YOUR_ORG/YOUR_REPO/frontend-ci.yml?branch=main&label=frontend&logo=react)
![Security](https://img.shields.io/github/actions/workflow/status/YOUR_ORG/YOUR_REPO/container-build.yml?branch=main&label=security&logo=github)
```

---

## Additional Badges

### Code Coverage

```markdown
[![codecov](https://codecov.io/gh/YOUR_ORG/YOUR_REPO/branch/main/graph/badge.svg?token=YOUR_TOKEN)](https://codecov.io/gh/YOUR_ORG/YOUR_REPO)
```

### License

```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

### Version

```markdown
[![Version](https://img.shields.io/github/v/release/YOUR_ORG/YOUR_REPO)](https://github.com/YOUR_ORG/YOUR_REPO/releases)
```

### Last Commit

```markdown
[![Last Commit](https://img.shields.io/github/last-commit/YOUR_ORG/YOUR_REPO)](https://github.com/YOUR_ORG/YOUR_REPO/commits/main)
```

### Issues

```markdown
[![Issues](https://img.shields.io/github/issues/YOUR_ORG/YOUR_REPO)](https://github.com/YOUR_ORG/YOUR_REPO/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/YOUR_ORG/YOUR_REPO/pulls)
```

### Security

```markdown
[![Security Rating](https://img.shields.io/github/actions/workflow/status/YOUR_ORG/YOUR_REPO/container-build.yml?branch=main&label=security)](https://github.com/YOUR_ORG/YOUR_REPO/security)
```

---

## Complete Example

```markdown
# SaaS Boilerplate

> Production-ready SaaS application with Django + React

[![Backend CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/frontend-ci.yml)
[![Container Build](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/container-build.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/container-build.yml)
[![Deploy](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/YOUR_ORG/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_ORG/YOUR_REPO)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack SaaS boilerplate with multi-tenancy, subscriptions, and comprehensive CI/CD.

## Features

- 🚀 **Fast CI/CD** - < 5 minute feedback on PRs
- 🔒 **Security First** - Automated scanning and SBOM generation
- 📦 **Container Ready** - Docker images with vulnerability scanning
- ✅ **Well Tested** - Unit, integration, and E2E tests
- 🌍 **Production Ready** - Automated staging and production deployments

## Quick Start

...
```

---

## Customization

### Colors

Change badge colors using the `color` parameter:

```markdown
![Status](https://img.shields.io/badge/status-production-green)
![Status](https://img.shields.io/badge/status-beta-blue)
![Status](https://img.shields.io/badge/status-alpha-yellow)
![Status](https://img.shields.io/badge/status-deprecated-red)
```

### Logos

Add logos using the `logo` parameter:

```markdown
![Python](https://img.shields.io/badge/python-3.12-blue?logo=python)
![Node](https://img.shields.io/badge/node-20-green?logo=node.js)
![Docker](https://img.shields.io/badge/docker-ready-blue?logo=docker)
![PostgreSQL](https://img.shields.io/badge/postgresql-17-blue?logo=postgresql)
```

### Grouped Badges

Group related badges in tables:

```markdown
| CI/CD | Coverage | Security |
|-------|----------|----------|
| [![CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions) | [![codecov](https://codecov.io/gh/YOUR_ORG/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_ORG/YOUR_REPO) | [![Security](https://img.shields.io/badge/security-scan-green)](https://github.com/YOUR_ORG/YOUR_REPO/security) |
```

---

## Badge Services

### Shields.io

- **Website**: https://shields.io
- **Docs**: https://shields.io/badges
- **Custom badges**: https://shields.io/badges/static-badge

### Codecov

- **Website**: https://codecov.io
- **Setup**: https://docs.codecov.com/docs/github-tutorial

### GitHub Actions

- **Built-in**: No setup required
- **Format**: `https://github.com/ORG/REPO/actions/workflows/WORKFLOW.yml/badge.svg`

---

## Tips

1. **Keep it minimal** - Too many badges can be overwhelming
2. **Link to details** - Make badges clickable to relevant pages
3. **Update regularly** - Remove badges for deprecated features
4. **Test badges** - Click through to verify links work
5. **Use alt text** - Helps with accessibility

---

## Troubleshooting

### Badge shows "unknown" or "no status"

**Cause**: Workflow hasn't run yet or workflow name is incorrect

**Fix**:
1. Verify workflow file name in `.github/workflows/`
2. Trigger workflow by creating a commit
3. Check badge URL matches workflow filename exactly

### Badge shows old status

**Cause**: Badge caching

**Fix**:
1. GitHub badge caches are short (~5 minutes)
2. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
3. Clear browser cache if persistent

### Badge shows "failing" but workflow passed

**Cause**: Badge showing wrong branch

**Fix**: Specify branch in badge URL:
```markdown
[![CI](https://github.com/ORG/REPO/actions/workflows/ci.yml/badge.svg?branch=main)](...)
```

---

## Resources

- [GitHub Actions Badge Documentation](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge)
- [Shields.io Badge Builder](https://shields.io)
- [Simple Icons for Logos](https://simpleicons.org)
- [Markdown Badge Guide](https://github.com/Ileriayo/markdown-badges)

---

**Pro Tip**: Use GitHub's automatic badge generator:
1. Go to Actions tab
2. Click on a workflow
3. Click "..." menu → "Create status badge"
4. Copy the generated markdown
