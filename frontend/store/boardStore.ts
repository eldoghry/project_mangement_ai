import { create } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import type { List, Task } from "@/types/board";
import { api, ApiList } from "@/lib/api";

function toList(apiList: ApiList): List {
  return {
    id: apiList.id,
    title: apiList.title,
    tasks: [...apiList.tasks]
      .sort((a, b) => a.position - b.position)
      .map((t) => ({ id: t.id, title: t.title, description: t.description })),
  };
}

type BoardState = {
  lists: List[];
  ownerUsername: string | null;
  isLoading: boolean;
  error: string | null;
  pendingOpenTaskId: string | null;
  setOwner: (username: string) => Promise<void>;
  clearOwner: () => void;
  clearError: () => void;
  requestOpenTask: (taskId: string) => void;
  clearPendingOpenTask: () => void;
  renameList: (listId: string, title: string) => void;
  addTask: (listId: string, title: string, description?: string) => Promise<void>;
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

export const useBoardStore = create<BoardState>()((set, get) => ({
  lists: [],
  ownerUsername: null,
  isLoading: false,
  error: null,
  pendingOpenTaskId: null,

  setOwner: async (username) => {
    set({ ownerUsername: username, isLoading: true, error: null, pendingOpenTaskId: null });
    try {
      const apiLists = await api.lists.getAll();
      set({ lists: apiLists.map(toList), isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load board",
      });
    }
  },

  clearOwner: () =>
    set({ ownerUsername: null, lists: [], pendingOpenTaskId: null, error: null }),

  clearError: () => set({ error: null }),

  requestOpenTask: (taskId) => set({ pendingOpenTaskId: taskId }),

  clearPendingOpenTask: () => set({ pendingOpenTaskId: null }),

  renameList: (listId, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, title: trimmed } : l,
      ),
    }));
    api.lists.rename(listId, trimmed).catch((err: Error) =>
      set({ error: err.message }),
    );
  },

  addTask: async (listId, title, description = "") => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const position = get().lists.find((l) => l.id === listId)?.tasks.length ?? 0;
    try {
      const apiTask = await api.tasks.create({
        title: trimmed,
        description: description.trim(),
        listId,
        position,
      });
      const task: Task = {
        id: apiTask.id,
        title: apiTask.title,
        description: apiTask.description,
      };
      set((state) => ({
        lists: state.lists.map((l) =>
          l.id === listId ? { ...l, tasks: [...l.tasks, task] } : l,
        ),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to add task" });
    }
  },

  updateTask: (taskId, updates) => {
    set((state) => ({
      lists: state.lists.map((list) => ({
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
      })),
    }));
    api.tasks.update(taskId, updates).catch((err: Error) =>
      set({ error: err.message }),
    );
  },

  deleteTask: (taskId) => {
    set((state) => ({
      lists: state.lists.map((list) => ({
        ...list,
        tasks: list.tasks.filter((t) => t.id !== taskId),
      })),
    }));
    api.tasks.remove(taskId).catch((err: Error) =>
      set({ error: err.message }),
    );
  },

  moveTaskOnDragEnd: ({ activeId, overId, activeListId, overListId }) => {
    set((state) => {
      const lists = state.lists.map((l) => ({ ...l, tasks: [...l.tasks] }));
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
      return { lists };
    });

    // Fire API after state is updated so positions are correct
    const updatedLists = get().lists;
    if (activeListId === overListId) {
      const list = updatedLists.find((l) => l.id === activeListId);
      if (list) {
        api.tasks
          .reorder(activeListId, list.tasks.map((t) => t.id))
          .catch((err: Error) => set({ error: err.message }));
      }
    } else {
      const toList = updatedLists.find((l) => l.id === overListId);
      const position = toList
        ? toList.tasks.findIndex((t) => t.id === activeId)
        : 0;
      api.tasks
        .move(activeId, { toListId: overListId, position: Math.max(0, position) })
        .catch((err: Error) => set({ error: err.message }));
    }
  },
}));