
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import client from '@/api/client'
import TwoFactorAuth from './TwoFactorAuth'

// Mock the API client
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('TwoFactorAuth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('When 2FA is disabled', () => {
    beforeEach(() => {
      (client.get as any).mockResolvedValue({
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
      console.log('userEvent:', userEvent)
      const user = userEvent.setup()
        ; (client.post as any).mockResolvedValue({
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
        expect(client.post).toHaveBeenCalledWith(
          '/auth/2fa/setup/',
          { name: 'Default' }
        )
      })
    })
  })

  describe('When 2FA setup is in progress', () => {
    beforeEach(() => {
      (client.get as any).mockResolvedValue({
        enabled: false,
        device: null,
        backup_codes_remaining: 0,
      })
        ; (client.post as any).mockResolvedValueOnce({
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
      (client.get as any).mockResolvedValue({
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
        ; (client.get as any).mockResolvedValue({
          enabled: false,
          device: null,
          backup_codes_remaining: 0,
        })

        ; (client.post as any)
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
