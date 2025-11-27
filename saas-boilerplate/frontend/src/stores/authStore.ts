import { create } from 'zustand';
import { User } from '../types/auth';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start loading to check auth

  login: async (data) => {
    try {
      // Backend should set cookie
      await authApi.login(data);
      // Fetch user details
      const user = await authApi.me();
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  },

  signup: async (data) => {
    try {
      await authApi.signup(data);
      // Depending on flow, might need to login or verify email
      // Assuming auto-login for now
      const user = await authApi.me();
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Signup failed', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
        console.error('Logout failed', error);
        // Force logout state anyway
        set({ user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    try {
        set({ isLoading: true });
        const user = await authApi.me();
        set({ user, isAuthenticated: true });
    } catch (error) {
        set({ user: null, isAuthenticated: false });
    } finally {
        set({ isLoading: false });
    }
  },
}));
