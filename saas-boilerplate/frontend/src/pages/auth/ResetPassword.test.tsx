import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import ResetPassword from './ResetPassword'
import { api } from '@/api/config'

vi.mock('@/api/config', () => ({
    api: {
        auth: {
            authPasswordResetConfirmCreate: vi.fn()
        }
    }
}))
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ uid: 'valid-uid', token: 'valid-token' }),
    }
})

describe('ResetPassword Page', () => {
    it('renders form', () => {
        render(<ResetPassword />)
        expect(screen.getByPlaceholderText(/^new password$/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/confirm new password/i)).toBeInTheDocument()
    })

    it('submits form and navigates to login', async () => {
        (api.auth.authPasswordResetConfirmCreate as any).mockResolvedValue({})
        render(<ResetPassword />)

        fireEvent.change(screen.getByPlaceholderText(/^new password$/i), { target: { value: 'password123' } })
        fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'password123' } })
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

        await waitFor(() => {
            expect(api.auth.authPasswordResetConfirmCreate).toHaveBeenCalledWith({
                requestBody: {
                    token: 'valid-token',
                    uid: 'valid-uid',
                    new_password: 'password123',
                }
            })
            expect(mockNavigate).toHaveBeenCalledWith('/login?reset=success')
        })
    })

    it('validates password match', async () => {
        render(<ResetPassword />)

        fireEvent.change(screen.getByPlaceholderText(/^new password$/i), { target: { value: 'password123' } })
        fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'mismatch' } })
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
        })
    })
})
