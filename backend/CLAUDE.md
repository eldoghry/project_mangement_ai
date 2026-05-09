# CLAUDE.md — Backend

## Kanban Board Backend (TypeScript + Express + SQLite)

This document describes the backend architecture, conventions, and current implementation state.
Update this file whenever a new endpoint, schema change, or architectural decision is made.

---

## 1. Project Goals

Provide a REST API backend that:

* Replaces the frontend's localStorage persistence with a real database
* Upgrades demo auth to proper JWT-based authentication
* Exposes CRUD operations for lists and tasks (matching the frontend data model)
* Hosts an AI assistant endpoint powered by OpenRouter for board Q&A and card movement
* Runs alongside the frontend inside Docker

---

## 2. Technology Stack

| Area | Choice |
|------|--------|
| Runtime | Node.js (LTS) |
| Language | TypeScript (strict mode) |
| Framework | Express |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Validation | Zod |
| AI | OpenRouter API (HTTP) |
| Dev server | `ts-node-dev` |
| Build | `tsc` → `dist/` |

---

## 3. Folder Structure (planned)

```
backend/
  src/
    index.ts            — entry point, starts server
    app.ts              — Express app factory
    routes/
      auth.ts
      lists.ts
      tasks.ts
      ai.ts
    controllers/
      authController.ts
      listsController.ts
      tasksController.ts
      aiController.ts
    middleware/
      auth.ts           — JWT verify middleware
      errorHandler.ts   — global error handler
    db/
      database.ts       — SQLite singleton
      migrations.ts     — schema + seed on startup
    models/
      user.ts
      list.ts
      task.ts
    lib/
      openrouter.ts     — OpenRouter API client
  Dockerfile
  tsconfig.json
  package.json
  .env                  — not committed (see .env.example at root)
  CLAUDE.md             — this file
```

---

## 4. Database Schema

### `users`

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID primary key |
| username | TEXT | unique, not null |
| password_hash | TEXT | bcrypt hash |
| created_at | TEXT | ISO timestamp |

### `lists`

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | stable ids: `backlog`, `todo`, `in-progress`, `review`, `done` |
| title | TEXT | editable display name |
| position | INTEGER | order (0-indexed) |
| user_id | TEXT | FK → users.id |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

### `tasks`

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | UUID |
| title | TEXT | required |
| description | TEXT | optional |
| position | INTEGER | order within list |
| list_id | TEXT | FK → lists.id |
| user_id | TEXT | FK → users.id |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

---

## 5. API Endpoints

> All routes (except auth) require `Authorization: Bearer <token>` header.

### Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/auth/login` | `{ username, password }` | `{ token, user: { id, username } }` |
| POST | `/api/auth/register` | `{ username, password }` | `{ token, user: { id, username } }` |
| POST | `/api/auth/logout` | — | `{ ok: true }` |

### Lists

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/lists` | — | `List[]` (with nested tasks) |
| PATCH | `/api/lists/:id` | `{ title }` | `List` |

### Tasks

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/tasks` | `{ title, description?, listId, position }` | `Task` |
| PATCH | `/api/tasks/:id` | `{ title?, description? }` | `Task` |
| DELETE | `/api/tasks/:id` | — | `{ ok: true }` |
| PATCH | `/api/tasks/:id/move` | `{ toListId, position }` | `Task` |
| PATCH | `/api/tasks/reorder` | `{ listId, taskIds: string[] }` | `{ ok: true }` |

### AI (Phase 4)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/ai/chat` | `{ message, board? }` | `{ reply, action? }` |

`action` (optional): `{ type: "move", taskId: string, toListId: string }` — returned when AI instructs a card move.

---

## 6. Authentication Flow

1. Client sends `POST /api/auth/login` with `{ username, password }`.
2. Server looks up user by username, verifies bcrypt hash.
3. On success, server signs a JWT with payload `{ userId, username }` and `JWT_SECRET`.
4. Client stores JWT in `localStorage` as `kanban_token`.
5. All subsequent API requests include `Authorization: Bearer <token>`.
6. `auth` middleware validates the token and attaches `req.user` to the request.
7. On 401, frontend redirects to `/login`.

---

## 7. Error Response Format

```json
{
  "error": "Human-readable message",
  "code": "OPTIONAL_ERROR_CODE"
}
```

HTTP status codes: `400` validation, `401` unauthorized, `403` forbidden, `404` not found, `500` server error.

---

## 8. Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `4000`) |
| `JWT_SECRET` | Secret for signing JWTs |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features |
| `NODE_ENV` | `development` or `production` |

---

## 9. AI Integration (Phase 4)

* Uses OpenRouter's chat completion API with a free model (e.g. `mistralai/mistral-7b-instruct:free`).
* The system prompt includes the current board state (all lists + task titles/descriptions) as structured context.
* The model can respond with plain text (Q&A) or a structured action object (card move).
* First test: send `"2+2"` with no board context to confirm connectivity before adding board logic.

---

## 10. Implementation Status

> Updated as phases are completed. See `docs/PLAN.md` for detailed subtask tracking.

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | .gitignore Files | ✅ Complete |
| 1 | Backend Foundation | ✅ Complete |
| 2 | Docker & Run Scripts | Not started |
| 3 | Frontend–Backend Integration | Not started |
| 4 | AI Integration | Not started |

---

## 11. Frontend Reference

See `frontend/AGENTS.md` for:

* Frontend data model (`Task`, `List`, `Board`)
* Zustand store actions (`addTask`, `updateTask`, `deleteTask`, `moveTaskOnDragEnd`, etc.)
* Auth store (`login`, `logout`, `isAuthenticated`)
* Component structure and state shape

Backend API responses must match the shapes the frontend stores expect.
