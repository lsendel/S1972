import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Allow skipping the auto-started dev server when one is already running
const useExternalServer = process.env.PLAYWRIGHT_USE_EXTERNAL_SERVER === '1'

// Load E2E test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.e2e') })

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests on CI for stability */
  retries: process.env.CI ? 2 : 0,

  /* Worker configuration for parallel execution */
  workers: process.env.CI ? 2 : undefined,

  /* Maximum time one test can run for */
  timeout: 30 * 1000,

  /* Test expectations timeout */
  expect: {
    timeout: 5 * 1000,
  },

  /* Reporter configuration - use multiple reporters on CI */
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['github'],
        ['list'],
      ]
    : [['html', { open: 'never' }], ['list']],

  /* Global test setup/teardown */
  globalSetup: path.resolve(__dirname, './e2e/setup/global-setup.ts'),
  globalTeardown: undefined,

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace on first retry and on failure for debugging */
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    /* Screenshot on failure for debugging */
    screenshot: 'only-on-failure',

    /* Video capture on retry and failure */
    video: process.env.CI ? 'retain-on-failure' : 'off',

    /* Action and navigation timeouts */
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: useExternalServer
    ? undefined
    : {
        // Bind explicitly to localhost to avoid sandbox/permission issues on 0.0.0.0
        command: 'npm run dev -- --host 127.0.0.1 --port 5173',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        env: {
          VITE_USE_MSW: 'true',
        },
      },
})
