import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import ActivityLogs from './ActivityLogs'
import { mockApi } from '@/test/mocks/api'
import { CancelablePromise } from '@/api/generated/core/CancelablePromise'

vi.mock('@/api/config', async () => {
    const { mockApi } = await import('@/test/mocks/api')
    return { api: mockApi }
})

const mockLogs = {
    results: [
        {
            id: '1',
            user_email: 'test@example.com',
            user_name: 'Test User',
            action: 'user.login',
            action_display: 'User Login',
            description: 'Logged in',
            ip_address: '127.0.0.1',
            created_at: '2024-01-01T00:00:00Z',
            metadata: {},
        }
    ],
    count: 1,
    next: null,
    previous: null,
}

describe('ActivityLogs Page', () => {
    it('renders logs table', async () => {
        mockApi.analytics.adminActivityLogsList.mockReturnValue(new CancelablePromise((resolve) => resolve(mockLogs)))

        render(<ActivityLogs />)

        expect(await screen.findByText('Test User')).toBeInTheDocument()
        expect(await screen.findByText('Test User')).toBeInTheDocument()
        expect(screen.getAllByText('User Login')[0]).toBeInTheDocument()
    })

    it('filters by action', async () => {
        mockApi.analytics.adminActivityLogsList.mockReturnValue(new CancelablePromise((resolve) => resolve(mockLogs)))

        render(<ActivityLogs />)

        const filterSelect = await screen.findByLabelText(/filter by action/i)
        fireEvent.change(filterSelect, { target: { value: 'user.login' } })

        await waitFor(() => {
            expect(mockApi.analytics.adminActivityLogsList).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'user.login' })
            )
        })
    })
})
