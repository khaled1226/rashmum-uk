import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Health check + self-heal every 5 minutes — the "keep it online 24/7" loop.
crons.interval("health-check", { minutes: 5 }, api.automation.runHealthCheck, {});

// Volunteer digest every day at 8am UK time.
crons.daily("daily-digest", { hourUTC: 8, minuteUTC: 0 }, api.automation.sendDailyDigest, {});

// GDPR-friendly cleanup of old chat transcripts and logs, weekly on Monday 3am UTC.
crons.weekly(
  "weekly-cleanup",
  { dayOfWeek: "monday", hourUTC: 3, minuteUTC: 0 },
  api.automation.runCleanup,
  {}
);

export default crons;
