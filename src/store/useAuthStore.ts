import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { syncAuthAccessCookie } from '@/lib/authCookie';
import { clearOnboardingPending } from '@/lib/onboardingStorage';
import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  patchUser: (partial: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        syncAuthAccessCookie(token);
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      patchUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        }));
      },

      logout: () => {
        syncAuthAccessCookie(null);
        clearOnboardingPending();
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('auth-storage');
      },
    }),
    {
      name: 'auth-storage', // Nom de la clé dans le localStorage
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          syncAuthAccessCookie(state.token);
        }
      },
    }
  )
);