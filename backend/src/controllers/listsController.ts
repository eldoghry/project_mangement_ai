import { Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { List, ListWithTasks, Task } from '../models/types';

export function getLists(req: AuthRequest, res: Response): void {
  const db = getDb();
  const userId = req.user!.userId;

  const lists = db
    .prepare('SELECT * FROM lists WHERE user_id = ? ORDER BY position')
    .all(userId) as List[];

  const tasks = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY position')
    .all(userId) as Task[];

  const tasksByList = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.list_id]) acc[task.list_id] = [];
    acc[task.list_id].push(task);
    return acc;
  }, {});

  const result: ListWithTasks[] = lists.map((list) => ({
    ...list,
    tasks: tasksByList[list.id] ?? [],
  }));

  res.json(result);
}

const renamSchema = z.object({ title: z.string().min(1).max(100) });

export function renameList(req: AuthRequest, res: Response): void {
  const { title } = renamSchema.parse(req.body);
  const db = getDb();
  const userId = req.user!.userId;
  const { id } = req.params;
  const now = new Date().toISOString();

  const result = db
    .prepare('UPDATE lists SET title = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(title, now, id, userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'List not found' });
    return;
  }

  const updated = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(id, userId);
  res.json(updated);
}