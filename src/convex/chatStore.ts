import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Storage layer for 24/7 chat (kept outside "use node" so mutations/queries run on the default runtime).

export const storeMessage = mutation({
  args: {
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
    source: v.optional(
      v.union(v.literal("ai"), v.literal("knowledge_base"), v.literal("crisis"))
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      source: args.source,
      createdAt: args.createdAt,
    });
  },
});

export const recentForSession = query({
  args: { sessionId: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(args.limit);
    return messages.reverse();
  },
});

export const clearSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const m of messages) await ctx.db.delete(m._id);
  },
});

// Cleanup automation: chat transcripts older than 30 days are removed (GDPR-friendly).
export const cleanupOldChats = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("chatMessages")
      .withIndex("by_created", (q) => q.lt("createdAt", cutoff))
      .take(200);
    for (const m of old) await ctx.db.delete(m._id);
    return old.length;
  },
});
