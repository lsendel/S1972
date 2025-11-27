import client from './client';
import { LoginCredentials, SignupData, User } from '../types/auth';

export const auth = {
    login: (credentials: LoginCredentials) => client.post('/auth/login/', credentials),
    logout: () => client.post('/auth/logout/'),
    signup: (data: SignupData) => client.post('/auth/signup/', data),
    me: () => client.get<User>('/auth/me/'),
    verifyEmail: (token: string) => client.post('/auth/email/verify/', { token }),
    resendVerification: () => client.post('/auth/email/resend/'),
    resetPassword: (email: string) => client.post('/auth/password/reset/', { email }),
    confirmPasswordReset: (data: any) => client.post('/auth/password/reset/confirm/', data),
};
