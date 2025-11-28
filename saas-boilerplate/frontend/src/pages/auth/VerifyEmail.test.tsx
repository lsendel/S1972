import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import VerifyEmail from './VerifyEmail'
import { api } from '@/api/config'

vi.mock('@/api/config', () => ({
    api: {
        auth: {
            authEmailVerifyCreate: vi.fn()
        }
    }
}))
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ token: 'valid-token' }),
    }
})

describe('VerifyEmail Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('verifies email successfully', async () => {
        (api.auth.authEmailVerifyCreate as any).mockResolvedValue({})
        render(<VerifyEmail />)

        expect(screen.getByText(/verifying your email/i)).toBeInTheDocument()

        await waitFor(() => {
            expect(api.auth.authEmailVerifyCreate).toHaveBeenCalledWith({ requestBody: { token: 'valid-token' } })
            expect(screen.getByText(/email verified/i)).toBeInTheDocument()
        })

        // Check redirect after timeout
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/onboarding')
        }, { timeout: 3000 })
    })

    it('shows error on failure', async () => {
        (api.auth.authEmailVerifyCreate as any).mockRejectedValue({ error: 'Invalid token' })
        render(<VerifyEmail />)

        await waitFor(() => {
            expect(screen.getByText(/verification failed/i)).toBeInTheDocument()
            expect(screen.getByText('Invalid token')).toBeInTheDocument()
        })
    })
})
