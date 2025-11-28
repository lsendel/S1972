import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import AdminLayout from './AdminLayout'
import { Route, Routes, MemoryRouter } from 'react-router-dom'
import * as useAuthHook from '@/hooks/useAuth'

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}))

describe('AdminLayout', () => {
    it('redirects to login if not superuser', () => {
        (useAuthHook.useAuth as any).mockReturnValue({
            user: { is_superuser: false },
        })

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route path="/admin" element={<AdminLayout />} />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>,
            { routeWrapper: false }
        )

        expect(screen.getByText('Login Page')).toBeInTheDocument()
    })

    it('renders layout if superuser', () => {
        (useAuthHook.useAuth as any).mockReturnValue({
            user: { is_superuser: true },
        })

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<div>Admin Dashboard</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
            { routeWrapper: false }
        )

        expect(screen.getByText('Admin Portal')).toBeInTheDocument()
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })

    it('highlights active link', () => {
        (useAuthHook.useAuth as any).mockReturnValue({
            user: { is_superuser: true },
        })

        render(
            <MemoryRouter initialEntries={['/admin/users']}>
                <Routes>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route path="users" element={<div>Users Page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
            { routeWrapper: false }
        )

        const usersLink = screen.getByRole('link', { name: /users/i })
        expect(usersLink).toHaveClass('bg-primary/10')
        expect(usersLink).toHaveClass('text-primary')
    })
})
