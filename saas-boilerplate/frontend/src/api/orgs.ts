import client from './client';
import { Organization, Invitation, CreateInvitationData } from '../types/orgs';

export const orgsApi = {
    // Organizations
    list: async () => {
        const response: any = await client.get('/organizations/');
        if (Array.isArray(response)) return response as Organization[];
        if (response.results && Array.isArray(response.results)) return response.results as Organization[];
        if (response.data && Array.isArray(response.data)) return response.data as Organization[];

        console.error("Invalid organizations response format", response);
        return [] as Organization[];
    },
    get: async (slug: string) => {
        const response: any = await client.get(`/organizations/${slug}/`);
        return (response.data ? response.data : response) as Organization;
    },
    create: async (data: { name: string }) => {
        const response: any = await client.post('/organizations/', data);
        return (response.data ? response.data : response) as Organization;
    },

    // Invitations
    listInvitations: async (slug: string) => {
        const response: any = await client.get(`/organizations/${slug}/invitations/`);
        if (Array.isArray(response)) return response as Invitation[];
        if (response.results && Array.isArray(response.results)) return response.results as Invitation[];
        if (response.data && Array.isArray(response.data)) return response.data as Invitation[];
        return [] as Invitation[];
    },
    createInvitation: async (slug: string, data: CreateInvitationData) => {
        const response: any = await client.post(`/organizations/${slug}/invitations/create/`, data);
        return (response.data ? response.data : response) as Invitation;
    },
    revokeInvitation: (slug: string, invitationId: string) =>
        client.post(`/organizations/${slug}/invitations/${invitationId}/revoke/`),

    // Accept Invitation (Public)
    getInvitation: async (token: string) => {
        const response: any = await client.get(`/organizations/invitations/${token}/`);
        return (response.data ? response.data : response) as Invitation;
    },
    acceptInvitation: (token: string, data: any) => client.post(`/organizations/invitations/${token}/accept/`, data),
};
