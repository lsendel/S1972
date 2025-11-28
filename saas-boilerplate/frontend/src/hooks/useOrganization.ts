import { useQuery, useMutation } from '@tanstack/react-query';
import client from '../api/client';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: 'owner' | 'admin' | 'member';
  member_count: number;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await client.get<Organization[]>('/organizations/');
      return response;
    },
  });
}

export function useOrganization(slug?: string) {
  return useQuery({
    queryKey: ['organizations', slug],
    queryFn: async () => {
      if (!slug) return null;
      const response = await client.get<Organization>(`/organizations/${slug}/`);
      return response;
    },
    enabled: !!slug,
  });
}

export function useCreateOrganization() {
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await client.post<Organization>('/organizations/', data);
      return response;
    },
  });
}
