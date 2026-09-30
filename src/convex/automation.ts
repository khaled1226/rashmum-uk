"use node";

import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { emailShell, sendEmailViaResend } from "./email";

const ALERT_EMAIL = process.env.ALERT_EMAIL;
const SITE_URL = process.env.SITE_URL ?? "";

// ---------- Internal helpers ----------

type LogKind = "health_check" | "self_heal" | "retry" | "cleanup";

async function log(ctx: any, kind: LogKind, ok: boolean, detail: string) {
  await ctx.runMutation(api.automationStore.addLog, { kind, ok, detail });
}

async function writeStatus(ctx: any, key: string, ok: boolean, detail: string) {
  await ctx.runMutation(api.automationStore.setStatus, { key, ok, detail });
}

async function checkEndpoint(url: string, label: string): Promise<{ ok: boolean; detail: string }> {
  const started = Date.now();
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(10_000) });
    const ms = Date.now() - started;
    if (res.ok) return { ok: true, detail: `${label} responded ${res.status} in ${ms}ms` };
    return { ok: false, detail: `${label} returned HTTP ${res.status} after ${ms}ms` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, detail: `${label} failed: ${msg.slice(0, 150)}` };
  }
}

async function checkConvexBackend(): Promise<{ ok: boolean; detail: string }> {
  // Reaching this code at all means the Convex runtime is executing actions
  // (and crons trigger this without HTTP), so the backend is alive.
  return { ok: true, detail: "Convex backend executing actions normally" };
}

async function sendAlertEmail(subject: string, bodyHtml: string): Promise<{ ok: boolean; error?: string }> {
  if (!ALERT_EMAIL) return { ok: false, error: "ALERT_EMAIL not configured" };
  return sendEmailViaResend({
    to: ALERT_EMAIL,
    subject,
    html: emailShell(subject, bodyHtml),
  });
}

// ---------- Actions run by cron ----------

// Health check every 5 minutes: backend + site, then self-heal retries.
export const runHealthCheck = action({
  args: {},
  handler: async (ctx) => {
    const backend = await checkConvexBackend();
    const results = [backend];

    if (SITE_URL) {
      results.push(await checkEndpoint(SITE_URL, "Site"));
    }

    const allOk = results.every((r) => r.ok);
    await writeStatus(ctx, "backend", backend.ok, backend.detail);
    if (SITE_URL) {
      await writeStatus(ctx, "site", results[1]?.ok ?? false, results[1]?.detail ?? "");
    }

    await log(ctx, "health_check", allOk, results.map((r) => r.detail).join(" | "));

    // Self-healing: if something is down, immediately attempt a recovery cycle.
    if (!allOk) {
      await ctx.runAction(api.automation.attemptSelfHeal, {});
    }

    return { allOk, results };
  },
});

// Self-heal: retry failed auto-reply emails and alert a human if things persist.
export const attemptSelfHeal = action({
  args: {},
  handler: async (ctx) => {
    const recent = await ctx.runQuery(api.messagesStore.listRecent, { limit: 50 });
    const pending = recent.filter((m) => !m.autoReplySent);

    let retried = 0;
    let recovered = 0;
    const failures: string[] = [];

    for (const m of pending.slice(0, 10)) {
      retried++;
      const result = await ctx.runAction(api.messages.sendAutoReply, { id: m._id });
      if (result.ok) {
        recovered++;
      } else {
        failures.push(`${m.email}: ${result.error ?? "unknown error"}`);
      }
    }

    if (retried > 0) {
      await log(
        ctx,
        recovered === retried ? "self_heal" : "retry",
        recovered === retried,
        `Auto-reply retry cycle: ${recovered}/${retried} recovered${failures.length ? ` — ${failures[0]}` : ""}`
      );
    }

    // Site unhealthy? Email the humans.
    const statusRows = await ctx.runQuery(api.status.getDetail, {});
    const site = statusRows.find((r: { key: string }) => r.key === "site");
    if (site && !site.ok) {
      const alert = await sendAlertEmail(
        "🚨 RashMum UK needs attention",
        `<p>The automated health check found a problem it couldn't self-heal:</p>
         <pre style="background:#fff0f6;padding:12px;border-radius:8px;">${site.detail}</pre>
         <p>Retries were attempted automatically. If this keeps happening, check the hosting dashboard and Convex logs.</p>`
      );
      await log(ctx, "self_heal", false, `Alert email: ${alert.ok ? "sent" : (alert.error ?? "failed")}`);
    }

    return { retried, recovered };
  },
});

// Daily 8am digest for the volunteer team.
export const sendDailyDigest = action({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.runQuery(api.messagesStore.listRecent, { limit: 200 });
    const last24h = messages.filter((m: { createdAt: number }) => m.createdAt > Date.now() - 24 * 60 * 60 * 1000);
    const joins = last24h.filter((m: { kind: string }) => m.kind === "join");
    const contacts = last24h.filter((m: { kind: string }) => m.kind === "contact");
    const pendingReplies = last24h.filter((m: { autoReplySent?: boolean }) => !m.autoReplySent);

    const logs = await ctx.runQuery(api.automationStore.recentLogs, { limit: 50 });
    const last24hLogs = logs.filter((l: { createdAt: number }) => l.createdAt > Date.now() - 24 * 60 * 60 * 1000);
    const failedChecks = last24hLogs.filter(
      (l: { kind: string; ok: boolean }) => l.kind === "health_check" && !l.ok
    ).length;

    const rows = last24h
      .slice(0, 15)
      .map(
        (m: { kind: string; name: string; city?: string; autoReplySent?: boolean }) =>
          `<tr>
            <td style="padding:6px 10px;border-bottom:1px solid #ffe4ef;">${m.kind === "join" ? "💛 Join" : "💬 Message"}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #ffe4ef;">${m.name}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #ffe4ef;">${m.city ?? "—"}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #ffe4ef;">${m.autoReplySent ? "✅" : "⏳"}</td>
          </tr>`
      )
      .join("");

    const html = `
      <p>Morning, RashMum team! Here's what happened in the last 24 hours. 💛</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr>
          <td style="padding:10px;background:#fff0f6;border-radius:8px;text-align:center;"><strong style="font-size:20px;">${joins.length}</strong><br/>new joins</td>
          <td style="padding:10px;background:#fff0f6;border-radius:8px;text-align:center;"><strong style="font-size:20px;">${contacts.length}</strong><br/>messages</td>
          <td style="padding:10px;background:#fff0f6;border-radius:8px;text-align:center;"><strong style="font-size:20px;">${pendingReplies.length}</strong><br/>awaiting reply</td>
          <td style="padding:10px;background:#fff0f6;border-radius:8px;text-align:center;"><strong style="font-size:20px;">${failedChecks}</strong><br/>failed checks</td>
        </tr>
      </table>
      ${last24h.length ? `<h3>Latest activity</h3><table style="border-collapse:collapse;width:100%;font-size:13px;">${rows}</table>` : "<p>No new activity in the last 24 hours.</p>"}
      <p style="color:#a1a1aa;font-size:12px;">Sent automatically by the RashMum UK automation system — every day at 8am.</p>`;

    const result = await sendAlertEmail("☀️ RashMum UK daily digest", html);
    await log(ctx, "self_heal", result.ok, `Daily digest: ${result.ok ? "sent" : (result.error ?? "failed")}`);
    return result;
  },
});

// Weekly cleanup: old chat transcripts + old automation logs (GDPR-friendly).
export const runCleanup = action({
  args: {},
  handler: async (ctx): Promise<{ deletedChats: number; deletedLogs: number }> => {
    const deletedChats: number = await ctx.runMutation(api.chatStore.cleanupOldChats, {});
    const deletedLogs: number = await ctx.runMutation(api.automationStore.cleanupOldLogs, {});
    await log(ctx, "cleanup", true, `Cleaned ${deletedChats} old chat messages and ${deletedLogs} old log entries`);
    return { deletedChats, deletedLogs };
  },
});
