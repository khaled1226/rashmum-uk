"use node";

import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { emailShell, sendEmailViaResend } from "./email";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const submit = action({
  args: {
    kind: v.union(v.literal("join"), v.literal("contact")),
    name: v.string(),
    email: v.string(),
    city: v.optional(v.string()),
    babyAge: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ id: string; emailResult: { ok: boolean; error?: string; id?: string } }> => {
    const name = args.name.trim().slice(0, 100);
    const email = args.email.trim().toLowerCase().slice(0, 200);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please provide a valid name and email address.");
    }

    const id = await ctx.runMutation(api.messagesStore.insert, {
      kind: args.kind,
      name,
      email,
      city: args.city?.trim().slice(0, 80),
      babyAge: args.babyAge?.slice(0, 40),
      message: args.message?.trim().slice(0, 3000),
    });

    // Immediate auto-response — part of the 24/7 promise.
    const emailResult = await ctx.runAction(api.messages.sendAutoReply, { id });
    return { id, emailResult };
  },
});

export const sendAutoReply = action({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, args) => {
    const msg = await ctx.runQuery(api.messagesStore.get, { id: args.id });
    if (!msg) return { ok: false, error: "Message not found" };

    const safeName = escapeHtml(msg.name);
    const isJoin = msg.kind === "join";

    const subject = isJoin
      ? "Welcome to RashMum UK 💛 — we're matching you with mums near you"
      : "We've got your message 💛 — RashMum UK";

    const bodyHtml = isJoin
      ? `<p>Hi ${safeName},</p>
         <p>Thank you for joining <strong>RashMum UK</strong> — we're so glad you found us. 💛</p>
         <p>Here's what happens next:</p>
         <ul>
           <li>A volunteer mum will match you with mums near ${escapeHtml(msg.city ?? "your area")} within <strong>24 hours</strong>.</li>
           <li>You'll get an intro to your local group — coffee mornings, park walks, and a 24/7 community chat.</li>
           <li>Need to talk before then? Our helpline is open right now: <strong>0800 123 4567</strong>.</li>
         </ul>
         <p>No fees, no spam, ever. Just mums who get it.</p>
         <p style="color:#e91e8c;"><strong>— The RashMum UK family</strong></p>`
      : `<p>Hi ${safeName},</p>
         <p>Thank you for reaching out to RashMum UK — your message is with our volunteer team.</p>
         <p>A real mum will reply within <strong>24 hours</strong>. If you need support sooner, our 24/7 helpline is <strong>0800 123 4567</strong>, and the assistant here on the site can answer common questions any time, day or night.</p>
         <p>You said: <em>"${escapeHtml(msg.message ?? "(no message)")}"</em></p>
         <p style="color:#e91e8c;"><strong>— The RashMum UK family</strong></p>`;

    const result = await sendEmailViaResend({
      to: msg.email,
      subject,
      html: emailShell(subject, bodyHtml),
    });

    await ctx.runMutation(api.messagesStore.markEmailed, {
      id: args.id,
      autoReplySent: result.ok,
      emailError: result.error,
      status: result.ok ? "auto_replied" : "new",
    });

    return result;
  },
});
