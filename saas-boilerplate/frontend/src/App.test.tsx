import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import App from './App'

// Mock Sentry
vi.mock('./lib/sentry', () => ({
    initSentry: vi.fn(),
    setSentryUser: vi.fn(),
}))

// Mock components to avoid full rendering of pages
vi.mock('./pages/auth/Login', () => ({ default: () => <div>Login Page</div> }))
vi.mock('./pages/auth/Signup', () => ({ default: () => <div>Signup Page</div> }))
vi.mock('./pages/dashboard/Dashboard', () => ({ default: () => <div>Dashboard Page</div> }))
vi.mock('./pages/admin/Dashboard', () => ({ default: () => <div>Admin Dashboard Page</div> }))
vi.mock('./pages/onboarding/CreateOrganization', () => ({ default: () => <div>Onboarding Page</div> }))

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('./hooks/useAuth', () => ({
    useAuth: () => mockUseAuth()
}))

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders login page by default when not authenticated', async () => {
        mockUseAuth.mockReturnValue({
            user: null,
            isLoading: false,
        })

        render(<App />, { routeWrapper: false })

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument()
        })
    })

    it('renders loading skeleton when authenticating', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            isLoading: true,
        })

        // We need to test a protected route to see the loading skeleton
        // Since App handles routing, we can't easily force it to a protected route without manipulating history
        // and App's internal Router responding to it.
        window.history.pushState({}, 'App', '/app/test-org')

        render(<App />, { routeWrapper: false })

        // Now we expect NOT to see Login Page, and potentially see something else or just nothing if skeleton is simple
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
    })

    it('redirects to onboarding when authenticated but no org', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: '1', email: 'test@example.com' },
            isLoading: false,
        })

        // We need to mock the URL to be /app or / to trigger the redirect logic
        // But App uses BrowserRouter which uses window.location.
        // Testing redirects inside BrowserRouter is harder without memory router.
        // However, App renders BrowserRouter, so we are stuck with it.
        // We can try to manipulate window.history.pushState
        window.history.pushState({}, 'App', '/app')

        render(<App />, { routeWrapper: false })

        await waitFor(() => {
            expect(screen.getByText('Onboarding Page')).toBeInTheDocument()
        })
    })
})
