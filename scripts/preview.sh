#!/bin/sh
# Preview command: ensures the local Convex backend (database + functions +
# crons) is running, then starts the Vite dev server — the whole app runs in
# the managed preview process.
#
# Freebuff injects PORT; Convex binds its own port (3210) for the API.

# Reuse an already-running local Convex backend (it can outlive a preview
# restart); only start a new one when the port is actually free.
if curl -s -o /dev/null --max-time 2 http://127.0.0.1:3210; then
  echo "Convex backend already running on 3210 — reusing it."
else
  bunx convex dev --typecheck disable --tail-logs disable &
fi

# Hand the foreground to Vite (the port Freebuff monitors).
exec bunx vite --host 0.0.0.0 --port "${PORT:-5173}"
