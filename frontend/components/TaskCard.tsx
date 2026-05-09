"use client";

import { useEffect, useId, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/board";
import { useBoardStore } from "@/store/boardStore";

type TaskCardProps = {
  task: Task;
  listId: string;
};

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
    </svg>
  );
}

export function TaskCard({ task, listId }: TaskCardProps) {
  const updateTask = useBoardStore((s) => s.updateTask);
  const deleteTask = useBoardStore((s) => s.deleteTask);
  const pendingOpenTaskId = useBoardStore((s) => s.pendingOpenTaskId);
  const clearPendingOpenTask = useBoardStore((s) => s.clearPendingOpenTask);
  const [editOpen, setEditOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDescription, setDraftDescription] = useState(task.description);
  const titleId = useId();
  const descId = useId();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", listId },
  });

  useEffect(() => {
    if (!editOpen) {
      setDraftTitle(task.title);
      setDraftDescription(task.description);
    }
  }, [task.title, task.description, editOpen]);

  useEffect(() => {
    if (pendingOpenTaskId !== task.id) return;
    setEditOpen(true);
    clearPendingOpenTask();
  }, [pendingOpenTaskId, task.id, clearPendingOpenTask]);

  useEffect(() => {
    if (!editOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setEditOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editOpen]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function saveEdit() {
    updateTask(task.id, {
      title: draftTitle,
      description: draftDescription,
    });
    setEditOpen(false);
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`flex shrink-0 gap-2 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-[#F1F5F9] ${
          isDragging ? "z-10 opacity-90 shadow-lg ring-2 ring-[#6366F1]/30" : ""
        }`}
      >
        <button
          type="button"
          className={`shrink-0 cursor-grab touch-none rounded-l-[10px] border-r border-[#E2E8F0] px-1.5 py-2 text-[#64748B] hover:bg-[#EEF2F6] active:cursor-grabbing ${
            isDragging ? "cursor-grabbing" : ""
          }`}
          aria-label="Drag task"
          {...listeners}
        >
          <span className="flex flex-col gap-0.5" aria-hidden>
            <span className="h-0.5 w-3 rounded-full bg-current" />
            <span className="h-0.5 w-3 rounded-full bg-current" />
            <span className="h-0.5 w-3 rounded-full bg-current" />
          </span>
        </button>
        <div className="min-w-0 max-w-full flex-1 py-2 pr-1">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => setEditOpen(true)}
          >
            <div className="line-clamp-2 break-words text-sm font-medium text-[#0F172A]">
              {task.title}
            </div>
            {task.description ? (
              <p
                className="mt-1 line-clamp-3 break-words text-xs leading-relaxed text-[#64748B]"
                title={task.description}
              >
                {task.description}
              </p>
            ) : (
              <p className="mt-1 text-xs italic text-[#94A3B8]">Add description…</p>
            )}
          </button>
        </div>
        <button
          type="button"
          className="shrink-0 self-start rounded-md p-2 text-[#94A3B8] hover:bg-red-50 hover:text-red-600"
          aria-label="Delete task"
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
        >
          <TrashIcon />
        </button>
      </div>

      {editOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4"
          role="presentation"
          onClick={() => setEditOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="text-sm font-semibold text-[#0F172A]">
              Edit task
            </h2>
            <label className="mt-3 block text-xs font-medium text-[#64748B]">
              Title
              <input
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                autoFocus
              />
            </label>
            <label htmlFor={descId} className="mt-3 block text-xs font-medium text-[#64748B]">
              Description
              <textarea
                id={descId}
                rows={4}
                className="mt-1 w-full resize-y rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="Optional details…"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4F46E5]"
                onClick={saveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
