"use client";

import { useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const MODELS = [
  { slug: "qwen3-8b", name: "Qwen3 8B", tier: "lite", credits: 2 },
  { slug: "llama-3.1-70b", name: "Llama 3.1 70B", tier: "standard", credits: 6 },
  { slug: "deepseek-v3", name: "DeepSeek V3", tier: "pro", credits: 10 },
];

const TIER_COLORS: Record<string, string> = {
  lite: "oklch(0.75 0.17 150)",
  standard: "oklch(0.74 0.15 250)",
  pro: "oklch(0.74 0.15 290)",
};

const DEMO_RESPONSES = [
  "Your prompt was encrypted before it left your device. A provider on the network ran this reply locally on their own GPU, and nothing about the exchange was logged. Payment for this job just settled automatically on Robinhood Chain.",
  "This reply came from an open-weight model with no content filter between you and the output. The provider only ever saw an encrypted payload, never your identity, and the session clears the moment you close it.",
  "Inference for this message was routed to a provider running an open-weight model. No corporate filter shaped the answer, no prompt was stored, and the payout for this job is already on-chain.",
];

function pickResponse(input: string): string {
  const idx = input.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % DEMO_RESPONSES.length;
  return DEMO_RESPONSES[idx];
}

const SEED_MESSAGES: Message[] = [
  { id: "seed-1", role: "user", content: "Write a regex that matches US phone numbers in a few common formats." },
  {
    id: "seed-2",
    role: "assistant",
    content:
      "Try this: /^(\\+1[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$/. It matches (555) 123-4567, 555-123-4567, and 5551234567, with or without a +1 prefix.",
  },
  { id: "seed-3", role: "user", content: "Can it also allow dots as separators, like 555.123.4567?" },
  {
    id: "seed-4",
    role: "assistant",
    content: "Yes, the [-.\\s]? groups already cover dots and spaces alongside hyphens, so 555.123.4567 matches as is.",
  },
];

export function ChatPreview() {
  const [selected, setSelected] = useState(MODELS[0]);
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function send() {
    const content = input.trim();
    if (!content || streaming) return;
    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }]);

    const responseText = pickResponse(content);
    setStreaming(true);
    setStreamedText("");
    let i = 0;
    intervalRef.current = setInterval(() => {
      i += Math.ceil(Math.random() * 4) + 1;
      if (i >= responseText.length) {
        i = responseText.length;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStreaming(false);
        setStreamedText("");
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: responseText }]);
      } else {
        setStreamedText(responseText.slice(0, i));
      }
    }, 16);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: "var(--surface-dark)" }}>
      {/* Model selector bar */}
      <div
        className="flex shrink-0 items-center gap-2 overflow-x-auto border-b px-4 py-2.5 [scrollbar-width:none]"
        style={{ background: "oklch(0.22 0.015 245)", borderColor: "oklch(1 0 0 / 0.08)" }}
      >
        {MODELS.map((m) => (
          <button
            key={m.slug}
            onClick={() => setSelected(m)}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-[500] transition ${
              selected.slug === m.slug ? "text-white" : "text-white/35 hover:text-white/60"
            }`}
            style={
              selected.slug === m.slug
                ? { background: "oklch(1 0 0 / 0.10)", border: "1px solid oklch(1 0 0 / 0.18)" }
                : { border: "1px solid oklch(1 0 0 / 0.08)" }
            }
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TIER_COLORS[m.tier] }} />
            {m.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !streaming ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "var(--gold)" }}>
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" style={{ color: "var(--surface-dark)" }}>
                <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="currentColor" />
                <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6H3z" fill="currentColor" />
              </svg>
            </div>
            <p className="text-[13px] font-[500] text-white">{selected.name}</p>
            <p className="mt-1 max-w-[220px] text-[11px] leading-relaxed text-white/40">
              Type a message below to see an encrypted, no-log reply from the network.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--gold)" }}>
                    <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3" style={{ color: "var(--surface-dark)" }}>
                      <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="currentColor" />
                      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6H3z" fill="currentColor" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-[10px] px-3 py-2 text-[12px] leading-relaxed ${
                    msg.role === "user" ? "rounded-tr-[3px] text-white/90" : "rounded-tl-[3px] text-white/90"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "oklch(0.30 0.02 244)", border: "1px solid oklch(1 0 0 / 0.12)" }
                      : { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {streaming && (
              <div className="flex justify-start gap-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--gold)" }}>
                  <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3" style={{ color: "var(--surface-dark)" }}>
                    <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="currentColor" />
                    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6H3z" fill="currentColor" />
                  </svg>
                </div>
                <div
                  className="max-w-[78%] rounded-[10px] rounded-tl-[3px] px-3 py-2 text-[12px] leading-relaxed text-white/90"
                  style={{ background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" }}
                >
                  {streamedText || (
                    <span className="flex gap-1 py-0.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1 w-1 animate-bounce rounded-full"
                          style={{ background: "oklch(1 0 0 / 0.3)", animationDelay: `${i * 120}ms` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t px-4 py-3" style={{ background: "oklch(0.22 0.015 245)", borderColor: "oklch(1 0 0 / 0.08)" }}>
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selected.name}...`}
            className="flex-1 resize-none rounded-[8px] px-3 py-2.5 text-[12px] text-white placeholder:text-white/25 outline-none"
            style={{ background: "oklch(0.185 0.015 245)", border: "1px solid oklch(1 0 0 / 0.12)", minHeight: "38px" }}
          />
          <button
            disabled={!input.trim() || streaming}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[8px] transition disabled:cursor-not-allowed disabled:opacity-30"
            style={{ background: "var(--gold)" }}
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" style={{ color: "var(--surface-dark)" }}>
              <path d="M10 15V5M5 10l5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="mt-2 flex items-center gap-2 text-[10px] text-white/25">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.75 0.17 150)" }} />
          Encrypted end-to-end · No logs · On Robinhood Chain
        </p>
      </div>
    </div>
  );
}
