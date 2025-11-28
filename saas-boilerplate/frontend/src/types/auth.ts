export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser?: boolean;
    email_verified: boolean;
    totp_enabled: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    email: string;
    password: string;
    full_name?: string;
}
