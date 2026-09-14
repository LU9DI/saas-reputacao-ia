#!/bin/sh
set -eu

WORKFLOW_FILE="/home/node/n8n-workflow.json"
WORKFLOW_ID="48ffd71b-e851-4a92-941a-cbbbd59917eb"

echo "[n8n-bootstrap] entrypoint started"

# Start n8n normally first so its database migrations can complete.
n8n start &
N8N_PID=$!

cleanup() {
  kill "$N8N_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# Wait for n8n's own HTTP health endpoint before touching the database.
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
  # Do not use `list:workflow` here. It can block against PostgreSQL while the
  # running n8n process owns the database connection pool. The exported
  # workflow already contains its stable ID, so import it directly and publish
  # that exact workflow. The process is restarted afterwards so the webhook
  # trigger is registered from the published workflow.
  echo "[n8n-bootstrap] importing production workflow"
  n8n import:workflow --input="$WORKFLOW_FILE"

  echo "[n8n-bootstrap] publishing production workflow $WORKFLOW_ID"
  n8n publish:workflow --id="$WORKFLOW_ID"
fi

# Restart n8n after the CLI database operations so the published workflow and
# its production webhook are loaded by the active workflow manager.
echo "[n8n-bootstrap] stopping bootstrap n8n process"
kill "$N8N_PID" 2>/dev/null || true
wait "$N8N_PID" 2>/dev/null || true
trap - INT TERM EXIT

echo "[n8n-bootstrap] starting final n8n process"
exec n8n start
