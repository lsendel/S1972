import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import client from '@/api/client'
import OAuthConnections from './OAuthConnections'

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('OAuthConnections Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as any).location
    window.location = { href: '' } as any
  })

  describe('When OAuth providers are configured', () => {
    beforeEach(() => {
      ; (client.get as any).mockImplementation((url: string) => {
        if (url.includes('providers')) {
          return Promise.resolve({
            providers: [
              { provider: 'google', name: 'Google', connected: false },
              { provider: 'github', name: 'GitHub', connected: false },
            ],
          })
        }
        if (url.includes('accounts')) {
          return Promise.resolve({ accounts: [] })
        }
        return Promise.resolve({})
      })
    })

    it('displays available providers', async () => {
      render(<OAuthConnections />)

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
        expect(screen.getByText('GitHub')).toBeInTheDocument()
      })
    })

    it('shows connect buttons for unconnected providers', async () => {
      render(<OAuthConnections />)

      await waitFor(() => {
        const connectButtons = screen.getAllByText(/connect/i)
        expect(connectButtons).toHaveLength(2)
      })
    })

    it('shows not connected status', async () => {
      render(<OAuthConnections />)

      await waitFor(() => {
        const notConnected = screen.getAllByText(/not connected/i)
        expect(notConnected).toHaveLength(2)
      })
    })
  })

  describe('When providers are connected', () => {
    beforeEach(() => {
      ; (client.get as any).mockImplementation((url: string) => {
        if (url.includes('providers')) {
          return Promise.resolve({
            providers: [
              { provider: 'google', name: 'Google', connected: true },
              { provider: 'github', name: 'GitHub', connected: false },
            ],
          })
        }
        if (url.includes('accounts')) {
          return Promise.resolve({
            accounts: [
              {
                id: '1',
                provider: 'google',
                provider_name: 'Google',
                email: 'test@gmail.com',
                name: 'Test User',
              },
            ],
          })
        }
        return Promise.resolve({})
      })
    })

    it('displays connected status', async () => {
      render(<OAuthConnections />)

      await waitFor(() => {
        expect(screen.getByText(/connected/i)).toBeInTheDocument()
      })
    })

    it('displays user email for connected account', async () => {
      render(<OAuthConnections />)

      await waitFor(() => {
        expect(screen.getByText('test@gmail.com')).toBeInTheDocument()
      })
    })

    it('shows disconnect button for connected provider', async () => {
      render(<OAuthConnections />)

      await waitFor(() => {
        expect(screen.getByText(/disconnect/i)).toBeInTheDocument()
      })
    })

    it('shows connect button for unconnected provider', async () => {
      render(<OAuthConnections />)

      await waitFor(() => {
        // Should have one Connect button (for GitHub)
        const connectButtons = screen.getAllByRole('button', { name: /connect/i })
        expect(connectButtons).toHaveLength(1)
      })
    })
  })

  describe('Connect functionality', () => {
    beforeEach(() => {
      ; (client.get as any).mockImplementation((url: string) => {
        if (url.includes('providers')) {
          return Promise.resolve({
            providers: [
              { provider: 'google', name: 'Google', connected: false },
            ],
          })
        }
        if (url.includes('accounts')) {
          return Promise.resolve({ accounts: [] })
        }
        return Promise.resolve({})
      })
    })

    it('redirects to OAuth URL when connect is clicked', async () => {
      const user = userEvent.setup()
        ; (client.get as any).mockResolvedValueOnce({
          authorization_url: 'https://accounts.google.com/oauth',
        })

      render(<OAuthConnections />)

      await waitFor(() => {
        expect(screen.getByText(/connect/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/connect/i))

      await waitFor(() => {
        expect(window.location.href).toBe('https://accounts.google.com/oauth')
      })
    })
  })

  describe('Disconnect functionality', () => {
    beforeEach(() => {
      ; (client.get as any).mockImplementation((url: string) => {
        if (url.includes('providers')) {
          return Promise.resolve({
            providers: [
              { provider: 'google', name: 'Google', connected: true },
            ],
          })
        }
        if (url.includes('accounts')) {
          return Promise.resolve({
            accounts: [
              {
                id: '1',
                provider: 'google',
                provider_name: 'Google',
                email: 'test@gmail.com',
              },
            ],
          })
        }
        return Promise.resolve({})
      })
    })

    it('shows confirmation dialog when disconnect is clicked', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<OAuthConnections />)

      await waitFor(() => {
        expect(screen.getByText(/disconnect/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/disconnect/i))

      expect(confirmSpy).toHaveBeenCalled()
      confirmSpy.mockRestore()
    })

    it('disconnects account when confirmed', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
        ; (client.post as any).mockResolvedValue({ message: 'Account disconnected' })

      render(<OAuthConnections />)

      await waitFor(() => {
        expect(screen.getByText(/disconnect/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/disconnect/i))

      await waitFor(() => {
        expect(client.post).toHaveBeenCalledWith('/auth/oauth/disconnect/google/')
      })

      confirmSpy.mockRestore()
    })
  })

  describe('When no providers are configured', () => {
    beforeEach(() => {
      ; (client.get as any).mockImplementation((url: string) => {
        if (url.includes('providers')) {
          return Promise.resolve({ providers: [] })
        }
        if (url.includes('accounts')) {
          return Promise.resolve({ accounts: [] })
        }
        return Promise.resolve({})
      })
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
      ; (client.get as any).mockImplementation(() => new Promise(() => { }))

      render(<OAuthConnections />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })
})
