#!/usr/bin/env bash
# dev.sh — Run frontend and backend locally without Docker (Mac/Linux)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Bootstrap backend .env if missing
if [ ! -f "$ROOT/backend/.env" ]; then
  echo "No backend/.env found — copying from .env.example"
  cp "$ROOT/.env.example" "$ROOT/backend/.env"
fi

# Install deps if needed
if [ ! -d "$ROOT/backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  (cd "$ROOT/backend" && npm install)
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$ROOT/frontend" && npm install)
fi

echo "Starting backend on :4000 and frontend on :3000..."

# Run both in parallel; kill both on Ctrl-C
trap 'kill 0' SIGINT SIGTERM

(cd "$ROOT/backend"  && npm run dev) &
(cd "$ROOT/frontend" && npm run dev) &

wait