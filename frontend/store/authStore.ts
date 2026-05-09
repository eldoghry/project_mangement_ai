import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

const TOKEN_KEY = "kanban_token";

type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
  hasHydrated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,
      hasHydrated: false,

      login: async (username, password) => {
        try {
          const { token, user } = await api.auth.login(username, password);
          localStorage.setItem(TOKEN_KEY, token);
          set({ isAuthenticated: true, username: user.username });
          return true;
        } catch {
          return false;
        }
      },

      register: async (username, password) => {
        try {
          const { token, user } = await api.auth.register(username, password);
          localStorage.setItem(TOKEN_KEY, token);
          set({ isAuthenticated: true, username: user.username });
          return true;
        } catch {
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        set({ isAuthenticated: false, username: null });
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "kanban-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        username: state.username,
      }),
    },
  ),
);