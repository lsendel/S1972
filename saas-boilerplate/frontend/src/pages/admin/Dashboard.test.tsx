import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import AdminDashboard from './Dashboard'
import { mockApi } from '@/test/mocks/api'
import { CancelablePromise } from '@/api/generated/core/CancelablePromise'

vi.mock('@/api/config', async () => {
    const { mockApi } = await import('@/test/mocks/api')
    return { api: mockApi }
})

// Mock Chart.js components to avoid canvas errors
vi.mock('react-chartjs-2', () => ({
    Line: () => <div data-testid="line-chart">Line Chart</div>,
    Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
}))

const mockStats = {
    users: { total: 100, new_today: 5, new_this_week: 20, active_today: 50 },
    organizations: { total: 10, new_today: 1, new_this_week: 2 },
    subscriptions: { active: 8, trial: 2, cancelled: 1, new_today: 1 },
    revenue: { mrr: 1000, arr: 12000 },
}

describe('AdminDashboard Page', () => {
    it('renders stats and charts', async () => {
        mockApi.analytics.adminAnalyticsDashboardRetrieve.mockReturnValue(new CancelablePromise((resolve) => resolve(mockStats)));
        mockApi.analytics.adminAnalyticsTimeSeriesRetrieve.mockReturnValue(new CancelablePromise((resolve) => resolve([])));

        render(<AdminDashboard />)

        expect(await screen.findByText('100')).toBeInTheDocument() // Total Users
        expect(await screen.findByText('100')).toBeInTheDocument() // Total Users
        expect(screen.getAllByText('$1,000')[0]).toBeInTheDocument() // MRR
        expect(screen.getAllByTestId('line-chart')[0]).toBeInTheDocument()
    })
})
