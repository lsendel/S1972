import { describe, it, expect, vi, beforeEach } from 'vitest'
import { organizationsApi } from './organizations'
import { api } from './config'

vi.mock('./config', () => ({
    api: {
        organizations: {
            organizationsList: vi.fn(),
            organizationsRetrieve: vi.fn(),
            organizationsCreate: vi.fn(),
            organizationsPartialUpdate: vi.fn(),
            organizationsDestroy: vi.fn(),
        }
    }
}))

describe('Organizations API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('list calls correct endpoint', async () => {
        (api.organizations.organizationsList as any).mockResolvedValue({ results: [] })
        await organizationsApi.list()
        expect(api.organizations.organizationsList).toHaveBeenCalledWith({})
    })

    it('get calls correct endpoint', async () => {
        (api.organizations.organizationsRetrieve as any).mockResolvedValue({})
        await organizationsApi.get('org-slug')
        expect(api.organizations.organizationsRetrieve).toHaveBeenCalledWith({ slug: 'org-slug' })
    })

    it('create calls correct endpoint', async () => {
        (api.organizations.organizationsCreate as any).mockResolvedValue({})
        const data = { name: 'New Org', slug: 'new-org' }
        await organizationsApi.create(data)
        expect(api.organizations.organizationsCreate).toHaveBeenCalledWith({ requestBody: data })
    })

    it('update calls correct endpoint', async () => {
        (api.organizations.organizationsPartialUpdate as any).mockResolvedValue({})
        const data = { name: 'Updated Org' }
        await organizationsApi.update('org-slug', data)
        expect(api.organizations.organizationsPartialUpdate).toHaveBeenCalledWith({ slug: 'org-slug', requestBody: data })
    })

    it('delete calls correct endpoint', async () => {
        await organizationsApi.delete('org-slug')
        expect(api.organizations.organizationsDestroy).toHaveBeenCalledWith({ slug: 'org-slug' })
    })
})
