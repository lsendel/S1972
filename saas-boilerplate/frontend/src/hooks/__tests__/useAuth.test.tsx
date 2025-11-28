import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from '../useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import client from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

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
    it('should return user when authenticated', async () => {
        const mockUser = { id: '1', email: 'test@example.com', full_name: 'Test User' };
        (client.get as any).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.user).toEqual(mockUser);
        expect(!!result.current.user).toBe(true);
    });

    it('should return null when not authenticated', async () => {
        (client.get as any).mockRejectedValue({ response: { status: 401 } });

        const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.user).toBeFalsy();
        expect(!!result.current.user).toBe(false);
    });
});
