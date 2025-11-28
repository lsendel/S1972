import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@/test/utils'
import BillingSettings from './Billing'

vi.mock('@/api/subscriptions', () => ({
  subscriptionsApi: {
    getCurrent: vi.fn(),
    getPlans: vi.fn(),
    createCheckoutSession: vi.fn(),
    createBillingPortalSession: vi.fn(),
  },
}))

vi.mock('@/api/config', () => ({
  api: {
    organizations: {
      organizationsRetrieve: vi.fn(),
    },
  },
  API_BASE_URL: 'http://localhost:8000',
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ orgSlug: 'test-org' }),
  }
})

const { subscriptionsApi } = await import('@/api/subscriptions')
const { api } = await import('@/api/config')

const mockSubscription = {
  plan_details: { id: 'pro', name: 'Pro Plan' },
  status: 'active',
  billing_cycle: 'monthly',
}

const mockPlans = [
  { id: 'starter', name: 'Starter', price_monthly: '10', price_yearly: '100', features: ['Feature 1'] },
  { id: 'pro', name: 'Pro', price_monthly: '20', price_yearly: '200', features: ['Feature 2'] },
]

function renderWithProviders(search: string = '') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/app/test-org/settings/billing${search}`]}>
        <BillingSettings />
      </MemoryRouter>
    </QueryClientProvider>,
    { routeWrapper: false },
  )
}

describe('BillingSettings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(subscriptionsApi.getCurrent as any).mockResolvedValue(mockSubscription)
    ;(subscriptionsApi.getPlans as any).mockResolvedValue(mockPlans)
    ;(subscriptionsApi.createCheckoutSession as any).mockResolvedValue({ checkout_url: 'https://checkout' })
    ;(subscriptionsApi.createBillingPortalSession as any).mockResolvedValue({ portal_url: 'https://portal' })
    ;(api.organizations.organizationsRetrieve as any).mockResolvedValue({ slug: 'test-org', role: 'owner' })
  })

  it('renders subscription details and plans for owners', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getAllByText('Pro Plan')[0]).toBeInTheDocument()
    })

    expect(screen.getByText(/active/i)).toBeInTheDocument()
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText(/\\$10/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /manage/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /choose monthly/i })).toBeEnabled()
  })

  it('hides manage and upgrade actions for non-owners', async () => {
    ;(api.organizations.organizationsRetrieve as any).mockResolvedValue({ slug: 'test-org', role: 'member' })
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getAllByText('Pro Plan')[0]).toBeInTheDocument()
    })

    expect(screen.getByText(/owners can manage/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /manage/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /owner access required/i })[0]).toBeDisabled()
  })

  it('shows success banner from checkout redirect', async () => {
    renderWithProviders('?status=success')

    await waitFor(() => {
      expect(screen.getByText(/payment succeeded/i)).toBeInTheDocument()
    })
  })

  it('shows past due warning when subscription is past_due', async () => {
    ;(subscriptionsApi.getCurrent as any).mockResolvedValue({
      ...mockSubscription,
      status: 'past_due',
    })
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText(/past due/i)).toBeInTheDocument()
    })
  })
})
