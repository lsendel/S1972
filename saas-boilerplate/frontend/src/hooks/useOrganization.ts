import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/config';
import { Organization } from '../api/generated';

export type { Organization };

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await api.organizations.organizationsList({});
      if (response.results) {
        return response.results;
      }
      return [];
    },
  });
}

export function useOrganization(slug?: string) {
  return useQuery({
    queryKey: ['organizations', slug],
    queryFn: async () => {
      if (!slug) return null;
      const response = await api.organizations.organizationsRetrieve({ slug });
      return response;
    },
    enabled: !!slug,
  });
}

export function useCreateOrganization() {
  return useMutation({
    mutationFn: async (data: { name: string; slug?: string }) => {
      const response = await api.organizations.organizationsCreate({
        requestBody: { name: data.name }
      });
      return response;
    },
  });
}
