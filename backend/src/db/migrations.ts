import { getDb } from './database';

const DEFAULT_LISTS = [
  { id: 'backlog',     title: 'Backlog',      position: 0 },
  { id: 'todo',        title: 'Todo',         position: 1 },
  { id: 'in-progress', title: 'In Progress',  position: 2 },
  { id: 'review',      title: 'Review',       position: 3 },
  { id: 'done',        title: 'Done',         position: 4 },
];

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      username     TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lists (
      id         TEXT NOT NULL,
      title      TEXT NOT NULL,
      position   INTEGER NOT NULL,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      position    INTEGER NOT NULL,
      list_id     TEXT NOT NULL,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      FOREIGN KEY (list_id, user_id) REFERENCES lists(id, user_id) ON DELETE CASCADE
    );
  `);
}

export function seedUserLists(userId: string): void {
  const db = getDb();
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT OR IGNORE INTO lists (id, title, position, user_id, created_at, updated_at)
    VALUES (@id, @title, @position, @userId, @now, @now)
  `);

  const insertMany = db.transaction(() => {
    for (const list of DEFAULT_LISTS) {
      insert.run({ ...list, userId, now });
    }
  });

  insertMany();
}