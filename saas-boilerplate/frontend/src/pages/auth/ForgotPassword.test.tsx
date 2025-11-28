import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import ForgotPassword from './ForgotPassword'
import { api } from '@/api/config'

vi.mock('@/api/config', () => ({
    api: {
        auth: {
            authPasswordResetCreate: vi.fn()
        }
    }
}))

describe('ForgotPassword Page', () => {
    it('renders form', () => {
        render(<ForgotPassword />)
        expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
    })

    it('submits form and shows success message', async () => {
        (api.auth.authPasswordResetCreate as any).mockResolvedValue({})
        render(<ForgotPassword />)

        fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), { target: { value: 'test@example.com' } })
        fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

        await waitFor(() => {
            expect(api.auth.authPasswordResetCreate).toHaveBeenCalledWith({ requestBody: { email: 'test@example.com' } })
            expect(screen.getByText(/check your email/i)).toBeInTheDocument()
        })
    })

    it('displays error on failure', async () => {
        (api.auth.authPasswordResetCreate as any).mockRejectedValue({ body: { error: 'Email not found' } })
        render(<ForgotPassword />)

        fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), { target: { value: 'test@example.com' } })
        fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

        await waitFor(() => {
            expect(screen.getByText('Email not found')).toBeInTheDocument()
        })
    })
})
