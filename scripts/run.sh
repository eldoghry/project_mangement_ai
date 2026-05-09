#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Bootstrap .env from example if missing
if [ ! -f .env ]; then
  echo "No .env found — copying from .env.example"
  cp .env.example .env
  echo "Edit .env and set JWT_SECRET before running in production."
fi

echo "Starting Kanban Board (Docker)..."
docker compose up --build