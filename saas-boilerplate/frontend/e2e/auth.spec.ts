import { test, expect } from '@playwright/test'
import { verifyPageLoaded } from './helpers/auth'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login page from root', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/)
    await verifyPageLoaded(page)
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
  })

  test('should show validation for empty login form', async ({ page }) => {
    await page.goto('/login')
    await verifyPageLoaded(page)

    // Try to submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click()

    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toHaveAttribute('required')
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login')
    await verifyPageLoaded(page)

    await page.getByRole('link', { name: /sign up/i }).click()

    await expect(page).toHaveURL(/\/signup/)
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login')
    await verifyPageLoaded(page)

    await page.getByRole('link', { name: /forgot password/i }).click()

    await expect(page).toHaveURL(/\/forgot-password/)
    await verifyPageLoaded(page)
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()
  })

  test('should navigate back to login from signup', async ({ page }) => {
    await page.goto('/signup')
    await verifyPageLoaded(page)
    
    await page.getByRole('link', { name: /sign in/i }).click()
    
    await expect(page).toHaveURL(/\/login/)
    await verifyPageLoaded(page)
  })

  test('should display error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await verifyPageLoaded(page)

    await page.getByLabel(/^email$/i).fill('invalid@example.com')
    await page.getByLabel(/^password$/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for error message (adjust selector based on your actual error handling)
    await expect(page.locator('text=/unable to log in|failed/i')).toBeVisible({ timeout: 5000 })
  })

  test.describe('Signup Flow', () => {
    test('should show all required fields', async ({ page }) => {
      await page.goto('/signup')
      await verifyPageLoaded(page)
      
      await expect(page.getByLabel(/full name/i)).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/^password$/i)).toBeVisible()
    })

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/signup')
      await verifyPageLoaded(page)
      
      await page.getByLabel(/full name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/^password$/i).fill('short')
      
      await page.getByRole('button', { name: /sign up/i }).click()
      
      // Should show validation error for password length
      const passwordInput = page.getByLabel(/^password$/i)
      await expect(passwordInput).toHaveAttribute('minlength')
    })
  })

  test.describe('Password Reset Flow', () => {
    test('should submit forgot password form', async ({ page }) => {
      await page.goto('/forgot-password')
      await verifyPageLoaded(page)

      // Setup listener before clicking
      const responsePromise = page.waitForResponse(
        response =>
          response.url().includes('/password/reset/') &&
          response.status() >= 200 &&
          response.status() < 300
      )

      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByRole('button', { name: /send reset link/i }).click()
      await responsePromise  // Wait for API

      // Should show success message
      await expect(page.locator('text=/check your email|sent/i')).toBeVisible({ timeout: 5000 })
    })
  })
})
