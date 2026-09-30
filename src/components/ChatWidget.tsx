import { useEffect, useRef, useState } from "react";
import { convexApiBase } from "../convexUrl";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi mum 💛 I'm RashMum's 24/7 assistant. Ask me anything — joining, meetups near you, the helpline, sleep, feeding, or just how you're feeling. I'm here day and night.",
};

function getSessionId(): string {
  let id = localStorage.getItem("rashmum_chat_session");
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("rashmum_chat_session", id);
  }
  return id;
}

function renderContent(content: string) {
  // Very light formatting: bold + line breaks.
  return content.split("\n").map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
      <br />
    </span>
  ));
}

export default function ChatWidget({ live }: { live: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string>("");

  useEffect(() => {
    sessionRef.current = getSessionId();
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);

    if (!live) {
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Preview mode — I'll be fully live once Convex is connected. Meanwhile our helpline is 0800 123 4567, 24/7. 💛",
          },
        ]);
        setBusy(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(`${convexApiBase()}/api/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "chat:send",
          args: { sessionId: sessionRef.current, message: text },
          format: "json",
        }),
      });
      const out = await res.json();
      if (out.success === false) throw new Error(out.errorMessage ?? "Chat failed");

      // Fetch the conversation (action stored the reply server-side).
      const qRes = await fetch(`${convexApiBase()}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "chatStore:recentForSession",
          args: { sessionId: sessionRef.current, limit: 20 },
          format: "json",
        }),
      });
      const qOut = await qRes.json();
      const history = (qOut.value ?? []) as { role: "user" | "assistant"; content: string }[];
      if (history.length) {
        setMessages([WELCOME, ...history]);
      } else {
        throw new Error("No reply stored");
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry — I couldn't reach the server just now. Our helpline is **0800 123 4567** (24/7) and real mums are there right now. 💛",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    setMessages([WELCOME]);
    if (live && sessionRef.current) {
      fetch(`${convexApiBase()}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "chatStore:clearSession",
          args: { sessionId: sessionRef.current },
          format: "json",
        }),
      }).catch(() => {});
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-xl transition hover:scale-105 hover:bg-brand-600"
        aria-label="Chat with the RashMum 24/7 assistant"
      >
        {open ? (
          <span className="text-2xl">×</span>
        ) : (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-brand-400 opacity-60" />
            <span className="relative text-2xl">💬</span>
          </>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand-500 px-5 py-3.5 text-white">
            <div>
              <div className="text-[14px] font-bold">RashMum Assistant</div>
              <div className="flex items-center gap-1.5 text-[10px] opacity-90">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute h-full w-full animate-ping-slow rounded-full bg-green-300" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-green-300" />
                </span>
                Online 24/7 — answers in seconds
              </div>
            </div>
            <button onClick={clearChat} className="text-[11px] underline opacity-80 hover:opacity-100" title="Start a new chat">
              New
            </button>
          </div>

          <div ref={scrollRef} className="chat-scroll flex-1 space-y-3 overflow-y-auto bg-[#fdf8f9] px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                    m.role === "user" ? "rounded-br-sm bg-brand-500 text-white" : "rounded-bl-sm bg-white text-zinc-800 shadow-sm"
                  }`}
                >
                  {m.role === "assistant" ? renderContent(m.content) : m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-200 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-200 [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand-200 [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 bg-white px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type here… (Enter to send)"
                className="max-h-24 flex-1 resize-none rounded-2xl border border-zinc-200 px-4 py-2.5 text-[13px] focus:border-brand-500 focus:outline-none"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40"
                aria-label="Send message"
              >
                ↑
              </button>
            </div>
            <div className="mt-1.5 px-1 text-center text-[9px] leading-relaxed text-zinc-400">
              AI assistant, not medical advice. In crisis: 999 or Samaritans 116 123.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
