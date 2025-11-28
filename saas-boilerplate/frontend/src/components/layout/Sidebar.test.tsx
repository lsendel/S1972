import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import Sidebar from './Sidebar'
import { MemoryRouter } from 'react-router-dom'

// Mock hooks
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ orgSlug: 'test-org' }),
    }
})

const mockOrganizations = [
    { id: '1', name: 'Test Org', slug: 'test-org' },
    { id: '2', name: 'Other Org', slug: 'other-org' },
]

vi.mock('@/hooks/useOrganization', () => ({
    useOrganizations: () => ({
        data: mockOrganizations,
    }),
}))

describe('Sidebar Component', () => {
    it('renders navigation links', () => {
        render(
            <MemoryRouter initialEntries={['/app/test-org']}>
                <Sidebar />
            </MemoryRouter>,
            { routeWrapper: false }
        )

        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Team')).toBeInTheDocument()
        expect(screen.getByText('Billing')).toBeInTheDocument()
    })

    it('renders organization switcher with current org', () => {
        render(
            <MemoryRouter initialEntries={['/app/test-org']}>
                <Sidebar />
            </MemoryRouter>,
            { routeWrapper: false }
        )

        expect(screen.getByText('Test Org')).toBeInTheDocument()
    })

    it('switches organization when clicked', async () => {
        render(
            <MemoryRouter initialEntries={['/app/test-org']}>
                <Sidebar />
            </MemoryRouter>,
            { routeWrapper: false }
        )

        const orgSwitcher = screen.getByText('Test Org')
        fireEvent.click(orgSwitcher)

        const otherOrgButton = await screen.findByText('Other Org')
        fireEvent.click(otherOrgButton)

        expect(mockNavigate).toHaveBeenCalledWith('/app/other-org')
    })
})
