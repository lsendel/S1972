import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import TwoFactorAuth from './TwoFactorAuth'

// Mock the API client
const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
}

vi.mock('@/api/client', () => ({
  default: mockClient,
}))

describe('TwoFactorAuth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('When 2FA is disabled', () => {
    beforeEach(() => {
      mockClient.get.mockResolvedValue({
        enabled: false,
        device: null,
        backup_codes_remaining: 0,
      })
    })

    it('shows enable 2FA button', async () => {
      render(<TwoFactorAuth />)
      
      await waitFor(() => {
        expect(screen.getByText(/enable 2fa/i)).toBeInTheDocument()
      })
    })

    it('shows description about 2FA', async () => {
      render(<TwoFactorAuth />)
      
      await waitFor(() => {
        expect(screen.getByText(/add an extra layer of security/i)).toBeInTheDocument()
      })
    })

    it('initiates setup when enable button is clicked', async () => {
      const user = userEvent.setup()
      mockClient.post.mockResolvedValue({
        qr_code: 'data:image/png;base64,mockqrcode',
        secret: 'MOCKSECRET123456',
        device: { id: '1', name: 'Default' },
      })

      render(<TwoFactorAuth />)

      await waitFor(() => {
        expect(screen.getByText(/enable 2fa/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/enable 2fa/i))

      await waitFor(() => {
        expect(mockClient.post).toHaveBeenCalledWith(
          '/auth/2fa/setup/',
          { name: 'Default' }
        )
      })
    })
  })

  describe('When 2FA setup is in progress', () => {
    beforeEach(() => {
      mockClient.get.mockResolvedValue({
        enabled: false,
        device: null,
        backup_codes_remaining: 0,
      })
      mockClient.post.mockResolvedValueOnce({
        qr_code: 'data:image/png;base64,mockqrcode',
        secret: 'MOCKSECRET123456',
        device: { id: '1', name: 'Default' },
      })
    })

    it('displays QR code after setup', async () => {
      const user = userEvent.setup()
      render(<TwoFactorAuth />)

      await waitFor(() => {
        expect(screen.getByText(/enable 2fa/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/enable 2fa/i))

      await waitFor(() => {
        expect(screen.getByText(/scan qr code/i)).toBeInTheDocument()
      })
    })

    it('displays secret for manual entry', async () => {
      const user = userEvent.setup()
      render(<TwoFactorAuth />)

      await waitFor(() => {
        expect(screen.getByText(/enable 2fa/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/enable 2fa/i))

      await waitFor(() => {
        expect(screen.getByText('MOCKSECRET123456')).toBeInTheDocument()
      })
    })

    it('allows entering verification code', async () => {
      const user = userEvent.setup()
      render(<TwoFactorAuth />)

      await waitFor(() => {
        expect(screen.getByText(/enable 2fa/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/enable 2fa/i))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('000000')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('000000')
      await user.type(input, '123456')

      expect(input).toHaveValue('123456')
    })
  })

  describe('When 2FA is enabled', () => {
    beforeEach(() => {
      mockClient.get.mockResolvedValue({
        enabled: true,
        device: {
          id: '1',
          name: 'Default',
          confirmed: true,
        },
        backup_codes_remaining: 8,
      })
    })

    it('shows enabled status', async () => {
      render(<TwoFactorAuth />)

      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication is enabled/i)).toBeInTheDocument()
      })
    })

    it('displays backup codes remaining', async () => {
      render(<TwoFactorAuth />)

      await waitFor(() => {
        expect(screen.getByText(/8 backup codes remaining/i)).toBeInTheDocument()
      })
    })

    it('shows regenerate backup codes button', async () => {
      render(<TwoFactorAuth />)

      await waitFor(() => {
        expect(screen.getByText(/regenerate backup codes/i)).toBeInTheDocument()
      })
    })

    it('shows disable 2FA section', async () => {
      render(<TwoFactorAuth />)

      await waitFor(() => {
        expect(screen.getByText(/disable two-factor authentication/i)).toBeInTheDocument()
      })
    })
  })

  describe('Backup codes display', () => {
    it('displays backup codes after enabling 2FA', async () => {
      const user = userEvent.setup()
      mockClient.get.mockResolvedValue({
        enabled: false,
        device: null,
        backup_codes_remaining: 0,
      })
      
      mockClient.post
        .mockResolvedValueOnce({
          qr_code: 'data:image/png;base64,mockqrcode',
          secret: 'MOCKSECRET123456',
          device: { id: '1', name: 'Default' },
        })
        .mockResolvedValueOnce({
          backup_codes: [
            '1234-5678',
            '2345-6789',
            '3456-7890',
          ],
        })

      render(<TwoFactorAuth />)

      await waitFor(() => {
        expect(screen.getByText(/enable 2fa/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/enable 2fa/i))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('000000')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('000000')
      await user.type(input, '123456')

      const verifyButton = screen.getByRole('button', { name: /verify & enable/i })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(screen.getByText(/save your backup codes/i)).toBeInTheDocument()
      })

      expect(screen.getByText('1234-5678')).toBeInTheDocument()
    })
  })
})
