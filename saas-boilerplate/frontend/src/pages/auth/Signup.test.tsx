import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import Signup from './Signup'

const mockSignup = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        signup: mockSignup,
        isSigningUp: false,
    }),
}))

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

// Mock analytics modules
vi.mock('../../lib/analytics/utm', () => ({
    getFirstTouchUTM: vi.fn(() => ({})),
    getLastTouchUTM: vi.fn(() => ({})),
}))

vi.mock('../../lib/analytics', () => ({
    trackEvent: vi.fn(),
}))

vi.mock('../../lib/analytics/events', () => ({
    AnalyticsAuth: {
        signup: vi.fn(),
    },
}))

describe('Signup Page', () => {
    it('renders signup form', () => {
        render(<Signup />)

        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('submits form with valid data', async () => {
        mockSignup.mockResolvedValue({})
        render(<Signup />)

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
        fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })

        fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

        await waitFor(() => {
            expect(mockSignup).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                full_name: 'Test User',
            })
            expect(mockNavigate).toHaveBeenCalledWith('/login')
        })
    })

    it('displays error message on failure', async () => {
        mockSignup.mockRejectedValue(new Error('Signup failed'))
        render(<Signup />)

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
        fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })

        fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

        await waitFor(() => {
            expect(screen.getByText('Signup failed')).toBeInTheDocument()
        })
    })
})
