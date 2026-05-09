# CLAUDE.md — Backend

## Kanban Board Backend (TypeScript + Express + SQLite)

This document is the primary reference for any agent continuing work on this project.
Read this file fully before starting any task. Update it after every phase.

---

## 1. Project Overview

Full-stack Kanban board. Frontend is Next.js (already complete). This backend provides:

- JWT authentication (login + register)
- REST API for lists and tasks (SQLite persistence)
- Docker setup for running both services together
- AI assistant via OpenRouter (Phase 4 — complete)

**Frontend:** `frontend/` — Next.js, Zustand, Tailwind, dnd-kit
**Backend:** `backend/` — TypeScript, Express 5, SQLite (`better-sqlite3`)
**Plan:** `docs/PLAN.md` — master task list with checkbox status

---

## 2. Technology Stack

| Area | Choice |
|------|--------|
| Runtime | Node.js 20 LTS |
| Language | TypeScript (strict) |
| Framework | Express 5 |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT (`jsonwebtoken` 7d expiry) + bcrypt (`bcryptjs`) |
| Validation | Zod v4 (use `.issues` not `.errors`) |
| IDs | `uuid` v4 |
| AI | OpenRouter HTTP API (Phase 4) |
| Dev server | `ts-node-dev --respawn --transpile-only` |
| Build | `tsc` → `dist/` |

---

## 3. Folder Structure (actual)

```
backend/
  src/
    index.ts              — entry: creates data dir, runs migrations, seeds demo user, starts server
    app.ts                — Express factory: CORS, JSON, routes, error handler
    routes/
      auth.ts             — POST /api/auth/login|register|logout
      lists.ts            — GET /api/lists, PATCH /api/lists/:id
      tasks.ts            — POST/PATCH/DELETE /api/tasks, move, reorder
      ai.ts               — POST /api/ai/chat
    controllers/
      authController.ts   — login, register, logout handlers
      listsController.ts  — getLists, renameList
      tasksController.ts  — createTask, updateTask, deleteTask, moveTask, reorderTasks
      aiController.ts     — handleChat: board-aware Q&A + move action parsing + DB execution
    middleware/
      auth.ts             — requireAuth: JWT verify, attaches req.user
      errorHandler.ts     — global error handler (ZodError → 400, Error → 500)
    db/
      database.ts         — better-sqlite3 singleton (WAL mode, FK on)
      migrations.ts       — runMigrations(), seedDemoUser(), seedUserLists()
    models/
      types.ts            — User, List, Task, ListWithTasks interfaces
    lib/
      openrouter.ts       — OpenRouter HTTP client (chatCompletion helper, model: openai/gpt-oss-120b:free)
  data/
    kanban.db             — SQLite file (gitignored, created at runtime)
  Dockerfile
  tsconfig.json
  package.json
  .env                    — not committed; copy from root .env.example
  CLAUDE.md               — this file
```

---

## 4. Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID PK |
| username | TEXT | UNIQUE NOT NULL |
| password_hash | TEXT | bcrypt hash |
| created_at | TEXT | ISO timestamp |

### `lists`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | stable: `backlog` `todo` `in-progress` `review` `done` |
| title | TEXT | editable |
| position | INTEGER | 0-indexed order |
| user_id | TEXT | FK → users.id CASCADE |
| created_at / updated_at | TEXT | ISO timestamps |
| PK | (id, user_id) | composite |

### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID PK |
| title | TEXT | required |
| description | TEXT | default `''` |
| position | INTEGER | order within list |
| list_id | TEXT | FK → lists.id |
| user_id | TEXT | FK → users.id CASCADE |
| created_at / updated_at | TEXT | ISO timestamps |

**On first login/register**, `seedUserLists(userId)` inserts the 5 default lists for that user.
**On startup**, `seedDemoUser()` creates `user/password` if it doesn't exist.

---

## 5. API Endpoints

> All routes except `/api/auth/*` require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/auth/login` | `{ username, password }` | `{ token, user: { id, username } }` |
| POST | `/api/auth/register` | `{ username, password }` | `{ token, user: { id, username } }` |
| POST | `/api/auth/logout` | — | `{ ok: true }` |

### Lists
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/lists` | — | `ListWithTasks[]` sorted by position, tasks sorted by position |
| PATCH | `/api/lists/:id` | `{ title }` | updated `List` |

### Tasks
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/tasks` | `{ title, description?, listId, position }` | `Task` |
| PATCH | `/api/tasks/:id` | `{ title?, description? }` | `Task` |
| DELETE | `/api/tasks/:id` | — | `{ ok: true }` |
| PATCH | `/api/tasks/:id/move` | `{ toListId, position }` | `Task` |
| PATCH | `/api/tasks/reorder` | `{ listId, taskIds: string[] }` | `{ ok: true }` |

> **Route order matters:** `PATCH /api/tasks/reorder` must be registered before `PATCH /api/tasks/:id` in `routes/tasks.ts`, otherwise Express matches `/reorder` as an `:id`.

### AI
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/ai/chat` | `{ message, board? }` | `{ reply, action }` |

`board` (optional): `Array<{ id, title, tasks: Array<{ id, title, description }> }>` — current board snapshot sent from frontend.

`action`: `{ type: "move", taskId: string, toListId: string } | null`

When `action` is a move, the backend validates ownership and executes the DB update before responding, so the move is already persisted when the frontend receives the reply.

---

## 6. CORS Configuration

**Important — Express 5 + CORS gotchas fixed in Phase 3:**

```ts
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.options(/.*/, cors(corsOptions));  // Express 5: use regex, NOT '*'
app.use(cors(corsOptions));
```

- `app.options('*', ...)` crashes Express 5 (`path-to-regexp` no longer accepts bare `*`).
- Use `app.options(/.*/, ...)` instead.
- Both the explicit OPTIONS handler and `app.use(cors(...))` are required — one handles the preflight, the other sets headers on actual requests.

---

## 7. Authentication Flow

1. Client `POST /api/auth/login` → server bcrypt-verifies password → signs JWT `{ userId, username }` (7d).
2. Client stores token in `localStorage` as `kanban_token`.
3. All API requests send `Authorization: Bearer <token>`.
4. `requireAuth` middleware verifies token, attaches `req.user = { userId, username }`.
5. All DB queries scope by `user_id` — users only ever see their own data.

---

## 8. Frontend Integration Notes

**How the frontend connects (for reference when making backend changes):**

- API client: `frontend/lib/api.ts` — reads `NEXT_PUBLIC_API_URL`, injects token from `localStorage`.
- Auth store: `frontend/store/authStore.ts` — async `login()` / `register()` / `logout()`, persists `isAuthenticated` + `username` via Zustand persist.
- Board store: `frontend/store/boardStore.ts` — `setOwner()` fetches lists on login; all mutations are optimistic (local state first, then API fire-and-forget with error state on failure).
- JWT key in localStorage: `kanban_token`.
- Frontend env var: `NEXT_PUBLIC_API_URL=http://localhost:4000` in `frontend/.env.local`.

**Frontend Task/List shape** (what API responses must match):
```ts
type Task = { id: string; title: string; description: string }
type List = { id: string; title: string; tasks: Task[] }
```
Backend returns extra fields (`position`, `user_id`, etc.) which the frontend `toList()` helper silently ignores.

---

## 9. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `4000` |
| `JWT_SECRET` | JWT signing secret | — (required) |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `OPENROUTER_API_KEY` | For Phase 4 AI features | — |

Copy `root/.env.example` to `backend/.env` for local dev.

---

## 10. Running the Project

**Local dev (no Docker):**
```
# Windows
.\scripts\dev.ps1

# Mac/Linux
bash scripts/dev.sh
```
Starts backend on `:4000` and frontend on `:3000` concurrently.

**Docker:**
```
# Windows
.\scripts\run.ps1

# Mac/Linux
bash scripts/run.sh
```

**Backend only:**
```bash
cd backend
npm run dev     # ts-node-dev watch mode
npm run build   # compile to dist/
npm start       # run compiled dist/index.js
```

---

## 11. Known Issues & Decisions

| Decision | Reason |
|----------|--------|
| `app.options(/.*/, cors(...))` regex wildcard | Express 5 / path-to-regexp v8 breaks on bare `*` |
| Zod v4 uses `.issues` not `.errors` | Breaking change in Zod v4 |
| Demo user `user/password` seeded on startup | Preserves original frontend demo UX |
| Optimistic updates in frontend (not full sync) | Keeps UI instant; errors surface in error banner |
| `PATCH /tasks/reorder` registered before `PATCH /tasks/:id` | Express matches routes in order; `reorder` would be caught as an `:id` param otherwise |

---

## 12. Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | .gitignore files | ✅ Complete |
| 1 | Backend foundation (Express + SQLite + JWT) | ✅ Complete |
| 2 | Docker + run scripts (Mac/Linux/Windows) | ✅ Complete |
| 3 | Frontend–backend integration | ✅ Complete |
| 4 | AI assistant (OpenRouter) | ✅ Complete |

See `docs/PLAN.md` for full subtask breakdown and checkbox status.

---

## 13. Phase 4 Starting Point

When starting Phase 4, the agent should:

1. Read `docs/PLAN.md` subtasks 4.1–4.7.
2. Create `backend/src/lib/openrouter.ts` — typed wrapper for OpenRouter chat completions.
3. Create `backend/src/controllers/aiController.ts` and `backend/src/routes/ai.ts`.
4. Register `/api/ai/chat` in `app.ts`.
5. **First test:** send `{ message: "2+2" }` with no board context — verify the model responds before adding board-aware logic.
6. Then extend to accept `board` snapshot and handle move actions.
7. Then add the `AIChatPanel` component in the frontend.