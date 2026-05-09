import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { chatCompletion } from '../lib/openrouter';
import { getDb } from '../db/database';

const boardTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

const boardListSchema = z.object({
  id: z.string(),
  title: z.string(),
  tasks: z.array(boardTaskSchema),
});

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  board: z.array(boardListSchema).optional(),
});

type BoardList = z.infer<typeof boardListSchema>;

interface MoveAction {
  type: 'move';
  taskId: string;
  toListId: string;
}

interface AiJsonResponse {
  reply?: string;
  action?: MoveAction | null;
}

function buildBoardContext(board: BoardList[]): string {
  return board
    .map((list) => {
      const tasks =
        list.tasks.length > 0
          ? list.tasks
              .map(
                (t) =>
                  `    - "${t.title}" (id: ${t.id})` +
                  (t.description ? ` — ${t.description.slice(0, 80)}` : ''),
              )
              .join('\n')
          : '    (empty)';
      return `  List: "${list.title}" (id: ${list.id})\n${tasks}`;
    })
    .join('\n');
}

function buildSystemPrompt(board?: BoardList[]): string {
  const boardSection =
    board && board.length > 0
      ? `\nCURRENT BOARD STATE:\n${buildBoardContext(board)}\n`
      : '\n(No board state provided.)\n';

  return `You are an AI assistant for a Kanban board application. Help users understand and manage their tasks.
${boardSection}
When the user asks to MOVE a task to a different list, respond with ONLY valid JSON in this exact format:
{"reply":"<short confirmation>","action":{"type":"move","taskId":"<exact task id>","toListId":"<exact list id>"}}

For all other messages (questions, summaries, counts, etc.), respond with ONLY valid JSON:
{"reply":"<your answer>"}

Rules:
- Always use the exact task IDs and list IDs shown in the board state above.
- Do not wrap your response in markdown code fences — return raw JSON only.
- If you cannot identify the task or list the user refers to, omit action and explain in reply.`;
}

function parseAiResponse(raw: string): { reply: string; action: MoveAction | null } {
  const clean = raw
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  try {
    const parsed = JSON.parse(clean) as AiJsonResponse;
    const reply = parsed.reply ?? raw;
    const a = parsed.action;
    const action =
      a && a.type === 'move' && a.taskId && a.toListId
        ? { type: 'move' as const, taskId: a.taskId, toListId: a.toListId }
        : null;
    return { reply, action };
  } catch {
    return { reply: raw, action: null };
  }
}

export async function handleChat(req: AuthRequest, res: Response): Promise<void> {
  const { message, board } = chatSchema.parse(req.body);
  const userId = req.user!.userId;

  const systemPrompt = buildSystemPrompt(board);
  const rawAi = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ]);

  let { reply, action } = parseAiResponse(rawAi);

  if (action) {
    const db = getDb();
    const now = new Date().toISOString();

    const task = db
      .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
      .get(action.taskId, userId);
    const list = db
      .prepare('SELECT id FROM lists WHERE id = ? AND user_id = ?')
      .get(action.toListId, userId);

    if (!task || !list) {
      reply += ' (Move failed: task or list not found on server.)';
      action = null;
    } else {
      const { count } = db
        .prepare('SELECT COUNT(*) as count FROM tasks WHERE list_id = ? AND user_id = ?')
        .get(action.toListId, userId) as { count: number };

      db.prepare(
        'UPDATE tasks SET list_id = ?, position = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      ).run(action.toListId, count, now, action.taskId, userId);
    }
  }

  res.json({ reply, action });
}