import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import OAuthConnections from './OAuthConnections'

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
}

vi.mock('@/api/client', () => ({
  default: mockClient,
}))

describe('OAuthConnections Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as any).location
    window.location = { href: '' } as any
  })

  describe('When OAuth providers are configured', () => {
    beforeEach(() => {
      mockClient.get
        .mockResolvedValueOnce({
          providers: [
            { provider: 'google', name: 'Google', connected: false },
            { provider: 'github', name: 'GitHub', connected: false },
          ],
        })
        .mockResolvedValueOnce({
          accounts: [],
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
      mockClient.get
        .mockResolvedValueOnce({
          providers: [
            { provider: 'google', name: 'Google', connected: true },
            { provider: 'github', name: 'GitHub', connected: false },
          ],
        })
        .mockResolvedValueOnce({
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
      mockClient.get
        .mockResolvedValueOnce({
          providers: [
            { provider: 'google', name: 'Google', connected: false },
          ],
        })
        .mockResolvedValueOnce({
          accounts: [],
        })
    })

    it('redirects to OAuth URL when connect is clicked', async () => {
      const user = userEvent.setup()
      mockClient.get.mockResolvedValueOnce({
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
      mockClient.get
        .mockResolvedValueOnce({
          providers: [
            { provider: 'google', name: 'Google', connected: true },
          ],
        })
        .mockResolvedValueOnce({
          accounts: [
            {
              id: '1',
              provider: 'google',
              provider_name: 'Google',
              email: 'test@gmail.com',
            },
          ],
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
      mockClient.post.mockResolvedValue({ message: 'Account disconnected' })

      render(<OAuthConnections />)

      await waitFor(() => {
        expect(screen.getByText(/disconnect/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/disconnect/i))

      await waitFor(() => {
        expect(mockClient.post).toHaveBeenCalledWith('/auth/oauth/disconnect/google/')
      })

      confirmSpy.mockRestore()
    })
  })

  describe('When no providers are configured', () => {
    beforeEach(() => {
      mockClient.get
        .mockResolvedValueOnce({
          providers: [],
        })
        .mockResolvedValueOnce({
          accounts: [],
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
      mockClient.get.mockImplementation(() => new Promise(() => {}))
      
      render(<OAuthConnections />)
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })
})
