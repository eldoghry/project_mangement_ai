import { Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { Task } from '../models/types';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  listId: z.string().min(1),
  position: z.number().int().min(0),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

const moveSchema = z.object({
  toListId: z.string().min(1),
  position: z.number().int().min(0),
});

const reorderSchema = z.object({
  listId: z.string().min(1),
  taskIds: z.array(z.string()).min(1),
});

export function createTask(req: AuthRequest, res: Response): void {
  const { title, description, listId, position } = createSchema.parse(req.body);
  const db = getDb();
  const userId = req.user!.userId;

  const list = db.prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?').get(listId, userId);
  if (!list) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO tasks (id, title, description, position, list_id, user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description, position, listId, userId, now, now);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(task);
}

export function updateTask(req: AuthRequest, res: Response): void {
  const { title, description } = updateSchema.parse(req.body);
  const db = getDb();
  const userId = req.user!.userId;
  const { id } = req.params;
  const now = new Date().toISOString();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId) as Task | undefined;
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  db.prepare(`
    UPDATE tasks SET
      title = ?,
      description = ?,
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? task.title,
    description ?? task.description,
    now,
    id,
    userId
  );

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(updated);
}

export function deleteTask(req: AuthRequest, res: Response): void {
  const db = getDb();
  const userId = req.user!.userId;
  const { id } = req.params;

  const result = db
    .prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
    .run(id, userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({ ok: true });
}

export function moveTask(req: AuthRequest, res: Response): void {
  const { toListId, position } = moveSchema.parse(req.body);
  const db = getDb();
  const userId = req.user!.userId;
  const { id } = req.params;
  const now = new Date().toISOString();

  const list = db.prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?').get(toListId, userId);
  if (!list) {
    res.status(404).json({ error: 'Target list not found' });
    return;
  }

  const result = db.prepare(`
    UPDATE tasks SET list_id = ?, position = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(toListId, position, now, id, userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(updated);
}

export function reorderTasks(req: AuthRequest, res: Response): void {
  const { listId, taskIds } = reorderSchema.parse(req.body);
  const db = getDb();
  const userId = req.user!.userId;
  const now = new Date().toISOString();

  const update = db.prepare(`
    UPDATE tasks SET position = ?, updated_at = ?
    WHERE id = ? AND list_id = ? AND user_id = ?
  `);

  const updateAll = db.transaction(() => {
    taskIds.forEach((taskId, index) => {
      update.run(index, now, taskId, listId, userId);
    });
  });

  updateAll();
  res.json({ ok: true });
}