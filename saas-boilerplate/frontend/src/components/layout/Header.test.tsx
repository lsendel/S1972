import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import Header from './Header'

// Mock useAuth
const mockLogout = vi.fn()
const mockUser = {
    id: '1',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
}

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: mockUser,
        logout: mockLogout,
    }),
}))

describe('Header Component', () => {
    it('renders user profile info', () => {
        render(<Header />)
        expect(screen.getByText('Test User')).toBeInTheDocument()
        // Image with alt="" is presentational (role="presentation"), so query by element
        const img = document.querySelector('img[src="https://example.com/avatar.jpg"]')
        expect(img).toBeInTheDocument()
    })

    it('opens dropdown and shows sign out button', async () => {
        render(<Header />)

        const menuButton = screen.getByRole('button', { name: /open user menu/i })
        fireEvent.click(menuButton)

        const signOutButton = await screen.findByText(/sign out/i)
        expect(signOutButton).toBeInTheDocument()
    })

    it('calls logout when sign out is clicked', async () => {
        render(<Header />)

        const menuButton = screen.getByRole('button', { name: /open user menu/i })
        fireEvent.click(menuButton)

        const signOutButton = await screen.findByText(/sign out/i)
        fireEvent.click(signOutButton)

        expect(mockLogout).toHaveBeenCalled()
    })
})
