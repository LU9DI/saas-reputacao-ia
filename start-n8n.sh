#!/bin/sh
set -eu

WORKFLOW_FILE="/home/node/n8n-workflow.json"
WORKFLOW_ID="48ffd71b-e851-4a92-941a-cbbbd59917eb"

# First let n8n initialize and run its own migrations. CLI database commands
# against a live n8n process caused PostgreSQL connection contention.
echo "[n8n-bootstrap] starting n8n for database initialization"
n8n start &
N8N_PID=$!

cleanup() {
  kill "$N8N_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

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

# Stop the server before importing/publishing. This leaves PostgreSQL free for
# the CLI process while preserving the migrations performed during startup.
echo "[n8n-bootstrap] stopping initialization process before CLI database work"
kill "$N8N_PID" 2>/dev/null || true
wait "$N8N_PID" 2>/dev/null || true
trap - INT TERM EXIT
sleep 3

if [ -f "$WORKFLOW_FILE" ]; then
  echo "[n8n-bootstrap] importing production workflow"
  n8n import:workflow --input="$WORKFLOW_FILE"

  echo "[n8n-bootstrap] publishing production workflow $WORKFLOW_ID"
  n8n publish:workflow --id="$WORKFLOW_ID"
fi

echo "[n8n-bootstrap] starting final n8n"
exec n8n start
