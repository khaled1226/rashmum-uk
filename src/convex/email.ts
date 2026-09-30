// Shared Resend email helper (used by auto-reply + automation retries).

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

const DEFAULT_FROM = "RashMum UK <onboarding@resend.dev>";

export async function sendEmailViaResend(
  payload: EmailPayload
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const from = payload.from ?? DEFAULT_FROM;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend HTTP ${res.status}: ${body.slice(0, 200)}` };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return {
      ok: false,
      error: `Resend request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#fdf8f3;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ffe4ef;">
      <div style="background:#e91e8c;padding:20px 24px;color:#ffffff;font-weight:bold;font-size:18px;">RashMum UK 💛</div>
      <div style="padding:24px;color:#27272a;font-size:14px;line-height:1.6;">
        <h2 style="margin:0 0 12px;font-size:18px;color:#27272a;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;background:#fdf8f3;color:#a1a1aa;font-size:11px;line-height:1.6;">
        RashMum UK CIC · Charity #1192847 · 24/7 Helpline: 0800 123 4567<br/>
        If you or baby are unsafe, call 999 or Samaritans 116 123. You're not alone. 💛
      </div>
    </div>
  </body>
</html>`;
}
