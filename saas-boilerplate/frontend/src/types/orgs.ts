export interface Organization {
    id: string;
    slug: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface Invitation {
    id: string;
    email: string;
    organization_name: string;
    role: 'owner' | 'admin' | 'member';
    token: string;
    expires_at: string;
    status: 'pending' | 'accepted' | 'expired' | 'revoked';
}

export interface CreateInvitationData {
    email: string;
    role: 'owner' | 'admin' | 'member';
}
