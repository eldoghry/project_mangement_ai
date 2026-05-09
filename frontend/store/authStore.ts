import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEMO_USERNAME = "user";
const DEMO_PASSWORD = "password";

type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
  hasHydrated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,
      hasHydrated: false,

      login: (username, password) => {
        const ok =
          username.trim().toLowerCase() === DEMO_USERNAME &&
          password === DEMO_PASSWORD;
        if (!ok) return false;
        set({ isAuthenticated: true, username: DEMO_USERNAME });
        return true;
      },

      logout: () => set({ isAuthenticated: false, username: null }),

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
