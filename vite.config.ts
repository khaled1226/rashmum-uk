import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    hmr: false,
    allowedHosts: true,
    // Route same-origin /convex traffic to the local Convex backend so the
    // remote preview (browser outside the sandbox) can reach it.
    proxy: {
      "/convex": {
        target: "http://127.0.0.1:3210",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/convex/, ""),
      },
    },
  },
  publicDir: "site-assets",
});
