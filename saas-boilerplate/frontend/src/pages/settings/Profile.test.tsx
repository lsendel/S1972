import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import ProfileSettings from './Profile'
import { api } from '@/api/config'

const mockUser = {
    id: '1',
    email: 'test@example.com',
    full_name: 'Test User',
}

const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
}

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: mockUser,
    }),
}))

vi.mock('@/hooks/useToast', () => ({
    useToast: () => mockToast,
}))

vi.mock('@/api/config', () => ({
    api: {
        auth: {
            authMePartialUpdate: vi.fn(),
        }
    }
}))

describe('ProfileSettings Page', () => {
    it('renders profile form with user data', () => {
        render(<ProfileSettings />)

        expect(screen.getByLabelText(/full name/i)).toHaveValue('Test User')
        expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com')
        expect(screen.getByLabelText(/email/i)).toBeDisabled()
    })

    it('submits form', async () => {
        (api.auth.authMePartialUpdate as any).mockResolvedValue(mockUser)

        render(<ProfileSettings />)

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New Name' } })
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

        await waitFor(() => {
            expect(api.auth.authMePartialUpdate).toHaveBeenCalledWith({
                requestBody: {
                    full_name: 'New Name',
                }
            })
            expect(mockToast.success).toHaveBeenCalledWith('Your profile has been updated successfully.')
        })
    })
})
