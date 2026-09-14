#!/bin/sh
set -eu

WORKFLOW_FILE="/home/node/n8n-workflow.json"
WORKFLOW_ID="48ffd71b-e851-4a92-941a-cbbbd59917eb"

echo "[n8n-bootstrap] entrypoint started"

# Start n8n once so its database migrations complete.
n8n start &
N8N_PID=$!

cleanup() {
  kill "$N8N_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

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

# Stop the server before changing workflow state. Running the CLI against the
# same database while n8n is serving requests can deadlock on PostgreSQL.
echo "[n8n-bootstrap] stopping bootstrap n8n process"
kill "$N8N_PID" 2>/dev/null || true
wait "$N8N_PID" 2>/dev/null || true
trap - INT TERM EXIT

if [ -f "$WORKFLOW_FILE" ]; then
  if n8n list:workflow 2>/dev/null | grep -q "$WORKFLOW_ID"; then
    echo "[n8n-bootstrap] production workflow already exists"
  else
    echo "[n8n-bootstrap] importing production workflow"
    n8n import:workflow --input="$WORKFLOW_FILE"
  fi

  # n8n 2.x uses publish:workflow for production activation.
  echo "[n8n-bootstrap] publishing production workflow"
  n8n publish:workflow --id="$WORKFLOW_ID"
fi

echo "[n8n-bootstrap] starting final n8n process"
exec n8n start
