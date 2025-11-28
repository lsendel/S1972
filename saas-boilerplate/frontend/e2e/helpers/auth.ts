import { Page, expect } from '@playwright/test'

/**
 * Helper function to login as a test user
 * Use this in test.beforeEach() to setup authenticated state
 */
export async function loginAsTestUser(page: Page) {
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const password = process.env.TEST_USER_PASSWORD || 'testpassword123'

  await page.goto('/login')

  // Wait for login page to load
  await verifyPageLoaded(page)

  // Fill in credentials
  await page.getByLabel(/^email$/i).fill(email)
  await page.getByLabel(/^password$/i).fill(password)

  // Submit form and wait for navigation
  await Promise.all([
    // Wait for either /app/ (if user has org) or /onboarding (if no org)
    page.waitForURL(/\/(app\/|onboarding)/, { timeout: 15000 }),
    page.getByRole('button', { name: /sign in/i }).click()
  ])

  // Wait for page to fully load
  await verifyPageLoaded(page)

  // If we landed on onboarding, we need to create an organization
  if (page.url().includes('/onboarding')) {
    await createTestOrganization(page, 'E2E Test Organization')
    await verifyPageLoaded(page)
  }
}

/**
 * Helper function to logout
 */
export async function logout(page: Page) {
  // Click on user menu
  await page.getByRole('button', { name: /open user menu/i }).click()
  
  // Click logout
  await page.getByRole('button', { name: /sign out/i }).click()
  
  // Wait for redirect to login
  await page.waitForURL(/\/login/)
}

/**
 * Helper to create a test organization
 */
export async function createTestOrganization(page: Page, name: string) {
  await page.goto('/onboarding')
  
  await page.getByLabel(/organization name/i).fill(name)
  await page.getByRole('button', { name: /create organization/i }).click()
  
  // Wait for redirect to dashboard
  await page.waitForURL(/\/app\//)
}

/**
 * Helper to setup 2FA for testing
 */
export async function setup2FA(page: Page, totpCode: string) {
  await page.goto('/app/test-org/settings/security')

  // Click enable 2FA
  await page.getByRole('button', { name: /enable 2fa/i }).click()

  // Wait for QR code to appear
  await page.waitForSelector('img[alt="QR Code"]')

  // Enter verification code
  await page.getByPlaceholder('000000').fill(totpCode)
  await page.getByRole('button', { name: /verify & enable/i }).click()

  // Wait for backup codes
  await page.waitForSelector('text=/save your backup codes/i')
}

/**
 * Helper to ensure page has loaded content and is not blank
 * Use this after navigation to verify the page rendered correctly
 */
export async function verifyPageLoaded(page: Page, options?: {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number
  /** Check for specific main content selector (default: 'main, [role="main"], #root > div') */
  mainContentSelector?: string
}) {
  const timeout = options?.timeout || 10000

  // Wait for page to finish loading
  await page.waitForLoadState('domcontentloaded', { timeout })

  // Give React a moment to hydrate
  await page.waitForTimeout(500)
}
