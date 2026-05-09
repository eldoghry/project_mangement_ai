const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kanban_token");
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err = new Error(
      (body as { error?: string }).error ?? `HTTP ${res.status}`,
    );
    (err as Error & { status: number }).status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

export interface ApiTask {
  id: string;
  title: string;
  description: string;
  position: number;
  list_id: string;
}

export interface ApiList {
  id: string;
  title: string;
  position: number;
  tasks: ApiTask[];
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      req<{ token: string; user: { id: string; username: string } }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ username, password }) },
      ),
    register: (username: string, password: string) =>
      req<{ token: string; user: { id: string; username: string } }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify({ username, password }) },
      ),
  },
  lists: {
    getAll: () => req<ApiList[]>("/api/lists"),
    rename: (id: string, title: string) =>
      req<ApiList>(`/api/lists/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
  },
  tasks: {
    create: (data: {
      title: string;
      description: string;
      listId: string;
      position: number;
    }) =>
      req<ApiTask>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { title?: string; description?: string }) =>
      req<ApiTask>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      req<{ ok: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),
    move: (id: string, data: { toListId: string; position: number }) =>
      req<ApiTask>(`/api/tasks/${id}/move`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    reorder: (listId: string, taskIds: string[]) =>
      req<{ ok: boolean }>("/api/tasks/reorder", {
        method: "PATCH",
        body: JSON.stringify({ listId, taskIds }),
      }),
  },
  ai: {
    chat: (data: {
      message: string;
      board?: Array<{
        id: string;
        title: string;
        tasks: Array<{ id: string; title: string; description: string }>;
      }>;
    }) =>
      req<{
        reply: string;
        action:
          | { type: 'move'; taskId: string; toListId: string }
          | { type: 'create'; id: string; title: string; description: string; listId: string }
          | null;
      }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};