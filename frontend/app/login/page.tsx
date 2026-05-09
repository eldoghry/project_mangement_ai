"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/");
    }
  }, [hasHydrated, isAuthenticated, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(username, password);
    if (!ok) {
      setError("Invalid credentials. Try user / password.");
      return;
    }
    router.replace("/");
  }

  if (!hasHydrated) {
    return <div className="flex min-h-0 flex-1 bg-[#F8FAFC]" />;
  }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      >
        <h1 className="text-lg font-semibold text-[#0F172A]">Login</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Demo credentials: <span className="font-medium">user / password</span>
        </p>

        <label className="mt-4 block text-xs font-medium text-[#64748B]">
          Username
          <input
            className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError("");
            }}
            autoFocus
          />
        </label>

        <label className="mt-3 block text-xs font-medium text-[#64748B]">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
          />
        </label>

        {error ? (
          <p className="mt-3 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4F46E5]"
        >
          Login
        </button>
      </form>
    </div>
  );
}
