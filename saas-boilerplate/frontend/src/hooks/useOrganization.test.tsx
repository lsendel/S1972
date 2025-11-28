import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@/test/utils'
import { useOrganization, useOrganizations, useCreateOrganization } from './useOrganization'
import { api } from '@/api/config'


vi.mock('@/api/config', () => ({
    api: {
        organizations: {
            organizationsList: vi.fn(),
            organizationsRetrieve: vi.fn(),
            organizationsCreate: vi.fn(),
        }
    }
}))
vi.mock('react-router-dom', () => ({
    useParams: () => ({ orgSlug: 'test-org' }),
}))

const mockOrg = { id: '1', name: 'Test Org', slug: 'test-org', role: 'owner' }

describe('useOrganization Hook', () => {
    it('fetches current organization', async () => {
        (api.organizations.organizationsRetrieve as any).mockResolvedValue(mockOrg)

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } }
        })

        const { result } = renderHook(() => useOrganization('test-org'), {
            wrapper: ({ children }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            )
        })

        await waitFor(() => {
            expect(result.current.data).toEqual(mockOrg)
        })

        expect(api.organizations.organizationsRetrieve).toHaveBeenCalledWith({ slug: 'test-org' })
    })
})

describe('useOrganizations Hook', () => {
    it('fetches all organizations', async () => {
        (api.organizations.organizationsList as any).mockResolvedValue({ results: [mockOrg] })

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } }
        })

        const { result } = renderHook(() => useOrganizations(), {
            wrapper: ({ children }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            )
        })

        await waitFor(() => {
            expect(result.current.data).toEqual([mockOrg])
        })

        expect(api.organizations.organizationsList).toHaveBeenCalledWith({})
    })
})

describe('useCreateOrganization Hook', () => {
    it('creates an organization', async () => {
        (api.organizations.organizationsCreate as any).mockResolvedValue(mockOrg)

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } }
        })

        const { result } = renderHook(() => useCreateOrganization(), {
            wrapper: ({ children }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            )
        })

        await result.current.mutateAsync({ name: 'New Org' })

        expect(api.organizations.organizationsCreate).toHaveBeenCalledWith({
            requestBody: { name: 'New Org' }
        })
    })
})
