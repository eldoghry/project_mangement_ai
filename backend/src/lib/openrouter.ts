const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODEL = 'openai/gpt-oss-120b:free';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: { role: string; content: string };
  }>;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Kanban AI Assistant',
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as object;
    throw new Error(`OpenRouter error ${res.status}: ${JSON.stringify(body)}`);
  }

  const data = await res.json() as OpenRouterResponse;
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No response from AI model');
  return content;
}