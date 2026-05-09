"use client";

import { useRef, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useBoardStore } from "@/store/boardStore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lists = useBoardStore((s) => s.lists);
  const moveTaskToList = useBoardStore((s) => s.moveTaskToList);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const { reply, action } = await api.ai.chat({
        message: trimmed,
        board: lists.map((l) => ({
          id: l.id,
          title: l.title,
          tasks: l.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
          })),
        })),
      });

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      if (action?.type === "move") {
        moveTaskToList(action.taskId, action.toListId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[440px] w-80 flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-[#6366F1] px-4 py-3">
            <span className="text-sm font-semibold text-white">AI Assistant</span>
            <button
              onClick={() => setOpen(false)}
              className="text-indigo-200 transition-colors hover:text-white"
              aria-label="Close AI assistant"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="mt-6 text-center text-xs leading-5 text-[#94A3B8]">
                Ask me about your board or move a card.
                <br />
                e.g. &ldquo;Move &lsquo;Fix bug&rsquo; to Done&rdquo;
              </p>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-5 ${
                    msg.role === "user"
                      ? "bg-[#6366F1] text-white"
                      : "bg-[#F1F5F9] text-[#0F172A]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-[#F1F5F9] px-3 py-2">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="h-2 w-2 animate-bounce rounded-full bg-[#94A3B8]"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-center text-xs text-red-500">{error}</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[#E2E8F0] p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask me anything…"
                disabled={loading}
                className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="rounded-lg bg-[#6366F1] px-3 py-2 text-sm text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6366F1] text-white shadow-lg transition-colors hover:bg-[#4F46E5]"
        aria-label="Toggle AI assistant"
      >
        {open ? (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
          </svg>
        )}
      </button>
    </div>
  );
}