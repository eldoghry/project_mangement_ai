"use client";

import { useEffect, useId, useState } from "react";
import { useBoardStore } from "@/store/boardStore";

type AddTaskModalProps = {
  open: boolean;
  onClose: () => void;
  listId: string;
  listTitle: string;
};

export function AddTaskModal({
  open,
  onClose,
  listId,
  listTitle,
}: AddTaskModalProps) {
  const addTask = useBoardStore((s) => s.addTask);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const headingId = useId();
  const descFieldId = useId();

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
    }
  }, [open, listId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(listId, title, description);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="w-full max-w-md rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={headingId} className="text-sm font-semibold text-[#0F172A]">
          New task
        </h2>
        <p className="mt-1 text-xs text-[#64748B]">Adding to “{listTitle}”</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-[#64748B]">
            Title
            <input
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </label>
          <label htmlFor={descFieldId} className="block text-xs font-medium text-[#64748B]">
            Description
            <textarea
              id={descFieldId}
              rows={4}
              className="mt-1 w-full resize-y rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
              placeholder="Optional details…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4F46E5]"
            >
              Add task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
