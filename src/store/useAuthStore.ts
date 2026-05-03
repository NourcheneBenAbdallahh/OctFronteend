import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { syncAuthAccessCookie } from '@/lib/authCookie';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  photo?: string; 
  telephone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
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

      logout: () => {
        syncAuthAccessCookie(null);
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