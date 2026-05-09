import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { seedUserLists } from '../db/migrations';
import { User } from '../models/types';

const credentialsSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(6),
});

function signToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = credentialsSchema.parse(req.body);
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken(user.id, user.username);
  res.json({ token, user: { id: user.id, username: user.username } });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { username, password } = credentialsSchema.parse(req.body);
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, username, password_hash, now);

  seedUserLists(id);

  const token = signToken(id, username);
  res.status(201).json({ token, user: { id, username } });
}

export function logout(_req: Request, res: Response): void {
  res.json({ ok: true });
}