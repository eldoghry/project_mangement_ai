"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { List } from "@/types/board";
import { useBoardStore } from "@/store/boardStore";
import { TaskCard } from "@/components/TaskCard";
import { AddTaskModal } from "@/components/AddTaskModal";
import { getListColumnTheme } from "@/lib/listColumnTheme";

type ListColumnProps = {
  list: List;
};

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ListColumn({ list }: ListColumnProps) {
  const renameList = useBoardStore((s) => s.renameList);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(list.title);
  const [addOpen, setAddOpen] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${list.id}`,
    data: { type: "column", listId: list.id },
  });

  const taskIds = list.tasks.map((t) => t.id);
  const theme = getListColumnTheme(list.id);

  function commitRename() {
    renameList(list.id, draftTitle);
    setEditing(false);
  }

  return (
    <div
      className={`flex h-full max-h-full min-h-0 w-[280px] shrink-0 flex-col rounded-xl border ${theme.shell}`}
      data-list-id={list.id}
    >
      <div className={`flex items-center gap-2 px-3 py-2.5 ${theme.header}`}>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              className="w-full rounded-lg border border-[#6366F1] bg-white px-2 py-1 text-sm font-semibold text-[#0F172A] outline-none ring-2 ring-[#6366F1]/20"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraftTitle(list.title);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="flex w-full max-w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm font-semibold text-[#0F172A] hover:bg-black/[0.04]"
              onClick={() => {
                setDraftTitle(list.title);
                setEditing(true);
              }}
            >
              <span className="min-w-0 truncate">{list.title}</span>
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${theme.countBadge}`}
                aria-label={`${list.tasks.length} tasks in ${list.title}`}
              >
                {list.tasks.length}
              </span>
            </button>
          )}
        </div>
        <button
          type="button"
          className={`shrink-0 rounded-lg p-1.5 ${theme.addButton}`}
          aria-label={`Add task to ${list.title}`}
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon />
        </button>
      </div>

      <SortableContext id={list.id} items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`kanban-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 py-3 transition-colors ${
            isOver ? theme.dropOver : ""
          }`}
        >
          {list.tasks.map((task) => (
            <TaskCard key={task.id} task={task} listId={list.id} />
          ))}
          {list.tasks.length === 0 && (
            <p className="py-6 text-center text-xs text-[#64748B]">Drop tasks here</p>
          )}
        </div>
      </SortableContext>

      <AddTaskModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        listId={list.id}
        listTitle={list.title}
      />
    </div>
  );
}
