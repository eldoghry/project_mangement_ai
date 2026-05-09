"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function AuthButton() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);

  if (!hasHydrated) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-lg bg-[#E2E8F0]" aria-hidden />
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        className="rounded-lg bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4F46E5]"
        onClick={() => router.push("/login")}
      >
        Login
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-[#64748B] sm:inline">
        Signed in as <span className="font-semibold text-[#0F172A]">{username}</span>
      </span>
      <button
        type="button"
        className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#F8FAFC]"
        onClick={() => {
          logout();
          router.push("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
}
