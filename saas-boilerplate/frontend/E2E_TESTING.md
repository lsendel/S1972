# E2E Testing Guide

This guide explains how to run end-to-end tests for the SaaS boilerplate frontend.

## Prerequisites

- Docker and Docker Compose running
- Node.js 20+ installed
- Backend services available

## Quick Start

### 1. Setup E2E Environment

The E2E tests require a running backend with test data. Use the setup script:

```bash
cd frontend
./scripts/setup-e2e.sh
```

This script will:
- Start Docker services (PostgreSQL, Redis, Django backend)
- Run database migrations
- Create a test user and organization
- Verify backend is responding

### 2. Run E2E Tests

```bash
npm run test:e2e          # Run all E2E tests (all browsers)
npm run test:e2e:chromium # Run tests in Chromium only
npm run test:e2e:ui       # Run tests with Playwright UI
npm run test:e2e:debug    # Run tests in debug mode
```

## Test Credentials

The setup script creates the following test account:

- **Email**: `test@example.com`
- **Password**: `testpassword123`
- **Organization**: Test Organization (`test-org`)
- **Role**: Owner

These credentials are defined in `.env.e2e` and can be customized.

## Environment Configuration

E2E tests use `.env.e2e` for configuration:

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000

# Test credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
TEST_ORG_SLUG=test-org
```

## Running Tests Locally

### Option 1: Use Docker Compose (Recommended)

```bash
# In saas-boilerplate/ directory
make up                    # Start all services
make seed                  # Create test data
cd frontend
npm run test:e2e
```

### Option 2: Manual Setup

```bash
# Terminal 1: Start backend
cd backend
python manage.py runserver

# Terminal 2: Run frontend E2E tests
cd frontend
npm run test:e2e
```

## Test Structure

```
frontend/e2e/
├── auth.spec.ts           # Authentication flow tests
├── dashboard.spec.ts      # Dashboard and organization tests
└── helpers/
    └── auth.ts            # Shared authentication helpers
```

### Helper Functions

- `loginAsTestUser(page)` - Authenticate as test user
- `logout(page)` - Sign out current user
- `createTestOrganization(page, name)` - Create a new org
- `setup2FA(page, code)` - Enable 2FA for user
- `verifyPageLoaded(page)` - Wait for page to finish loading

## Writing New E2E Tests

Example test:

```typescript
import { test, expect } from '@playwright/test'
import { loginAsTestUser, verifyPageLoaded } from './helpers/auth'

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('should display feature correctly', async ({ page }) => {
    await page.goto('/my-feature')
    await verifyPageLoaded(page)

    await expect(page.getByRole('heading', { name: /feature/i })).toBeVisible()
  })
})
```

## CI/CD Integration

E2E tests run automatically in GitHub Actions when:
- Pull requests modify frontend code
- Pushes to `main` or `develop` branches

The CI workflow:
1. Starts PostgreSQL and Redis services
2. Installs and sets up Django backend
3. Runs migrations and creates test data
4. Starts backend server
5. Runs Playwright E2E tests
6. Uploads test reports as artifacts

See `.github/workflows/frontend-ci.yml` for full configuration.

## Troubleshooting

### Backend not responding

```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Tests timing out

1. Increase timeout in `playwright.config.ts`
2. Check that backend is running: `curl http://localhost:8000/api/v1/health/`
3. Verify test user exists: `docker-compose exec backend python manage.py create_test_user`

### Database issues

```bash
# Reset database and recreate test data
docker-compose down -v
docker-compose up -d db redis backend
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py create_test_user
```

### Port conflicts

If port 8000 or 5432 is already in use:

```bash
# Find process using the port
lsof -i :8000

# Kill the process or change ports in docker-compose.yml
```

## Test Reports

Playwright generates HTML reports after test runs:

```bash
npx playwright show-report
```

Test artifacts (screenshots, videos) are saved in `test-results/`.

## Best Practices

1. **Use helpers**: Reuse authentication and navigation helpers
2. **Wait for elements**: Always use `waitFor` or `expect().toBeVisible()`
3. **Unique selectors**: Prefer role-based selectors over CSS
4. **Clean state**: Use `beforeEach` to reset state between tests
5. **Descriptive names**: Use clear test descriptions
6. **Avoid hardcoding**: Use environment variables for configuration

## Performance

- **Parallel execution**: Tests run in parallel by default
- **Browser selection**: Run only Chromium for faster local dev
- **Headless mode**: Set `HEADLESS=true` in `.env.e2e`
- **CI optimization**: GitHub Actions runs tests in parallel workers

## Debugging

```bash
# Run with UI mode for step-by-step debugging
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in headed mode (show browser)
npx playwright test --headed

# Generate trace for failed tests
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Debugging Guide](https://playwright.dev/docs/debug)
