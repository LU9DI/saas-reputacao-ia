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

# Do not run n8n CLI commands while the server is starting. The CLI can block
# against the same PostgreSQL database and prevent the server from opening its
# port. Wait for n8n's own HTTP health endpoint instead.
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

# Stop the bootstrap server before changing workflow state. CLI operations and
# the running n8n process must not compete for the same PostgreSQL database.
echo "[n8n-bootstrap] stopping bootstrap n8n process"
kill "$N8N_PID" 2>/dev/null || true
wait "$N8N_PID" 2>/dev/null || true
trap - INT TERM EXIT

if [ -f "$WORKFLOW_FILE" ]; then
  echo "[n8n-bootstrap] checking production workflow"
  if [ -z "$(n8n list:workflow --onlyId 2>/dev/null)" ]; then
    echo "[n8n-bootstrap] importing production workflow"
    n8n import:workflow --input="$WORKFLOW_FILE"
  else
    echo "[n8n-bootstrap] production workflow already exists"
  fi

  # Imports are initially inactive in this setup. Activate the workflow(s)
  # found in the database instead of relying on a hard-coded workflow ID,
  # because n8n may assign a new ID during import.
  echo "[n8n-bootstrap] activating production workflow"
  n8n update:workflow --all --active=true
fi

echo "[n8n-bootstrap] starting final n8n process"
exec n8n start
