import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import listsRoutes from './routes/lists';
import tasksRoutes from './routes/tasks';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/lists', listsRoutes);
  app.use('/api/tasks', tasksRoutes);

  app.use(errorHandler);

  return app;
}