import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import TeamSettings from './Team'
import { mockApi } from '@/test/mocks/api'
import { CancelablePromise } from '@/api/generated/core/CancelablePromise'

const { mockToast } = vi.hoisted(() => {
    return {
        mockToast: {
            success: vi.fn(),
            error: vi.fn(),
        }
    }
})

vi.mock('@/hooks/useToast', () => ({
    useToast: () => mockToast,
}))

vi.mock('@/api/config', async () => {
    const { mockApi } = await import('@/test/mocks/api')
    return { api: mockApi }
})

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useParams: () => ({ orgSlug: 'test-org' }),
    }
})

const mockMembers = [
    { id: '1', user_full_name: 'Member One', user_email: 'one@example.com', role: 'owner' },
    { id: '2', user_full_name: 'Member Two', user_email: 'two@example.com', role: 'member' },
]

const mockInvitations = [
    { id: 'inv1', email: 'invited@example.com', role: 'member', invited_by_email: 'owner@example.com' },
]

describe('TeamSettings Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders members and invitations', async () => {
        mockApi.organizations.organizationsMembersList.mockReturnValue(new CancelablePromise((resolve) => resolve(mockMembers)))
        mockApi.organizations.organizationsInvitationsList.mockReturnValue(new CancelablePromise((resolve) => resolve(mockInvitations)))

        render(<TeamSettings />)

        await waitFor(() => {
            expect(screen.getByText('Member One')).toBeInTheDocument()
            expect(screen.getByText('invited@example.com')).toBeInTheDocument()
        })
    })

    it('invites a new member', async () => {
        mockApi.organizations.organizationsMembersList.mockReturnValue(new CancelablePromise((resolve) => resolve([])))
        mockApi.organizations.organizationsInvitationsList.mockReturnValue(new CancelablePromise((resolve) => resolve([])))
        mockApi.organizations.organizationsMembersInviteCreate.mockReturnValue(new CancelablePromise((resolve) => resolve({})))

        render(<TeamSettings />)

        // Open invite form
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /invite member/i })).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole('button', { name: /invite member/i }))

        // Fill form
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } })
        fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'admin' } })

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Invite' }))

        await waitFor(() => {
            expect(mockApi.organizations.organizationsMembersInviteCreate).toHaveBeenCalledWith({
                organizationSlug: 'test-org',
                requestBody: {
                    email: 'new@example.com',
                    role: 'admin',
                }
            })
        })
    })

    it('shows error message when invitation fails', async () => {
        mockApi.organizations.organizationsMembersList.mockReturnValue(new CancelablePromise((resolve) => resolve([])))
        mockApi.organizations.organizationsInvitationsList.mockReturnValue(new CancelablePromise((resolve) => resolve([])))

        mockApi.organizations.organizationsMembersInviteCreate.mockImplementation(() => new CancelablePromise((_, reject) => reject({ body: { error: 'Failed to invite' } })))

        render(<TeamSettings />)

        // Open invite form
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /invite member/i })).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole('button', { name: /invite member/i }))

        // Fill form
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'fail@example.com' } })

        // Submit
        fireEvent.click(screen.getByRole('button', { name: 'Invite' }))

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('Failed to invite')
        })
    })

    it('cancels invitation form', async () => {
        mockApi.organizations.organizationsMembersList.mockReturnValue(new CancelablePromise((resolve) => resolve([])))
        mockApi.organizations.organizationsInvitationsList.mockReturnValue(new CancelablePromise((resolve) => resolve([])))

        render(<TeamSettings />)

        // Open invite form
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /invite member/i })).toBeInTheDocument()
        })
        fireEvent.click(screen.getByRole('button', { name: /invite member/i }))

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()

        // Cancel
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

        await waitFor(() => {
            expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
            expect(screen.getByRole('button', { name: /invite member/i })).toBeInTheDocument()
        })
    })
})
