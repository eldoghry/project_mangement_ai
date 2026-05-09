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

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated && username) {
      setOwner(username);
      return;
    }
    clearOwner();
  }, [
    hasHydrated,
    isAuthenticated,
    username,
    setOwner,
    clearOwner,
  ]);

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
      <main className="flex min-h-0 flex-1 flex-col px-6 py-6">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl bg-[#EEF2F6] p-4">
          {!hasHydrated ? (
            <div className="h-full min-h-0 flex-1" />
          ) : isAuthenticated ? (
            <BoardClient />
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
