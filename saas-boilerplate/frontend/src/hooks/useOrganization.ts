import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { Organization } from '../types/auth';

export const organizationApi = {
    list: () => client.get<Organization[]>('/organizations/'),
    get: (slug: string) => client.get<Organization>(`/organizations/${slug}/`),
    create: (data: { name: string; slug: string }) => client.post<Organization>('/organizations/', data),
};

export function useOrganization(slug?: string) {
    // List all orgs
    const listQuery = useQuery({
        queryKey: ['organizations', 'list'],
        queryFn: organizationApi.list,
    });

    // Get specific org
    const detailQuery = useQuery({
        queryKey: ['organizations', 'detail', slug],
        queryFn: () => organizationApi.get(slug!),
        enabled: !!slug,
    });

    return {
        organizations: listQuery.data,
        isLoadingList: listQuery.isLoading,
        organization: detailQuery.data,
        isLoadingDetail: detailQuery.isLoading,
        error: detailQuery.error || listQuery.error,
    };
}
