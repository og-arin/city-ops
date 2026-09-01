"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { api } from "@/lib/api";
import { MessageSquare, Send, Loader2, Sparkles, User, Bot } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_CHIPS = [
  "Barricade rules",
  "Length limits",
  "Telecom fees",
];

export interface RagChatHandle {
  sendQuery: (query: string) => void;
}

const RagChat = forwardRef<RagChatHandle>(function RagChat(_, ref) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const doSend = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const res = await api.askRAG(text.trim());
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠ Error: ${err instanceof Error ? err.message : "Failed to get response."}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Expose sendQuery for Auto-Audit bridge
  useImperativeHandle(ref, () => ({
    sendQuery: (q: string) => doSend(q),
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSend(query);
  };

  const handleChipClick = (chip: string) => {
    doSend(chip);
  };

  return (
    <div className="flex flex-col bg-slate-900/50 rounded-2xl border border-slate-700/50 shadow-inner p-4 space-y-3 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 text-slate-300">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-sm uppercase tracking-wider">Regulatory Assistant</h3>
      </div>

      {/* Message Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 text-sm bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 min-h-[160px] max-h-[350px]"
      >
        {messages.length === 0 && !loading && (
          <p className="text-slate-500 italic text-xs leading-relaxed">
            Ask a question about city regulations, or use the quick chips below.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <Bot className="w-4 h-4 text-indigo-400 flex-none mt-0.5" />
            )}
            <div
              className={`rounded-lg px-3 py-2 max-w-[90%] whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30"
                  : "bg-slate-800/60 text-slate-300 border border-slate-700/40"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <User className="w-4 h-4 text-slate-400 flex-none mt-0.5" />
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Consulting regulations...</span>
          </div>
        )}
      </div>

      {/* Quick Chips */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChipClick(chip)}
            disabled={loading}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a regulatory question..."
          className="flex-1 bg-slate-950 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl p-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
});

export default RagChat;
