import client from './client';
import { User } from '../types/auth';

export const authApi = {
    getCsrf: () => client.get('/auth/csrf/'),
    login: async (data: any) => {
        await client.get('/auth/csrf/');
        return client.post<User>('/auth/login/', data);
    },
    signup: async (data: any) => {
        await client.get('/auth/csrf/');
        return client.post<User>('/auth/signup/', data);
    },
    logout: () => client.post('/auth/logout/'),
    me: () => client.get<User>('/auth/me/'),
};
