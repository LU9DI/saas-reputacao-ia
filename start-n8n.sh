#!/bin/sh
set -eu

WORKFLOW_FILE="/home/node/n8n-workflow.json"
WORKFLOW_ID="48ffd71b-e851-4a92-941a-cbbd59917eb7"

if [ -f "$WORKFLOW_FILE" ]; then
  if n8n list:workflow 2>/dev/null | grep -q "$WORKFLOW_ID"; then
    echo "[n8n-bootstrap] production workflow already exists"
  else
    echo "[n8n-bootstrap] importing production workflow"
    n8n import:workflow --input="$WORKFLOW_FILE"
  fi
fi

exec n8n start
