import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardLayout from '../layouts/DashboardLayout'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn()
}))

// Mock OrgSwitcher to avoid API calls in layout test
vi.mock('../components/OrgSwitcher', () => ({
    default: () => <div data-testid="org-switcher">Org Switcher</div>
}))

const queryClient = new QueryClient()

describe('DashboardLayout', () => {
  it('renders sidebar and content', () => {
    // Setup mock store
    ;(useAuthStore as any).mockReturnValue({
        user: { full_name: 'Test User', email: 'test@example.com' },
        logout: vi.fn()
    })

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <DashboardLayout />
        </BrowserRouter>
      </QueryClientProvider>
    )

    // Using getAllByText because SaaS App is in sidebar and mobile header
    expect(screen.getAllByText('SaaS App')[0]).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByTestId('org-switcher')).toBeInTheDocument()
  })
})
