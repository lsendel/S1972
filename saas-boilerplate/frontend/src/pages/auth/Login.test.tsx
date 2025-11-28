import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import Login from './Login'

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoggingIn: false,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    render(<Login />)
    
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('has link to forgot password', () => {
    render(<Login />)
    
    const forgotLink = screen.getByText(/forgot password/i)
    expect(forgotLink).toBeInTheDocument()
    expect(forgotLink.closest('a')).toHaveAttribute('href', '/forgot-password')
  })

  it('has link to signup', () => {
    render(<Login />)
    
    const signupLink = screen.getByText(/start a 14 day free trial/i)
    expect(signupLink).toBeInTheDocument()
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup')
  })

  it('allows entering email and password', async () => {
    const user = userEvent.setup()
    render(<Login />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('submits form with email and password', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({})
    
    render(<Login />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('navigates to /app on successful login', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({})
    
    render(<Login />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })
  })

  it('displays error message on login failure', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    
    render(<Login />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('clears error when resubmitting', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    
    render(<Login />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    // First submission - error
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
    
    // Second submission - error should clear
    mockLogin.mockResolvedValue({})
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument()
    })
  })
})
