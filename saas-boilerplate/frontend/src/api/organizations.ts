import { api } from './config';
import { Organization, PatchedOrganizationRequest } from './generated';

export type { Organization };

export interface CreateOrganizationData {
  name: string;
  slug: string;
}

export const organizationsApi = {
  // List user's organizations
  list: async () => {
    const response = await api.organizations.organizationsList({});
    return { data: response.results }; // Wrap to match expected structure if needed, or update callers
  },

  // Get specific organization
  get: (slug: string) => api.organizations.organizationsRetrieve({ slug }).then(data => ({ data })),

  // Create new organization
  create: (data: CreateOrganizationData) => api.organizations.organizationsCreate({ requestBody: data }).then(data => ({ data })),

  // Update organization
  update: (slug: string, data: PatchedOrganizationRequest) =>
    api.organizations.organizationsPartialUpdate({ slug, requestBody: data }).then(data => ({ data })),

  // Delete organization
  delete: (slug: string) => api.organizations.organizationsDestroy({ slug }),
};
