import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '../api/auth';
import { LoginCredentials, SignupData } from '../types/auth';

export function useAuth() {
    const queryClient = useQueryClient();

    const { data: user, isLoading, error } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: () => auth.me(),
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const loginMutation = useMutation({
        mutationFn: (credentials: LoginCredentials) => auth.login(credentials),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: () => auth.logout(),
        onSuccess: () => {
            queryClient.setQueryData(['auth', 'me'], null);
            queryClient.clear();
        },
    });

    const signupMutation = useMutation({
        mutationFn: (data: SignupData) => auth.signup(data),
        onSuccess: () => {
            // Depending on flow, might auto-login or require verification
        },
    });

    return {
        user,
        isLoading,
        error,
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        signup: signupMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
        isSigningUp: signupMutation.isPending,
    };
}
