import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from '../Login';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import * as useAuthModule from '../../../hooks/useAuth';

// Mock useAuth
vi.mock('../../../hooks/useAuth', () => ({
    useAuth: vi.fn(),
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
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
    );
};

describe('Login Page', () => {
    it('renders login form', () => {
        (useAuthModule.useAuth as any).mockReturnValue({
            login: vi.fn(),
            isLoggingIn: false,
            isAuthenticated: false,
        });

        render(<Login />, { wrapper: createWrapper() });

        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('calls login mutation on submit', async () => {
        const loginMock = vi.fn();
        (useAuthModule.useAuth as any).mockReturnValue({
            login: loginMock,
            isLoggingIn: false,
            isAuthenticated: false,
        });

        render(<Login />, { wrapper: createWrapper() });

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password',
            });
        });
    });
});
