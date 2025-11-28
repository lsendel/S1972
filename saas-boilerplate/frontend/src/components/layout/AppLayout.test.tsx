import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import AppLayout from './AppLayout'

// Mock children components
vi.mock('./Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }))
vi.mock('./Header', () => ({ default: () => <div data-testid="header">Header</div> }))

describe('AppLayout Component', () => {
    it('renders sidebar, header and outlet', () => {
        render(<AppLayout />)

        expect(screen.getByTestId('sidebar')).toBeInTheDocument()
        expect(screen.getByTestId('header')).toBeInTheDocument()
    })
})
