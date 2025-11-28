import axios from 'axios';
import { ApiClient } from './generated/ApiClient';

// Helper to get CSRF token
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

// Configure Axios Interceptors
axios.interceptors.request.use((config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken && config.method !== 'get') {
        config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle 401 (e.g., redirect to login or refresh token)
            // For now, we just pass it through as the app handles it
        }
        return Promise.reject(error.response?.data || error);
    }
);

const rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
// Allow passing either host or host + /api/v1, but avoid duplicating the versioned path
const apiHost = rawBaseUrl.endsWith('/api/v1')
    ? rawBaseUrl.replace(/\/api\/v1$/, '')
    : rawBaseUrl;

export const API_BASE_URL = apiHost;

export const api = new ApiClient({
    BASE: apiHost,
    WITH_CREDENTIALS: true,
});
