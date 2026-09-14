#!/bin/sh
set -eu

WORKFLOW_FILE="/home/node/n8n-workflow.json"
WORKFLOW_ID="48ffd71b-e851-4a92-941a-cbbd59917eb7"

# Start n8n first so database migrations/connections are ready before CLI access.
n8n start &
N8N_PID=$!

cleanup() {
  kill "$N8N_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# Wait for the local n8n HTTP server to become ready.
READY=0
for i in $(seq 1 60); do
  if node -e "require('http').get('http://127.0.0.1:5678/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"; then
    READY=1
    break
  fi
  sleep 2
done

if [ "$READY" != "1" ]; then
  echo "[n8n-bootstrap] n8n did not become ready in time"
  exit 1
fi

if [ -f "$WORKFLOW_FILE" ]; then
  if n8n list:workflow 2>/dev/null | grep -q "$WORKFLOW_ID"; then
    echo "[n8n-bootstrap] production workflow already exists"
  else
    echo "[n8n-bootstrap] importing production workflow"
    n8n import:workflow --input="$WORKFLOW_FILE"
  fi

  # n8n 2.x publishes/activates workflows through the database. The legacy
  # command is still supported in 2.33.4 and is run before the final restart.
  n8n update:workflow --id="$WORKFLOW_ID" --active=true || true
fi

# Reload n8n so the webhook registry reflects the workflow state in the DB.
kill "$N8N_PID" 2>/dev/null || true
wait "$N8N_PID" 2>/dev/null || true
trap - INT TERM EXIT

exec n8n start
