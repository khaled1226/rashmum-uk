import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Storage layer for contact/join messages (default runtime).

export const insert = mutation({
  args: {
    kind: v.union(v.literal("join"), v.literal("contact")),
    name: v.string(),
    email: v.string(),
    city: v.optional(v.string()),
    babyAge: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("contactMessages", {
      kind: args.kind,
      name: args.name,
      email: args.email,
      city: args.city ?? undefined,
      babyAge: args.babyAge ?? undefined,
      message: args.message ?? undefined,
      status: "new",
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const markEmailed = mutation({
  args: {
    id: v.id("contactMessages"),
    autoReplySent: v.boolean(),
    emailError: v.optional(v.string()),
    status: v.union(v.literal("new"), v.literal("auto_replied"), v.literal("human_replied")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      autoReplySent: args.autoReplySent,
      emailError: args.emailError,
      status: args.status,
    });
  },
});

export const listRecent = query({
  args: { limit: v.number() },
  handler: async (ctx, args) =>
    ctx.db.query("contactMessages").withIndex("by_created").order("desc").take(args.limit),
});

// Automation: count messages still waiting for their auto-reply.
export const countPending = query({
  args: {},
  handler: async (ctx) => {
    const recent = await ctx.db
      .query("contactMessages")
      .withIndex("by_created")
      .order("desc")
      .take(200);
    return recent.filter((m) => !m.autoReplySent).length;
  },
});

export const markHumanReplied = mutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "human_replied" });
  },
});
