export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    is_staff: boolean;
    email_verified: boolean;
    totp_enabled: boolean;
}

export interface AuthResponse {
    data: User;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url: string;
    role: 'owner' | 'admin' | 'member';
    created_at: string;
}
