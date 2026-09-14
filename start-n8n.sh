#!/bin/sh
set -eu

WORKFLOW_FILE="/home/node/n8n-workflow.json"
WORKFLOW_ID="48ffd71b-e851-4a92-941a-cbbd59917eb7"

echo "[n8n-bootstrap] entrypoint started"

# Start n8n first. The CLI needs the n8n database to be available.
n8n start &
N8N_PID=$!

cleanup() {
  kill "$N8N_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# Wait specifically for the database-backed workflow CLI to work.
# The HTTP health endpoint can become ready before DB migrations finish.
READY=0
for i in $(seq 1 90); do
  if n8n list:workflow >/tmp/n8n-workflows.txt 2>/dev/null; then
    READY=1
    echo "[n8n-bootstrap] n8n database is ready"
    break
  fi
  sleep 2
done

if [ "$READY" != "1" ]; then
  echo "[n8n-bootstrap] database did not become ready in time"
  exit 1
fi

if [ -f "$WORKFLOW_FILE" ]; then
  if grep -q "$WORKFLOW_ID" /tmp/n8n-workflows.txt; then
    echo "[n8n-bootstrap] production workflow already exists"
  else
    echo "[n8n-bootstrap] importing production workflow"
    n8n import:workflow --input="$WORKFLOW_FILE"
  fi

  # Imported workflows are inactive by default. Explicitly activate the
  # production workflow, then restart n8n so the webhook registry reloads.
  n8n update:workflow --id="$WORKFLOW_ID" --active=true || true
fi

# Reload n8n so the webhook registry reflects the workflow state in the DB.
kill "$N8N_PID" 2>/dev/null || true
wait "$N8N_PID" 2>/dev/null || true
trap - INT TERM EXIT

echo "[n8n-bootstrap] starting final n8n process"
exec n8n start
