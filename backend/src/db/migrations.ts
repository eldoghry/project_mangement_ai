import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
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

export function seedDemoUser(): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('user');
  if (existing) return;

  const id = uuidv4();
  const password_hash = bcrypt.hashSync('password', 10);
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, 'user', password_hash, now);
  seedUserLists(id);
}

const DEMO_TASKS: Array<{
  title: string;
  description: string;
  listId: (typeof DEFAULT_LISTS)[number]['id'];
  position: number;
}> = [
  // Backlog
  { listId: 'backlog', position: 0, title: 'Design new dashboard layout',  description: 'Create wireframes for the redesigned analytics dashboard' },
  { listId: 'backlog', position: 1, title: 'Research competitor features',  description: 'Look into what features similar products offer' },
  { listId: 'backlog', position: 2, title: 'Write API documentation',       description: '' },
  // Todo
  { listId: 'todo',    position: 0, title: 'Set up CI/CD pipeline',         description: 'Configure GitHub Actions for automated testing and deployment' },
  { listId: 'todo',    position: 1, title: 'Fix login page styling',        description: 'Align the login form properly on mobile screens' },
  { listId: 'todo',    position: 2, title: 'Add unit tests for auth module', description: '' },
  // In Progress
  { listId: 'in-progress', position: 0, title: 'Build user profile page',    description: 'Implement the user settings and profile editing UI' },
  { listId: 'in-progress', position: 1, title: 'Integrate payment gateway',  description: 'Connect Stripe for subscription billing' },
  // Review
  { listId: 'review',  position: 0, title: 'Code review: database schema',  description: 'Review the proposed changes to the users table' },
  { listId: 'review',  position: 1, title: 'QA: mobile responsiveness',     description: 'Test the board on various screen sizes' },
  // Done
  { listId: 'done',    position: 0, title: 'Initial project setup',         description: 'Set up repository, branching strategy, and development environment' },
  { listId: 'done',    position: 1, title: 'Design system foundation',      description: 'Created base colors, typography, and component library' },
];

export function seedDemoTasks(): void {
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE username = ?').get('user') as { id: string } | undefined;
  if (!user) return;

  const existing = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?').get(user.id) as { count: number };
  if (existing.count > 0) return;

  const insert = db.prepare(`
    INSERT INTO tasks (id, title, description, position, list_id, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const insertAll = db.transaction(() => {
    for (const t of DEMO_TASKS) {
      insert.run(uuidv4(), t.title, t.description, t.position, t.listId, user.id, now, now);
    }
  });

  insertAll();
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