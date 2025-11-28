import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import SecuritySettings from './Security'
import { api } from '@/api/config'

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

vi.mock('@/api/config', () => ({
    api: {
        auth: {
            authPasswordChangeCreate: vi.fn(),
        }
    }
}))
vi.mock('@/components/TwoFactorAuth', () => ({ default: () => <div>TwoFactorAuth Component</div> }))
vi.mock('@/components/OAuthConnections', () => ({ default: () => <div>OAuthConnections Component</div> }))

describe('SecuritySettings Page', () => {
    it('renders password change form', () => {
        render(<SecuritySettings />)

        expect(screen.getByLabelText(/^current password$/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
        expect(screen.getByText('TwoFactorAuth Component')).toBeInTheDocument()
        expect(screen.getByText('OAuthConnections Component')).toBeInTheDocument()
    })

    it('changes password successfully', async () => {
        (api.auth.authPasswordChangeCreate as any).mockResolvedValue({})

        render(<SecuritySettings />)

        fireEvent.change(screen.getByLabelText(/^current password$/i), { target: { value: 'oldpass' } })
        fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpass123' } })
        fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpass123' } })

        fireEvent.click(screen.getByRole('button', { name: /change password/i }))

        await waitFor(() => {
            expect(api.auth.authPasswordChangeCreate).toHaveBeenCalledWith({
                requestBody: {
                    old_password: 'oldpass',
                    new_password: 'newpass123',
                }
            })
            expect(mockToast.success).toHaveBeenCalledWith('Password changed successfully')
        })
    })

    it('validates password mismatch', async () => {
        render(<SecuritySettings />)

        fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpass123' } })
        fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'mismatch' } })

        fireEvent.click(screen.getByRole('button', { name: /change password/i }))

        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
        })
    })
})
