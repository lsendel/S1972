import { api } from './config';
import type { LoginCredentials, SignupData } from '../types/auth';
import type { PasswordResetConfirmRequest } from './generated';

function getCookie(name: string): string | null {
    if (!document.cookie) {
        return null;
    }
    const xsrfCookies = document.cookie.split(';')
        .map(c => c.trim())
        .filter(c => c.startsWith(name + '='));

    if (xsrfCookies.length === 0) {
        return null;
    }
    return decodeURIComponent(xsrfCookies[0].split('=')[1]);
}

async function ensureCsrf() {
    if (!getCookie('csrftoken')) {
        await api.auth.authCsrfRetrieve();
    }
}

export const auth = {
    login: async (credentials: LoginCredentials) => {
        await ensureCsrf();
        return api.auth.authLoginCreate({ requestBody: credentials });
    },
    logout: () => api.auth.authLogoutCreate(),
    signup: async (data: SignupData) => {
        await ensureCsrf();
        return api.auth.authSignupCreate({ requestBody: data });
    },
    me: () => api.auth.authMeRetrieve(),
    verifyEmail: (token: string) => api.auth.authEmailVerifyCreate({ requestBody: { token } }),
    resendVerification: () => Promise.resolve(), // Not implemented in backend yet?
    resetPassword: async (email: string) => {
        await ensureCsrf();
        return api.auth.authPasswordResetCreate({ requestBody: { email } });
    },
    confirmPasswordReset: async (data: PasswordResetConfirmRequest) => {
        await ensureCsrf();
        return api.auth.authPasswordResetConfirmCreate({ requestBody: data });
    },
};
