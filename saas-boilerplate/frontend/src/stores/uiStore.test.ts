import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './uiStore'

describe('UI Store', () => {
    beforeEach(() => {
        useUIStore.setState({ sidebarOpen: false })
    })

    it('toggles sidebar', () => {
        expect(useUIStore.getState().sidebarOpen).toBe(false)

        useUIStore.getState().toggleSidebar()
        expect(useUIStore.getState().sidebarOpen).toBe(true)

        useUIStore.getState().toggleSidebar()
        expect(useUIStore.getState().sidebarOpen).toBe(false)
    })

    it('closes sidebar', () => {
        useUIStore.setState({ sidebarOpen: true })
        expect(useUIStore.getState().sidebarOpen).toBe(true)

        useUIStore.getState().closeSidebar()
        expect(useUIStore.getState().sidebarOpen).toBe(false)
    })
})
