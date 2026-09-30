// Resolves the Convex base URL for the current context.
//
// In the managed preview the browser is outside the sandbox and cannot reach
// the loopback Convex backend directly, so calls are routed through the
// same-origin Vite proxy at /convex (see vite.config.ts). Real https Convex
// deployment URLs (e.g. in production) are used as-is.

export function convexApiBase(): string {
  const envUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "";
  const isLoopback = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])/.test(envUrl);
  const isRemoteBrowser =
    typeof window !== "undefined" &&
    !["127.0.0.1", "localhost", "[::1]"].includes(window.location.hostname);

  if (isLoopback && isRemoteBrowser) {
    return `${window.location.origin}/convex`;
  }
  return envUrl;
}
