import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi, Organization, CreateOrganizationData } from '../api/organizations';

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
  });
}

export function useOrganization(slug: string | undefined) {
  return useQuery({
    queryKey: ['organizations', slug],
    queryFn: () => organizationsApi.get(slug!),
    enabled: !!slug,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationData) => organizationsApi.create(data),
    onSuccess: (newOrg) => {
      // Update the organizations list cache
      queryClient.setQueryData<Organization[]>(
        ['organizations'],
        (old = []) => [...old, newOrg]
      );
    },
  });
}

export function useUpdateOrganization(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateOrganizationData>) =>
      organizationsApi.update(slug, data),
    onSuccess: (updated) => {
      // Update the specific organization cache
      queryClient.setQueryData(['organizations', slug], updated);

      // Update the organizations list cache
      queryClient.setQueryData<Organization[]>(
        ['organizations'],
        (old = []) => old.map(org => org.slug === slug ? updated : org)
      );
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => organizationsApi.delete(slug),
    onSuccess: (_, slug) => {
      // Remove from organizations list
      queryClient.setQueryData<Organization[]>(
        ['organizations'],
        (old = []) => old.filter(org => org.slug !== slug)
      );

      // Invalidate specific organization query
      queryClient.removeQueries({ queryKey: ['organizations', slug] });
    },
  });
}
