import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import SettingsLayout from './SettingsLayout'
import { Route, Routes } from 'react-router-dom'

describe('SettingsLayout', () => {
    it('renders outlet content', () => {
        render(
            <Routes>
                <Route element={<SettingsLayout />}>
                    <Route path="/" element={<div>Settings Content</div>} />
                </Route>
            </Routes>
        )

        expect(screen.getByText('Settings Content')).toBeInTheDocument()
    })
})
