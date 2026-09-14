#!/bin/sh
set -eu

WORKFLOW_FILE="/home/node/n8n-workflow.json"

echo "[n8n-bootstrap] entrypoint started"

# Start n8n normally first so its database migrations can complete.
n8n start &
N8N_PID=$!

cleanup() {
  kill "$N8N_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# Do not run n8n CLI commands while the server is starting. Wait for n8n's
# own HTTP health endpoint so migrations and startup initialization are done.
READY=0
for i in $(seq 1 90); do
  if node -e 'require("http").get("http://127.0.0.1:5678/healthz", r => process.exit(r.statusCode === 200 ? 0 : 1)).on("error", () => process.exit(1))'; then
    READY=1
    echo "[n8n-bootstrap] n8n HTTP health is ready"
    break
  fi
  sleep 2
done

if [ "$READY" != "1" ]; then
  echo "[n8n-bootstrap] n8n did not become ready in time"
  exit 1
fi

if [ -f "$WORKFLOW_FILE" ]; then
  echo "[n8n-bootstrap] checking production workflow"
  if [ -z "$(n8n list:workflow --onlyId 2>/dev/null)" ]; then
    echo "[n8n-bootstrap] importing production workflow"
    n8n import:workflow --input="$WORKFLOW_FILE"
  else
    echo "[n8n-bootstrap] production workflow already exists"
  fi

  # Update the database while n8n is still running. The server is restarted
  # immediately afterwards so its active workflow manager registers the
  # production webhook from the newly activated workflow.
  echo "[n8n-bootstrap] activating production workflow"
  n8n update:workflow --all --active=true
fi

# Stop the bootstrap process only after all database CLI work is complete.
# This avoids running CLI commands against a PostgreSQL pool that n8n has
# already closed during shutdown.
echo "[n8n-bootstrap] stopping bootstrap n8n process"
kill "$N8N_PID" 2>/dev/null || true
wait "$N8N_PID" 2>/dev/null || true
trap - INT TERM EXIT

echo "[n8n-bootstrap] starting final n8n process"
exec n8n start
