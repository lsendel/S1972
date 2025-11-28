# E2E Tests with Playwright

This directory contains end-to-end tests for the SaaS platform using Playwright.

## Setup

Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in headed mode
npx playwright test --headed

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

```
e2e/
├── auth.spec.ts          # Authentication flow tests
├── dashboard.spec.ts     # Dashboard and org tests
├── helpers/
│   └── auth.ts          # Authentication helpers
└── README.md
```

## Writing Tests

### Basic Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should navigate to dashboard', async ({ page }) => {
  await page.goto('/app/my-org')
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
})
```

### Using Authentication Helper

```typescript
import { test } from '@playwright/test'
import { loginAsTestUser } from './helpers/auth'

test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page)
})

test('authenticated test', async ({ page }) => {
  // User is already logged in
  await page.goto('/app/my-org')
  // ... test code
})
```

## Environment Variables

For authenticated tests, set these environment variables:

```bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Debugging

1. **UI Mode** - Best for development:
   ```bash
   npm run test:e2e:ui
   ```

2. **Debug Mode** - Step through tests:
   ```bash
   npm run test:e2e:debug
   ```

3. **Trace Viewer** - View traces of failed tests:
   ```bash
   npx playwright show-trace trace.zip
   ```

## CI/CD Integration

Tests are configured to run in CI with:
- Retry on failure (2 retries)
- Sequential execution
- HTML reporter
- Traces on first retry

## Best Practices

1. **Use data-testid for dynamic content**
   ```typescript
   await page.getByTestId('user-menu').click()
   ```

2. **Wait for specific conditions**
   ```typescript
   await page.waitForURL(/dashboard/)
   await page.waitForLoadState('networkidle')
   ```

3. **Use descriptive test names**
   ```typescript
   test('should show error when password is too short', ...)
   ```

4. **Group related tests**
   ```typescript
   test.describe('Team Settings', () => {
     // related tests
   })
   ```

5. **Clean up after tests**
   ```typescript
   test.afterEach(async ({ page }) => {
     // cleanup code
   })
   ```

## Troubleshooting

**Tests timing out?**
- Increase timeout in playwright.config.ts
- Check if dev server is running
- Verify baseURL is correct

**Authentication failing?**
- Check TEST_USER_EMAIL and TEST_USER_PASSWORD
- Ensure test user exists in database
- Verify login endpoint is working

**Elements not found?**
- Use Playwright Inspector: `npm run test:e2e:debug`
- Check if element is visible
- Wait for element to appear: `await page.waitForSelector('...')`
