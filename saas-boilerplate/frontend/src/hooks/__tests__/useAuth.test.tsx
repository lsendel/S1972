import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockApi } from '@/test/mocks/api';
import { CancelablePromise } from '@/api/generated/core/CancelablePromise';

vi.mock('@/api/config', async () => {
    const { mockApi } = await import('@/test/mocks/api')
    return { api: mockApi }
})

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return user when authenticated', async () => {
        const mockUser = { id: '1', email: 'test@example.com', full_name: 'Test User' };
        mockApi.auth.authMeRetrieve.mockReturnValue(new CancelablePromise((resolve) => resolve(mockUser)));

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.user).toEqual(mockUser);
        expect(!!result.current.user).toBe(true);
    });

    it('should return null when not authenticated', async () => {
        mockApi.auth.authMeRetrieve.mockImplementation(() => new CancelablePromise((_, reject) => reject({ body: { detail: 'Unauthorized' }, status: 401 })));

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.user).toBeFalsy();
        expect(!!result.current.user).toBe(false);
    });

    it('should handle login mutation', async () => {
        const mockUser = { id: '1', email: 'test@example.com', full_name: 'Test User' };
        mockApi.auth.authLoginCreate.mockReturnValue(new CancelablePromise((resolve) => resolve(mockUser)));

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await result.current.login({ email: 'test@example.com', password: 'password' });

        expect(mockApi.auth.authLoginCreate).toHaveBeenCalledWith({
            requestBody: {
                email: 'test@example.com',
                password: 'password',
            }
        });
    });

    it('should handle logout mutation', async () => {
        mockApi.auth.authLogoutCreate.mockReturnValue(new CancelablePromise((resolve) => resolve({})));

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await result.current.logout();

        expect(mockApi.auth.authLogoutCreate).toHaveBeenCalled();
    });

    it('should handle signup mutation', async () => {
        const mockUser = { id: '1', email: 'test@example.com', full_name: 'Test User' };
        mockApi.auth.authSignupCreate.mockReturnValue(new CancelablePromise((resolve) => resolve(mockUser)));

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await result.current.signup({
            email: 'test@example.com',
            password: 'password',
            full_name: 'Test User',
        });

        expect(mockApi.auth.authSignupCreate).toHaveBeenCalledWith({
            requestBody: {
                email: 'test@example.com',
                password: 'password',
                full_name: 'Test User',
            }
        });
    });
});
