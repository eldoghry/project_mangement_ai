"use client";

import { useEffect } from "react";
import { BoardClient } from "@/components/BoardClient";
import { BoardStats } from "@/components/BoardStats";
import { TaskSearch } from "@/components/TaskSearch";
import { AuthButton } from "@/components/AuthButton";
import { useAuthStore } from "@/store/authStore";
import { useBoardStore } from "@/store/boardStore";

export default function Home() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const username = useAuthStore((s) => s.username);
  const setOwner = useBoardStore((s) => s.setOwner);
  const clearOwner = useBoardStore((s) => s.clearOwner);
  const isLoading = useBoardStore((s) => s.isLoading);
  const error = useBoardStore((s) => s.error);
  const clearError = useBoardStore((s) => s.clearError);

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated && username) {
      setOwner(username).catch(console.error);
      return;
    }
    clearOwner();
  }, [hasHydrated, isAuthenticated, username, setOwner, clearOwner]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F8FAFC]">
      <header className="shrink-0 border-b border-[#E2E8F0] bg-white px-6 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#0F172A]">
              Kanban
            </h1>
            <p className="mt-0.5 text-sm text-[#64748B]">
              Five lists · drag tasks to reorder or move
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <AuthButton />
            {hasHydrated && isAuthenticated ? <BoardStats /> : null}
          </div>
        </div>
        {hasHydrated && isAuthenticated ? (
          <div className="mt-4 border-t border-[#F1F5F9] pt-4">
            <TaskSearch />
          </div>
        ) : null}
      </header>

      {error && (
        <div className="mx-6 mt-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-4 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col px-6 py-6">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl bg-[#EEF2F6] p-4">
          {!hasHydrated ? (
            <div className="h-full min-h-0 flex-1" />
          ) : isAuthenticated ? (
            isLoading ? (
              <div className="flex h-full min-h-0 flex-1 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6366F1] border-t-transparent" />
                  <p className="text-sm text-[#64748B]">Loading board…</p>
                </div>
              </div>
            ) : (
              <BoardClient />
            )
          ) : (
            <div className="flex h-full min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] bg-white/60 p-6 text-center">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Login required
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Use the Login button in the header to access your personal board.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}