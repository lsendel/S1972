import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'


// Create a new QueryClient for each test to avoid state leakage
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })



interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routeWrapper?: boolean
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions,
) => {
  const { routeWrapper = true, ...renderOptions } = options || {}

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={createTestQueryClient()}>
        {routeWrapper ? (
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            {children}
          </BrowserRouter>
        ) : (
          children
        )}
      </QueryClientProvider>
    ),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender as render }

// Mock user data
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  full_name: 'Test User',
  email_verified: true,
  totp_enabled: false,
  is_active: true,
}

// Mock organization data
export const mockOrganization = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Organization',
  slug: 'test-org',
  role: 'owner',
  member_count: 5,
  created_at: '2024-01-01T00:00:00Z',
}


