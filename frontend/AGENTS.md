# AGENTS.md

## Simple Kanban Board (Next.js)

A minimal Kanban board built with **Next.js** (App Router). The app focuses on simplicity, usability, and smooth drag-and-drop.

---

# 1. Project Goals

The board supports:

* Fixed **5 lists**
* **Rename** lists (titles are editable; list count is fixed)
* **Create** tasks (title + optional description)
* **Edit** tasks (title and description in a modal)
* **Delete** tasks (trash control on each card)
* **Reorder** tasks within a list
* **Move** tasks between lists
* **Search** tasks by title/description with suggestions
* **Filter search** by list/column
* **Header stats**: totals, per-list counts, and short insights
* **Authentication** (demo/static credentials) with login/logout
* **Per-user board state** persisted in localStorage

Priorities: **clean UI**, **simple architecture**, and **smooth dnd-kit** interactions.

---

# 2. Technology Stack

| Area | Choice |
|------|--------|
| Framework | Next.js (App Router) |
| Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| State | Zustand (`store/boardStore.ts`) |
| Auth | Zustand persist (`store/authStore.ts`) |
| Styling | Tailwind CSS |
| Rendering guard | Client-only board wrapper (`components/BoardClient.tsx`) to avoid hydration mismatch with interactive DnD tree |

---

# 3. Board Structure

Exactly **five** lists, shown **horizontally**, with stable ids:

1. `backlog` — Backlog  
2. `todo` — Todo  
3. `in-progress` — In Progress  
4. `review` — Review  
5. `done` — Done  

Lists cannot be added or removed; only titles can be renamed.

---

# 4. Task Rules

Each task:

* Belongs to **one** list  
* Has a **title** (required)  
* Has a **description** (optional, plain text)  
* Can be **reordered** in the same list  
* Can be **moved** to another list  
* Can be **deleted**  

**Interaction notes**

* **Drag** only from the **left handle** on the task card (avoids conflicting with click-to-edit).  
* **Click** the title/description area to **edit** (centered modal).  
* **Trash** icon deletes the task (no confirmation in current MVP).
* Card preview keeps a fixed size: long title/description are clamped with ellipsis (`...`).

Shape:

```
{
  id: string
  title: string
  description: string
}
```

---

# 5. List Rules

```
{
  id: string
  title: string
  tasks: Task[]
}
```

* Lists are fixed; names are editable.  
* **Add task**: **+** in the list header opens a **centered modal** (`AddTaskModal`) for title and description. There is **no** permanent add form at the bottom of columns (saves vertical space).  
* Each list header shows a **task count** badge next to the title.
* Task stacks scroll inside each list card when overflowing.

---

# 6. State Shape

```ts
type Board = { lists: List[] }

type List = {
  id: string
  title: string
  tasks: Task[]
}

type Task = {
  id: string
  title: string
  description: string
}
```

**Store actions / fields** (see `store/boardStore.ts`):

* `renameList`
* `addTask`
* `updateTask`
* `deleteTask`
* `moveTaskOnDragEnd`
* `pendingOpenTaskId` + `requestOpenTask` + `clearPendingOpenTask` (used by search suggestions to open a task modal)
* `ownerUsername` + `setOwner` + `clearOwner` (bind board state to authenticated user)

Initial board includes **seed / dummy tasks** across columns for demo purposes (in-memory only).

**Auth state** (see `store/authStore.ts`):

* `isAuthenticated`
* `username`
* `hasHydrated`
* `login(username, password)` — static check against demo credentials
* `logout()`

---

# 7. Folder Structure (actual)

```
/app
  layout.tsx
  page.tsx
  /login/page.tsx
  globals.css
/components
  AuthButton.tsx     — navbar login/logout actions
  BoardClient.tsx    — client mount gate for board (hydration-safe wrapper)
  Board.tsx          — DndContext, drag end → store
  ListColumn.tsx     — list shell, header, droppable + SortableContext
  TaskCard.tsx       — sortable task, edit modal, delete, drag handle
  AddTaskModal.tsx   — centered “new task” dialog
  TaskSearch.tsx     — search by title/description + list filter + suggestion dropdown
  BoardStats.tsx     — header metrics and insights
/lib
  listColumnTheme.ts — light tint per list id (cards + stats pills)
/store
  authStore.ts
  boardStore.ts
/types
  board.ts
```

---

# 8. Core Features (current)

* Rename lists  
* Create tasks (modal from list **+**)  
* Edit task title/description (modal)  
* Delete tasks  
* Reorder tasks within a column  
* Move tasks between columns  
* Search tasks by title/description tokens (case-insensitive)  
* Filter search by list (All columns / specific column)  
* Suggestion list (keyboard + mouse); picking an item opens that task’s edit modal  
* Login page with demo credentials (`user` / `password`)  
* Navbar auth button that toggles between **Login** and **Logout**  
* Board UI is shown only for authenticated users; otherwise a login-required panel is shown  
* Board data persists per user key in localStorage (`kanban-board:<username>`)  
* Board **statistics** in the page header: total tasks, **per-list pills** (colors match columns), and insights (e.g. completion %, pipeline count, backlog, busiest column, empty columns, tasks with descriptions)  
* **Per-list light theming**: each column (and matching stat pill) uses a soft tint (blue, indigo, amber, violet, green) via `getListColumnTheme(listId)`  
* Styled scrollbars (`.kanban-scroll`) for board/list/suggestions areas  
* Overflow-safe layout: board row scrolls horizontally; list task area scrolls vertically; task preview text is clamped with ellipsis  
* Hydration-safe board mount via `BoardClient`

Out of scope for now:

* Production authentication/authorization (demo auth is currently client-side only)  
* Backend API, database, and real-time sync  
* Server-side persistence / multi-device sync

---

# 9. Color Scheme

**Global / page**

* Primary background: `#F8FAFC`  
* Board strip: `#EEF2F6`  
* Text primary: `#0F172A`, secondary: `#64748B`  
* Borders: `#E2E8F0` (and list-specific borders in themes)  
* Primary accent (buttons, focus): `#6366F1`  
* Secondary accent (reference): `#8B5CF6`  

**List columns**

* Each list id has a **light** background + border + header strip defined in `lib/listColumnTheme.ts`, reused for **header stat pills** and some **insight highlights** so UI stays consistent.

Design tokens: soft shadows, ~12px rounding, minimal clutter.

---

# 10. Design Principles

* Clean spacing, soft shadows, rounded corners  
* Smooth drag feedback (`closestCorners`, pointer activation distance on drag)  
* Modals centered on the page for add/edit task  

---

# 11. UI Guidelines

* **Header**: app title on the left; **BoardStats** on the right (responsive stack on small screens); **TaskSearch** appears beneath as a second row.  
* **List card**: themed shell, **title row** with count badge and **+** for new task, scrollable task stack, **droppable** area for empty or filled columns.  
* **Task card**: drag handle | content preview (clamped) | trash.  
* **Search suggestions**: dropdown under search input with task title, short description preview, and list badge; Enter/Arrow/Escape supported.

---

# 12. Future Improvements

Ideas not implemented yet:

* **Secure auth** (replace static client-side credentials)  
* **Dark mode**  
* Due dates, labels, assignees  
* Backend / real-time collaboration  
* Optional confirm before delete, keyboard shortcuts  

Implemented since the original spec: **descriptions**, **delete**, **modals for add**, **seed data**, **stats**, **per-list colors**, **search + suggestions**, **overflow handling + custom scrollbars**, **hydration-safe board mount**, **demo auth (login/logout)**, **per-user localStorage board persistence**.

---

# 13. Current Project State (Summary)

The app is currently a complete, polished in-memory Kanban MVP with:

* Fixed five-column workflow and smooth drag-and-drop (`dnd-kit`)
* Full task lifecycle (add/edit/delete/move/reorder) with modals for add/edit
* Header analytics (totals, per-column pills, and operational insights)
* Search experience (query + column filter + suggestions that open tasks directly)
* Consistent per-column light visual themes across cards and stats
* Controlled overflow behavior with styled scrollbars and clamped previews
* Per-user board persistence in browser localStorage (for authenticated demo user)
* No backend database/API yet (state is not shared across devices)
* Auth is demo-only (client-side static credentials, not secure)
