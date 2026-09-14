#!/bin/sh
set -eu

WORKFLOW_FILE="/home/node/n8n-workflow.json"

# Import the production workflow only when the persistent n8n database is empty.
# This prevents duplicate workflows on Render restarts/redeploys.
if [ -f "$WORKFLOW_FILE" ]; then
  WORKFLOW_COUNT="$(n8n list:workflow 2>/dev/null | wc -l | tr -d ' ')"
  if [ "${WORKFLOW_COUNT:-0}" = "0" ]; then
    echo "[n8n-bootstrap] importing production workflow"
    n8n import:workflow --input="$WORKFLOW_FILE"
    n8n update:workflow --id=48ffd71b-e851-4a92-941a-cbbd59917eb7 --active=true || true
  else
    echo "[n8n-bootstrap] existing workflows detected; skipping import"
  fi
fi

exec n8n start
