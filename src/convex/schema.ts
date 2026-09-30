import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 24/7 AI chat conversations
  chatMessages: defineTable({
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    source: v.optional(
      v.union(v.literal("ai"), v.literal("knowledge_base"), v.literal("crisis"))
    ),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_created", ["createdAt"]),

  // Contact & join form submissions (auto-responded via email)
  contactMessages: defineTable({
    kind: v.union(v.literal("join"), v.literal("contact")),
    name: v.string(),
    email: v.string(),
    city: v.optional(v.string()),
    babyAge: v.optional(v.string()),
    message: v.optional(v.string()),
    emailSent: v.optional(v.boolean()),
    emailError: v.optional(v.string()),
    autoReplySent: v.optional(v.boolean()),
    status: v.union(v.literal("new"), v.literal("auto_replied"), v.literal("human_replied")),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  // Automation log: health checks, retries, self-healing actions
  automationLog: defineTable({
    kind: v.union(
      v.literal("health_check"),
      v.literal("self_heal"),
      v.literal("retry"),
      v.literal("cleanup")
    ),
    ok: v.boolean(),
    detail: v.string(),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"])
    .index("by_kind", ["kind"]),

  // Site status snapshot shown live on the landing page
  siteStatus: defineTable({
    key: v.string(),
    ok: v.boolean(),
    detail: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
