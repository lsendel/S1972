import axios, { AxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

axiosInstance.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken && config.method !== 'get') {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle 401
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Wrapper to fix types since interceptor returns data directly
const client = {
  get: <T>(url: string, config?: AxiosRequestConfig) => axiosInstance.get<T, T>(url, config),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => axiosInstance.post<T, T>(url, data, config),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => axiosInstance.put<T, T>(url, data, config),
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => axiosInstance.patch<T, T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => axiosInstance.delete<T, T>(url, config),
};

export default client;
