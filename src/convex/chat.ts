"use node";

import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import {
  CRISIS_RESPONSE,
  FALLBACK_RESPONSE,
  findKnowledgeAnswer,
  isCrisisMessage,
} from "./knowledge";

const MODEL = "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are the RashMum UK 24/7 assistant — a warm, kind, non-judgemental support bot for a UK volunteer community for mums.

Rules:
- Be empathetic first, practical second. Short, warm paragraphs. UK English.
- RashMum facts: 100% free, volunteer-led CIC (charity #1192847), 10,000+ mums, 50+ UK cities (London, Manchester, Birmingham, Leeds, Bristol...), helpline 0800 123 4567 (24/7), email hello@rashmum.uk, GDPR-compliant and confidential.
- Services: community chat, local meetups (coffee mornings, park walks), mental-health peer support, expert volunteers (midwives, health visitors, counsellors), UK-specific resources (feeding, sleep, benefits).
- You are not a medical professional. For medical concerns, suggest the mum's GP, midwife or health visitor.
- If a mum mentions self-harm, suicide, or that she or her baby is unsafe: respond gently, urge 999 if in immediate danger, and share Samaritans 116 123 (24/7) and PANDAS 0800 138 9819. Never counsel, always hand over kindly.
- Keep answers under 120 words unless the mum clearly needs more.`;

type ChatRole = "user" | "assistant";

async function callGemini(
  history: { role: ChatRole; content: string }[]
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY not configured" };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Gemini HTTP ${res.status}: ${body.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) return { ok: false, error: "Gemini returned empty response" };
    return { ok: true, text };
  } catch (err) {
    return {
      ok: false,
      error: `Gemini request failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export const send = action({
  args: { sessionId: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const trimmed = args.message.trim().slice(0, 2000);
    if (!trimmed) throw new Error("Message cannot be empty");

    const now = Date.now();
    await ctx.runMutation(api.chatStore.storeMessage, {
      sessionId: args.sessionId,
      role: "user",
      content: trimmed,
      createdAt: now,
    });

    // Crisis safety comes first — always, even without any API keys.
    if (isCrisisMessage(trimmed)) {
      await ctx.runMutation(api.chatStore.storeMessage, {
        sessionId: args.sessionId,
        role: "assistant",
        content: CRISIS_RESPONSE,
        source: "crisis",
        createdAt: Date.now(),
      });
      return { source: "crisis" as const };
    }

    // Build short recent history for the AI.
    const recent = await ctx.runQuery(api.chatStore.recentForSession, {
      sessionId: args.sessionId,
      limit: 12,
    });
    const history = recent.map((m: { role: ChatRole; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await callGemini(history);

    if (result.ok) {
      await ctx.runMutation(api.chatStore.storeMessage, {
        sessionId: args.sessionId,
        role: "assistant",
        content: result.text,
        source: "ai",
        createdAt: Date.now(),
      });
      return { source: "ai" as const };
    }

    // 24/7 guarantee: AI down or key missing → knowledge base answers anyway.
    const kb = findKnowledgeAnswer(trimmed) ?? FALLBACK_RESPONSE;
    await ctx.runMutation(api.chatStore.storeMessage, {
      sessionId: args.sessionId,
      role: "assistant",
      content: kb,
      source: "knowledge_base",
      createdAt: Date.now(),
    });
    return { source: "knowledge_base" as const };
  },
});
