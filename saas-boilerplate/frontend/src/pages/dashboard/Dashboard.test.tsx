import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { mockOrganization, mockUser } from '@/test/utils'
import Dashboard from './Dashboard'

// Mock the hooks
vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: vi.fn(() => ({
    data: mockOrganization,
    isLoading: false,
    error: null,
  })),
  useOrganizations: vi.fn(() => ({
    data: [mockOrganization],
    isLoading: false,
    error: null,
  })),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    isLoading: false,
  })),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ orgSlug: 'test-org' }),
  }
})

describe('Dashboard Page', () => {
  it('renders welcome message', () => {
    render(<Dashboard />)
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('displays organization name', () => {
    render(<Dashboard />)
    expect(screen.getByText(new RegExp(mockOrganization.name))).toBeInTheDocument()
  })

  it('shows team member count', () => {
    render(<Dashboard />)
    expect(screen.getByText(/team members/i)).toBeInTheDocument()
    expect(screen.getByText(mockOrganization.member_count.toString())).toBeInTheDocument()
  })

  it('shows user role', () => {
    render(<Dashboard />)
    expect(screen.getByText(/your role/i)).toBeInTheDocument()
    expect(screen.getByText(mockOrganization.role, { exact: false })).toBeInTheDocument()
  })

  it('shows number of organizations', () => {
    render(<Dashboard />)
    expect(screen.getByText(/organizations/i)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
