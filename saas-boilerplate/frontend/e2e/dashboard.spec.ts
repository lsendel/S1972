import { test, expect } from '@playwright/test'
import { loginAsTestUser, verifyPageLoaded } from './helpers/auth'

const orgSlug = process.env.TEST_ORG_SLUG || 'test-org'

test.describe('Dashboard and Organization Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user before each test
    await loginAsTestUser(page)
  })

  test.describe('Dashboard', () => {
    test('should display organization information', async ({ page }) => {
      await page.goto(`/app/${orgSlug}`)
      await verifyPageLoaded(page)

      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
      await expect(page.getByText(/team members/i)).toBeVisible()
      await expect(page.getByText(/your role/i)).toBeVisible()
    })

    test('should show organization switcher', async ({ page }) => {
      await page.goto(`/app/${orgSlug}`)

      // Look for organization name in sidebar
      const sidebar = page.locator('aside, nav, [role="navigation"]')
      await expect(sidebar).toBeVisible()
    })
  })

  test.describe('Settings Navigation', () => {
    test('should navigate to profile settings', async ({ page }) => {
      await page.goto(`/app/${orgSlug}`)
      await page.getByRole('link', { name: /profile/i }).click()

      await expect(page).toHaveURL(/\/settings\/profile/)
      await expect(page.getByRole('heading', { name: /profile settings/i })).toBeVisible()
    })

    test('should navigate to security settings', async ({ page }) => {
      await page.goto(`/app/${orgSlug}`)
      await page.getByRole('link', { name: /security/i }).click()

      await expect(page).toHaveURL(/\/settings\/security/)
      await expect(page.getByRole('heading', { name: /security settings/i })).toBeVisible()
    })

    test('should navigate to team settings', async ({ page }) => {
      await page.goto(`/app/${orgSlug}`)
      await page.getByRole('link', { name: /team/i }).click()

      await expect(page).toHaveURL(/\/settings\/team/)
      await expect(page.getByRole('heading', { name: /team settings/i })).toBeVisible()
    })

    test('should navigate to billing settings', async ({ page }) => {
      await page.goto(`/app/${orgSlug}`)
      await page.getByRole('link', { name: /billing/i }).click()

      await expect(page).toHaveURL(/\/settings\/billing/)
      await expect(page.getByRole('heading', { name: /billing/i })).toBeVisible()
    })
  })

  test.describe('Team Management', () => {
    test('should show invite member form', async ({ page }) => {
      await page.goto(`/app/${orgSlug}/settings/team`)

      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /invite/i })).toBeVisible()
    })

    test('should validate email for team invitation', async ({ page }) => {
      await page.goto(`/app/${orgSlug}/settings/team`)

      const emailInput = page.getByLabel(/email/i).first()
      await emailInput.fill('invalid-email')

      await page.getByRole('button', { name: /invite/i }).first().click()

      // HTML5 validation should prevent submission
      await expect(emailInput).toHaveAttribute('type', 'email')
    })
  })

  test.describe('Security Settings', () => {
    test('should show password change form', async ({ page }) => {
      const orgSlug = process.env.TEST_ORG_SLUG || 'test-org'
      await page.goto(`/app/${orgSlug}/settings/security`)

      await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible()
      await expect(page.getByLabel(/current password/i)).toBeVisible()
      await expect(page.getByLabel(/new password/i)).toBeVisible()
    })

    test('should show 2FA section', async ({ page }) => {
      const orgSlug = process.env.TEST_ORG_SLUG || 'test-org'
      await page.goto(`/app/${orgSlug}/settings/security`)

      await expect(page.getByRole('heading', { name: /two-factor authentication/i })).toBeVisible()
    })

    test('should show OAuth connections', async ({ page }) => {
      const orgSlug = process.env.TEST_ORG_SLUG || 'test-org'
      await page.goto(`/app/${orgSlug}/settings/security`)

      await expect(page.getByRole('heading', { name: /connected accounts/i })).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should show 404 page for non-existent routes', async ({ page }) => {
      await page.goto('/this-route-does-not-exist')
      
      await expect(page.getByText(/404|not found/i)).toBeVisible()
    })

    test('should have go home button on error page', async ({ page }) => {
      await page.goto('/this-route-does-not-exist')
      
      const goHomeButton = page.getByRole('button', { name: /go home/i })
      await expect(goHomeButton).toBeVisible()
      
      await goHomeButton.click()
      await expect(page).toHaveURL(/\//)
    })
  })
})
