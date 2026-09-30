import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Storage layer for the automation log and site status (default runtime).

export const addLog = mutation({
  args: {
    kind: v.union(
      v.literal("health_check"),
      v.literal("self_heal"),
      v.literal("retry"),
      v.literal("cleanup")
    ),
    ok: v.boolean(),
    detail: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("automationLog", { ...args, createdAt: Date.now() });
  },
});

export const recentLogs = query({
  args: { limit: v.number() },
  handler: async (ctx, args) =>
    ctx.db.query("automationLog").withIndex("by_created").order("desc").take(args.limit),
});

export const cleanupOldLogs = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("automationLog")
      .withIndex("by_created", (q) => q.lt("createdAt", cutoff))
      .take(200);
    for (const l of old) await ctx.db.delete(l._id);
    return old.length;
  },
});

export const setStatus = mutation({
  args: { key: v.string(), ok: v.boolean(), detail: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("siteStatus")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    const updatedAt = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ok: args.ok, detail: args.detail, updatedAt });
    } else {
      await ctx.db.insert("siteStatus", {
        key: args.key,
        ok: args.ok,
        detail: args.detail,
        updatedAt,
      });
    }
  },
});
