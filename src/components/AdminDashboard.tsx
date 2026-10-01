import { useCallback, useEffect, useState } from "react";
import { convexApiBase } from "../convexUrl";

// ---------------------------------------------------------------------------
// Volunteer Hub — small admin view over the public Convex queries.
// Read-only except "mark handled"; same raw HTTP convention as the site.
// ---------------------------------------------------------------------------

type ContactMessage = {
  _id: string;
  _creationTime: number;
  kind: "join" | "contact";
  name: string;
  email: string;
  city?: string;
  babyAge?: string;
  message?: string;
  autoReplySent?: boolean;
  emailError?: string;
  status: "new" | "auto_replied" | "human_replied";
  createdAt: number;
};

type LogEntry = {
  _id: string;
  kind: "health_check" | "self_heal" | "retry" | "cleanup";
  ok: boolean;
  detail: string;
  createdAt: number;
};

type StatusData = { ok: boolean; detail: string; updatedAt: number };

type DashboardData = {
  messages: ContactMessage[];
  logs: LogEntry[];
  status: StatusData;
};

// Courtesy gate for volunteers — the underlying queries are public data.
// Override with VITE_ADMIN_PASSPHRASE if you want a different word.
const PASSPHRASE =
  (import.meta.env.VITE_ADMIN_PASSPHRASE as string | undefined) ?? "rashmum-volunteer";
const UNLOCK_KEY = "rashmum_admin_unlocked";
const REFRESH_MS = 20_000;

async function convexQuery<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${convexApiBase()}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  const out = await res.json();
  if (out?.success === false) throw new Error(out.errorMessage ?? "Query failed");
  return (out.value ?? out) as T;
}

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)}d ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function exactTime(ts: number): string {
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  );
}

const STATUS_STYLES: Record<ContactMessage["status"], string> = {
  new: "border-amber-200 bg-amber-50 text-amber-700",
  auto_replied: "border-brand-100 bg-brand-50 text-brand-600",
  human_replied: "border-green-200 bg-green-50 text-green-700",
};

const STATUS_LABELS: Record<ContactMessage["status"], string> = {
  new: "New",
  auto_replied: "Auto-replied",
  human_replied: "Handled",
};

const LOG_META: Record<LogEntry["kind"], { label: string; icon: string }> = {
  health_check: { label: "Health check", icon: "🩺" },
  self_heal: { label: "Self-heal", icon: "🔧" },
  retry: { label: "Retry", icon: "🔁" },
  cleanup: { label: "Cleanup", icon: "🧹" },
};

function StatusBadge({ status }: { status: ContactMessage["status"] }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</div>
      <div className="mt-1.5 font-serif text-[30px] font-bold leading-none">{value}</div>
      <div className="mt-2 text-[11px] text-zinc-500">{note}</div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-zinc-50 bg-cream px-5 py-4">
        <h2 className="flex items-center gap-2 text-[15px] font-bold">
          <span aria-hidden>{icon}</span> {title}
        </h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-500 shadow-sm">
          {count}
        </span>
      </header>
      {children}
    </section>
  );
}

function EmptyState({ title, note }: { title: string; note: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="text-2xl">🌱</div>
      <div className="mt-2 text-[13px] font-semibold text-zinc-600">{title}</div>
      <div className="mt-1 text-[12px] text-zinc-400">{note}</div>
    </div>
  );
}

function MessageRow({
  msg,
  onMarkHandled,
}: {
  msg: ContactMessage;
  onMarkHandled: (id: string) => void;
}) {
  const initial = msg.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <li className="border-b border-zinc-50 px-5 py-4 transition last:border-0 hover:bg-brand-50/40">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-[14px] font-bold text-brand-500">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <div className="truncate text-[14px] font-bold">{msg.name}</div>
            <time className="shrink-0 text-[11px] text-zinc-400" title={exactTime(msg.createdAt)}>
              {timeAgo(msg.createdAt)}
            </time>
          </div>
          <div className="truncate text-[12px] text-zinc-500">{msg.email}</div>

          {(msg.city || msg.babyAge) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {msg.city && (
                <span className="rounded-full bg-peach px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                  📍 {msg.city}
                </span>
              )}
              {msg.babyAge && (
                <span className="rounded-full bg-peach px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                  🍼 {msg.babyAge}
                </span>
              )}
            </div>
          )}

          {msg.message && (
            <p className="mt-2 rounded-xl bg-cream px-3 py-2 text-[12.5px] italic leading-relaxed text-zinc-600">
              “{msg.message}”
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={msg.status} />
            {msg.emailError ? (
              <span className="text-[10.5px] font-medium text-amber-600" title={msg.emailError}>
                ⚠ auto-reply queued — will retry
              </span>
            ) : msg.autoReplySent ? (
              <span className="text-[10.5px] font-medium text-zinc-400">✓ auto-reply sent</span>
            ) : null}
            {msg.status !== "human_replied" && (
              <button
                onClick={() => onMarkHandled(msg._id)}
                className="ml-auto rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold text-zinc-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
              >
                Mark handled
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6">
      <div className="w-full max-w-[380px] rounded-[28px] border border-zinc-100 bg-white p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192x192.png" alt="" className="h-11 w-11 rounded-2xl object-cover" />
          <div>
            <div className="font-serif text-[17px] font-bold leading-none">RashMum UK</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-brand-500">
              Volunteer Hub
            </div>
          </div>
        </div>
        <p className="mt-5 text-[13px] leading-relaxed text-zinc-500">
          Recent joins, messages and the 24/7 automation log — for RashMum volunteers only.
        </p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (value === PASSPHRASE) {
              sessionStorage.setItem(UNLOCK_KEY, "1");
              onUnlock();
            } else {
              setError(true);
            }
          }}
        >
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="Volunteer passphrase"
            aria-label="Volunteer passphrase"
            className="w-full rounded-full border border-zinc-200 px-5 py-3 text-[13px] focus:border-brand-500 focus:outline-none"
          />
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-2.5 text-center text-[12px] font-medium text-red-600">
              That passphrase isn’t right — try again.
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-brand-500 py-3.5 text-[14px] font-bold text-white transition hover:bg-brand-600"
          >
            Unlock dashboard →
          </button>
        </form>
        <div className="mt-5 text-center">
          <a href="#/" className="text-[12px] text-zinc-400 hover:text-brand-500">
            ← Back to rashmum.uk
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ live }: { live: boolean }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === "1");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Volunteer Hub — RashMum UK";
    window.scrollTo(0, 0);
    return () => {
      document.title = "RashMum UK — You're Not Alone, Mum";
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!live) return;
    setRefreshing(true);
    try {
      const [messages, logs, status] = await Promise.all([
        convexQuery<ContactMessage[]>("messagesStore:listRecent", { limit: 60 }),
        convexQuery<LogEntry[]>("automationStore:recentLogs", { limit: 60 }),
        convexQuery<StatusData>("status:getPublic", {}),
      ]);
      setData({ messages, logs, status });
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t reach the server");
    } finally {
      setRefreshing(false);
    }
  }, [live]);

  useEffect(() => {
    if (!unlocked || !live) return;
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [unlocked, live, refresh]);

  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} />;

  const joins = (data?.messages ?? []).filter((m) => m.kind === "join");
  const contacts = (data?.messages ?? []).filter((m) => m.kind === "contact");
  const all = data?.messages ?? [];
  const joinsToday = joins.filter((m) => isToday(m.createdAt)).length;
  const openCount = all.filter((m) => m.status === "new").length;
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentLogs = (data?.logs ?? []).filter((l) => l.createdAt >= dayAgo);
  const failingLogs = recentLogs.filter((l) => !l.ok).length;
  const status = data?.status;

  async function markHandled(id: string) {
    // Optimistic: flip the row, then reconcile with the server.
    setData((d) =>
      d ? { ...d, messages: d.messages.map((m) => (m._id === id ? { ...m, status: "human_replied" } : m)) } : d
    );
    try {
      await fetch(`${convexApiBase()}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "messagesStore:markHumanReplied", args: { id }, format: "json" }),
      });
    } catch {
      refresh();
    }
  }

  return (
    <div className="min-h-screen bg-peach">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192x192.png" alt="" className="h-9 w-9 rounded-xl object-cover" />
            <div>
              <div className="font-serif text-[15px] font-bold leading-none">RashMum UK</div>
              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-500">
                Volunteer Hub
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <span
                className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold sm:inline-flex ${
                  status.ok
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}
                title={status.detail}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${status.ok ? "bg-green-500" : "bg-red-500"} ${
                    status.ok ? "animate-ping-slow" : ""
                  }`}
                />
                {status.ok ? "All systems live" : "Issues detected"}
              </span>
            )}
            <span className="hidden text-[11px] text-zinc-400 md:inline" title={lastUpdated ? exactTime(lastUpdated) : ""}>
              {lastUpdated ? `Updated ${timeAgo(lastUpdated)}` : "Loading…"}
            </span>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="rounded-full border border-zinc-200 px-4 py-1.5 text-[12px] font-semibold text-zinc-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
            >
              {refreshing ? "Refreshing…" : "↻ Refresh"}
            </button>
            <a
              href="#/"
              className="rounded-full bg-brand-500 px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-brand-600"
            >
              View site
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-8">
        {!live && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-100 px-4 py-3 text-[12px] font-medium text-amber-900">
            Preview mode — the dashboard connects to live data once Convex is linked.
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-600">
            <span>⚠ {error}</span>
            <button onClick={refresh} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Joins today"
            value={live ? String(joinsToday) : "—"}
            note={`${joins.length} in the last 60`}
          />
          <StatCard
            label="Open messages"
            value={live ? String(openCount) : "—"}
            note="waiting for a volunteer"
          />
          <StatCard
            label="Automation · 24h"
            value={live ? String(recentLogs.length) : "—"}
            note={
              !live
                ? "preview mode"
                : failingLogs === 0
                  ? recentLogs.length
                    ? "all checks healthy"
                    : "waiting for first check"
                  : `${failingLogs} need attention`
            }
          />
          <StatCard
            label="Site status"
            value={!live ? "—" : status ? (status.ok ? "Live" : "Down") : "…"}
            note={status?.detail ?? (live ? "checking…" : "preview mode")}
          />
        </div>

        {/* Joins + messages */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
          <SectionCard title="Recent joins" icon="💛" count={joins.length}>
            {joins.length === 0 ? (
              <EmptyState title="No new mums yet" note="Join submissions will appear here in real time." />
            ) : (
              <ul>
                {joins.map((m) => (
                  <MessageRow key={m._id} msg={m} onMarkHandled={markHandled} />
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Messages" icon="✉️" count={contacts.length}>
            {contacts.length === 0 ? (
              <EmptyState title="Inbox is clear" note="Contact form messages will land here." />
            ) : (
              <ul>
                {contacts.map((m) => (
                  <MessageRow key={m._id} msg={m} onMarkHandled={markHandled} />
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Automation log */}
        <div className="mt-6">
          <SectionCard title="Automation log" icon="⚙️" count={data?.logs.length ?? 0}>
            {!data || data.logs.length === 0 ? (
              <EmptyState
                title={live ? "No automation activity yet" : "Preview mode"}
                note={
                  live
                    ? "Health checks, self-heals and retries stream in every few minutes."
                    : "Connect Convex to see the live 24/7 log."
                }
              />
            ) : (
              <ul>
                {data.logs.map((log) => {
                  const meta = LOG_META[log.kind];
                  return (
                    <li
                      key={log._id}
                      className="flex items-start gap-3 border-b border-zinc-50 px-5 py-3 last:border-0"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${log.ok ? "bg-green-500" : "bg-red-500"}`}
                        title={log.ok ? "OK" : "Failed"}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                            {meta.icon} {meta.label}
                          </span>
                          {!log.ok && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                              failed
                            </span>
                          )}
                          <time
                            className="ml-auto text-[11px] text-zinc-400"
                            title={exactTime(log.createdAt)}
                          >
                            {timeAgo(log.createdAt)}
                          </time>
                        </div>
                        <div className="mt-1 break-words text-[12.5px] leading-relaxed text-zinc-600">
                          {log.detail}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>

        <footer className="py-8 text-center text-[11px] text-zinc-400">
          RashMum UK Volunteer Hub • data refreshes every {REFRESH_MS / 1000}s •{" "}
          <a href="#/" className="underline hover:text-brand-500">
            back to the site
          </a>
        </footer>
      </main>
    </div>
  );
}
