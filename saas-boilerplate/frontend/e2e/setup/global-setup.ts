import { chromium, FullConfig } from '@playwright/test'

/**
 * Global setup for E2E tests.
 * Runs once before all tests to prepare the test environment.
 */
async function globalSetup(config: FullConfig) {
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000'
  const testUserEmail = process.env.TEST_USER_EMAIL || 'test@example.com'
  const testUserPassword = process.env.TEST_USER_PASSWORD || 'testpassword123'

  console.log('🔧 E2E Global Setup: Creating test user...')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Check if backend is available
    const healthResponse = await page.request.get(`${apiUrl}/api/v1/health/`)
    if (!healthResponse.ok()) {
      throw new Error(
        `Backend not available at ${apiUrl}. Status: ${healthResponse.status()}`
      )
    }
    console.log('✅ Backend is available')

    // Get CSRF token
    const csrfResponse = await page.request.get(`${apiUrl}/api/v1/auth/csrf/`, {
      headers: { Accept: 'application/json' },
    })
    const csrfData = await csrfResponse.json()
    const csrfToken = csrfData.csrfToken

    // Try to signup the test user (will fail if user already exists, which is fine)
    const signupResponse = await page.request.post(`${apiUrl}/api/v1/auth/signup/`, {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      data: {
        email: testUserEmail,
        password: testUserPassword,
        full_name: 'E2E Test User',
      },
    })

    if (signupResponse.ok()) {
      console.log('✅ Test user created successfully')
    } else if (signupResponse.status() === 400) {
      // User likely already exists, try to login
      console.log('ℹ️  Test user already exists (trying to login)')

      const loginResponse = await page.request.post(`${apiUrl}/api/v1/auth/login/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        data: {
          email: testUserEmail,
          password: testUserPassword,
        },
      })

      if (loginResponse.ok()) {
        console.log('✅ Test user login successful')
      } else {
        console.warn('⚠️  Could not login test user. Tests will create user on first run.')
      }
    } else {
      console.warn('⚠️  Could not create test user. Tests will handle user creation.')
    }
  } catch (error) {
    console.error('❌ E2E Setup Error:', error)
    console.log('⚠️  Continuing anyway - tests will handle user creation')
  } finally {
    await context.close()
    await browser.close()
  }

  console.log('✅ E2E Global Setup Complete\n')
}

export default globalSetup
