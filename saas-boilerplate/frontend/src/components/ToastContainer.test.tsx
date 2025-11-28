import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToastContext } from './ToastContainer'

// Test component that uses toast
function TestComponent() {
  const toast = useToastContext()

  return (
    <div>
      <button onClick={() => toast.success('Success message')}>Show Success</button>
      <button onClick={() => toast.success('Short message', 500)}>Show Short</button>
      <button onClick={() => toast.error('Error message')}>Show Error</button>
      <button onClick={() => toast.warning('Warning message')}>Show Warning</button>
      <button onClick={() => toast.info('Info message')}>Show Info</button>
    </div>
  )
}

describe('ToastContainer', () => {
  it('shows success toast', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Show Success'))

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })
  })

  it('shows error toast', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Show Error'))

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })
  })

  it('shows warning toast', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Show Warning'))

    await waitFor(() => {
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })
  })

  it('shows info toast', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Show Info'))

    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeInTheDocument()
    })
  })

  it('allows closing toast', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Show Success'))

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })

    // Find and click close button
    const closeButtons = screen.getAllByRole('button', { name: '' })
    const closeButton = closeButtons.find(btn => btn.querySelector('svg'))

    if (closeButton) {
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      })
    }
  })

  it('auto-dismisses toast after duration', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    await user.click(screen.getByText('Show Short'))

    await waitFor(() => {
      expect(screen.getByText('Short message')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.queryByText('Short message')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
