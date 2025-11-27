import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../pages/auth/Login'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

// Mock the auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn()
}))

// Mock navigate
const mockedNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate
  }
})

describe('Login Component', () => {
  it('renders login form', () => {
    // Setup mock store
    ;(useAuthStore as any).mockImplementation((selector: any) => selector({
      login: vi.fn(),
      isLoading: false
    }))

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument()
  })

  it('calls login action on submit', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined)

    ;(useAuthStore as any).mockImplementation((selector: any) => selector({
      login: mockLogin,
      isLoading: false
    }))

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123'
        })
    })

    expect(mockedNavigate).toHaveBeenCalledWith('/app')
  })
})
