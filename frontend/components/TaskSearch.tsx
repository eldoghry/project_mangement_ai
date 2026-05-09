"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Task } from "@/types/board";
import { useBoardStore } from "@/store/boardStore";
import { getListColumnTheme } from "@/lib/listColumnTheme";

type TaskHit = {
  task: Task;
  listId: string;
  listTitle: string;
};

function taskMatchesQuery(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const hay = `${task.title}\n${task.description}`.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => hay.includes(t));
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function TaskSearch() {
  const lists = useBoardStore((s) => s.lists);
  const requestOpenTask = useBoardStore((s) => s.requestOpenTask);
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [listFilter, setListFilter] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const allHits = useMemo((): TaskHit[] => {
    const out: TaskHit[] = [];
    for (const list of lists) {
      if (listFilter && list.id !== listFilter) continue;
      for (const task of list.tasks) {
        out.push({ task, listId: list.id, listTitle: list.title });
      }
    }
    return out;
  }, [lists, listFilter]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return allHits.filter(({ task }) => taskMatchesQuery(task, query)).slice(0, 12);
  }, [allHits, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, listFilter]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function pickTask(taskId: string) {
    requestOpenTask(taskId);
    setOpen(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const hit = suggestions[activeIndex];
      if (hit) pickTask(hit.task.id);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor={`${listboxId}-filter`}>
          Filter by column
        </label>
        <select
          id={`${listboxId}-filter`}
          className="w-full shrink-0 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 sm:w-44"
          value={listFilter}
          onChange={(e) => setListFilter(e.target.value)}
        >
          <option value="">All columns</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            id={`${listboxId}-q`}
            type="search"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder="Search by title or description…"
            className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-10 pr-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onInputKeyDown}
          />
        </div>
      </div>

      {open && query.trim() ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Task suggestions"
          className="kanban-scroll absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
        >
          {suggestions.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-[#64748B]">
              No tasks match your search
              {listFilter ? " in this column" : ""}.
            </p>
          ) : (
            suggestions.map((hit, index) => {
              const theme = getListColumnTheme(hit.listId);
              return (
                <button
                  key={hit.task.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`flex w-full flex-col gap-0.5 border-b border-[#F1F5F9] px-3 py-2.5 text-left last:border-b-0 ${
                    index === activeIndex ? "bg-[#EEF2FF]" : "hover:bg-[#F8FAFC]"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pickTask(hit.task.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-1 min-w-0 flex-1 text-sm font-medium text-[#0F172A]">
                      {hit.task.title}
                    </span>
                    <span
                      className={`max-w-[40%] shrink-0 truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold ${theme.statsPill} ${theme.statsPillCount}`}
                    >
                      {hit.listTitle}
                    </span>
                  </div>
                  {hit.task.description ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-[#64748B]">
                      {hit.task.description}
                    </p>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
