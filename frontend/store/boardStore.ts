import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import type { List, Task } from "@/types/board";

const BOARD_STORAGE_PREFIX = "kanban-board:";

const initialLists: List[] = [
  {
    id: "backlog",
    title: "Backlog",
    tasks: [
      {
        id: "seed-b1",
        title: "Dark mode",
        description: "Add a theme toggle and persist choice in localStorage.",
      },
      {
        id: "seed-b2",
        title: "Keyboard shortcuts",
        description: "N for new task, / to focus search when we add search.",
      },
      {
        id: "seed-b3",
        title: "Export board",
        description: "JSON download of lists and tasks for backup.",
      },
    ],
  },
  {
    id: "todo",
    title: "Todo",
    tasks: [
      {
        id: "seed-t1",
        title: "Polish list headers",
        description: "Slightly larger tap targets for rename on mobile.",
      },
      {
        id: "seed-t2",
        title: "Empty state copy",
        description: "Friendlier hint when a column has no tasks yet.",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    tasks: [
      {
        id: "seed-p1",
        title: "Drag and drop QA",
        description: "Verify reorder and cross-column moves on touch devices.",
      },
    ],
  },
  {
    id: "review",
    title: "Review",
    tasks: [
      {
        id: "seed-r1",
        title: "Board layout spacing",
        description: "Check horizontal scroll and min heights on small laptops.",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    tasks: [
      {
        id: "seed-d1",
        title: "Initial Kanban MVP",
        description: "Five lists, rename, create, reorder, move between lists.",
      },
      {
        id: "seed-d2",
        title: "Tailwind theme tokens",
        description: "Background, accent, and border colors from the spec.",
      },
    ],
  },
];

function uid() {
  return crypto.randomUUID();
}

function cloneLists(lists: List[]): List[] {
  return lists.map((list) => ({
    ...list,
    tasks: list.tasks.map((task) => ({ ...task })),
  }));
}

function getBoardStorageKey(username: string): string {
  return `${BOARD_STORAGE_PREFIX}${username.toLowerCase()}`;
}

function loadListsForUser(username: string): List[] {
  if (typeof window === "undefined") return cloneLists(initialLists);
  const raw = window.localStorage.getItem(getBoardStorageKey(username));
  if (!raw) return cloneLists(initialLists);
  try {
    const parsed = JSON.parse(raw) as List[];
    if (!Array.isArray(parsed)) return cloneLists(initialLists);
    return cloneLists(parsed);
  } catch {
    return cloneLists(initialLists);
  }
}

function persistListsForUser(username: string, lists: List[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getBoardStorageKey(username),
    JSON.stringify(cloneLists(lists)),
  );
}

type BoardState = {
  lists: List[];
  ownerUsername: string | null;
  /** When set, the matching `TaskCard` opens its edit modal then clears this. */
  pendingOpenTaskId: string | null;
  setOwner: (username: string) => void;
  clearOwner: () => void;
  requestOpenTask: (taskId: string) => void;
  clearPendingOpenTask: () => void;
  renameList: (listId: string, title: string) => void;
  addTask: (listId: string, title: string, description?: string) => void;
  updateTask: (
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description">>,
  ) => void;
  deleteTask: (taskId: string) => void;
  moveTaskOnDragEnd: (args: {
    activeId: string;
    overId: string;
    activeListId: string;
    overListId: string;
  }) => void;
};

export const useBoardStore = create<BoardState>((set) => ({
  lists: cloneLists(initialLists),
  ownerUsername: null,
  pendingOpenTaskId: null,

  setOwner: (username) =>
    set(() => ({
      ownerUsername: username,
      pendingOpenTaskId: null,
      lists: loadListsForUser(username),
    })),

  clearOwner: () =>
    set(() => ({
      ownerUsername: null,
      pendingOpenTaskId: null,
      lists: cloneLists(initialLists),
    })),

  requestOpenTask: (taskId) => set({ pendingOpenTaskId: taskId }),

  clearPendingOpenTask: () => set({ pendingOpenTaskId: null }),

  renameList: (listId, title) =>
    set((state) => {
      const lists = state.lists.map((l) =>
        l.id === listId ? { ...l, title: title.trim() || l.title } : l,
      );
      if (state.ownerUsername) {
        persistListsForUser(state.ownerUsername, lists);
      }
      return { lists };
    }),

  addTask: (listId, title, description = "") => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task: Task = {
      id: uid(),
      title: trimmed,
      description: description.trim(),
    };
    set((state) => {
      const lists = state.lists.map((l) =>
        l.id === listId ? { ...l, tasks: [...l.tasks, task] } : l,
      );
      if (state.ownerUsername) {
        persistListsForUser(state.ownerUsername, lists);
      }
      return { lists };
    });
  },

  updateTask: (taskId, updates) =>
    set((state) => {
      const lists = state.lists.map((list) => ({
        ...list,
        tasks: list.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const next = { ...t };
          if (updates.title !== undefined) {
            const trimmed = updates.title.trim();
            if (trimmed) next.title = trimmed;
          }
          if (updates.description !== undefined) {
            next.description = updates.description.trim();
          }
          return next;
        }),
      }));
      if (state.ownerUsername) {
        persistListsForUser(state.ownerUsername, lists);
      }
      return { lists };
    }),

  deleteTask: (taskId) =>
    set((state) => {
      const lists = state.lists.map((list) => ({
        ...list,
        tasks: list.tasks.filter((t) => t.id !== taskId),
      }));
      if (state.ownerUsername) {
        persistListsForUser(state.ownerUsername, lists);
      }
      return { lists };
    }),

  moveTaskOnDragEnd: ({ activeId, overId, activeListId, overListId }) =>
    set((state) => {
      const lists = state.lists.map((l) => ({
        ...l,
        tasks: [...l.tasks],
      }));

      const activeList = lists.find((l) => l.id === activeListId);
      const overList = lists.find((l) => l.id === overListId);
      if (!activeList || !overList) return state;

      if (activeListId === overListId) {
        const oldIndex = activeList.tasks.findIndex((t) => t.id === activeId);
        if (oldIndex === -1) return state;
        const newIndex =
          overId === overListId
            ? Math.max(0, activeList.tasks.length - 1)
            : activeList.tasks.findIndex((t) => t.id === overId);
        if (newIndex === -1 || oldIndex === newIndex) return state;
        activeList.tasks = arrayMove(activeList.tasks, oldIndex, newIndex);
        if (state.ownerUsername) {
          persistListsForUser(state.ownerUsername, lists);
        }
        return { lists };
      }

      const activeIndex = activeList.tasks.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return state;
      const [task] = activeList.tasks.splice(activeIndex, 1);
      if (!task) return state;

      const overIsContainer = overId === overListId;
      let insertIndex = overIsContainer
        ? overList.tasks.length
        : overList.tasks.findIndex((t) => t.id === overId);
      if (insertIndex < 0) insertIndex = overList.tasks.length;
      overList.tasks.splice(insertIndex, 0, task);
      if (state.ownerUsername) {
        persistListsForUser(state.ownerUsername, lists);
      }
      return { lists };
    }),
}));
