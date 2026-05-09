import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createApp } from './app';
import { runMigrations, seedDemoUser, seedDemoTasks } from './db/migrations';

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

runMigrations();
seedDemoUser();
seedDemoTasks();

const PORT = parseInt(process.env.PORT ?? '4000', 10);
const app = createApp();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});