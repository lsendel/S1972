import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'

import { api } from '@/api/config'
import OAuthConnections from './OAuthConnections'

// Mock the API client
vi.mock('@/api/config', () => ({
  api: {
    auth: {
      authOauthProvidersRetrieve: vi.fn(),
      authOauthAccountsRetrieve: vi.fn(),
      authOauthAuthorizeRetrieve: vi.fn(),
      authOauthDisconnectCreate: vi.fn(),
    }
  }
}))

// Mock window.location
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock window.confirm
window.confirm = vi.fn()

describe('OAuthConnections Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  describe('Rendering providers', () => {
    it('displays available providers', async () => {
      (api.auth.authOauthProvidersRetrieve as any).mockResolvedValue({
        providers: [
          { provider: 'google', name: 'Google', connected: false },
          { provider: 'github', name: 'GitHub', connected: true },
        ]
      })
        ; (api.auth.authOauthAccountsRetrieve as any).mockResolvedValue({ accounts: [] })

      render(<OAuthConnections />)

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
        expect(screen.getByText('GitHub')).toBeInTheDocument()
      })
    })
  })

  describe('When no providers are configured', () => {
    beforeEach(() => {
      (api.auth.authOauthProvidersRetrieve as any).mockResolvedValue({ providers: [] })
        ; (api.auth.authOauthAccountsRetrieve as any).mockResolvedValue({ accounts: [] })
    })

    it('shows no providers message', async () => {
      render(<OAuthConnections />)

      await waitFor(() => {
        expect(
          screen.getByText(/no oauth providers configured/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Loading state', () => {
    it('shows loading text initially', () => {
      (api.auth.authOauthProvidersRetrieve as any).mockImplementation(() => new Promise(() => { }))
        ; (api.auth.authOauthAccountsRetrieve as any).mockImplementation(() => new Promise(() => { }))

      render(<OAuthConnections />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })
})
