import client from './client';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
}

export const organizationsApi = {
  // List user's organizations
  list: () => client.get<Organization[]>('/organizations/'),

  // Get specific organization
  get: (slug: string) => client.get<Organization>(`/organizations/${slug}/`),

  // Create new organization
  create: (data: CreateOrganizationData) => client.post<Organization>('/organizations/', data),

  // Update organization
  update: (slug: string, data: Partial<CreateOrganizationData>) =>
    client.patch<Organization>(`/organizations/${slug}/`, data),

  // Delete organization
  delete: (slug: string) => client.delete(`/organizations/${slug}/`),
};
