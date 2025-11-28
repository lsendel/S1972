import axios from 'axios';
import { API_BASE_URL } from './config';

export const membersApi = {
    updateRole: async (orgSlug: string, memberId: number, role: 'admin' | 'member') => {
        const response = await axios.patch(`${API_BASE_URL}/organizations/${orgSlug}/members/${memberId}/`, { role });
        return response.data;
    },
    removeMember: async (orgSlug: string, memberId: number) => {
        await axios.delete(`${API_BASE_URL}/organizations/${orgSlug}/members/${memberId}/`);
    },
    revokeInvitation: async (orgSlug: string, invitationId: number) => {
        await axios.delete(`${API_BASE_URL}/organizations/${orgSlug}/invitations/${invitationId}/`);
    }
};
