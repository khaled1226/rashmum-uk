import { query } from "./_generated/server";

// Public, key-less status snapshot consumed by the landing page pill and the
// automation health check (keeps the check Convex-side so no API key is needed).
export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const backend = await ctx.db
      .query("siteStatus")
      .withIndex("by_key", (q) => q.eq("key", "backend"))
      .unique();
    const site = await ctx.db
      .query("siteStatus")
      .withIndex("by_key", (q) => q.eq("key", "site"))
      .unique();

    // Before the first cron run there is no data yet — report optimistically.
    if (!backend) return { ok: true, detail: "Status starting up — first check in progress", updatedAt: Date.now() };

    const ok = backend.ok && (site ? site.ok : true);
    const detail = !backend.ok
      ? backend.detail
      : site && !site.ok
        ? site.detail
        : `All systems operational · checked ${new Date(backend.updatedAt).toLocaleTimeString("en-GB")}`;
    return { ok, detail, updatedAt: backend.updatedAt };
  },
});

export const getDetail = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("siteStatus").collect();
    return rows;
  },
});
