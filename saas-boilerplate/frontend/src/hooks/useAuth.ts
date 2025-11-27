import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { User } from '../types/auth';

export function useAuth() {
    const queryClient = useQueryClient();

    const { data: user, isLoading, error } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: authApi.me,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            queryClient.setQueryData(['auth', 'me'], data);
        },
    });

    const signupMutation = useMutation({
        mutationFn: authApi.signup,
        onSuccess: (data) => {
             // Depending on flow, might autologin or require verification
             // For now assuming we might get user data back
             queryClient.setQueryData(['auth', 'me'], data);
        },
    });

    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            queryClient.setQueryData(['auth', 'me'], null);
            queryClient.clear();
        },
    });

    return {
        user: user as User | undefined, // Cast because axios interceptor unwraps response
        isLoading,
        error,
        login: loginMutation.mutateAsync,
        signup: signupMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
    };
}
