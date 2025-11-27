import client from './client';
import { User } from '../types/auth';

export const authApi = {
    login: (data: any) => client.post<User>('/auth/login/', data),
    signup: (data: any) => client.post<User>('/auth/signup/', data),
    logout: () => client.post('/auth/logout/'),
    me: () => client.get<User>('/auth/me/'),
};
