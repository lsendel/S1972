import client from './client';
import { User } from '../types/auth';

export const authApi = {
    login: (data: any) => client.post<User>('/auth/login/', data),
    signup: (data: any) => client.post<User>('/auth/signup/', data),
    logout: () => client.post('/auth/logout/'),
    me: () => client.get<User>('/auth/me/'),
    setup2FA: () => client.post<{device_id: number, config_url: string, qr_code: string}>('/auth/2fa/setup/'),
    verify2FA: (data: { device_id: number, token: string }) => client.post('/auth/2fa/verify/', data),
};
