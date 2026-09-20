#!/bin/sh
set -eu

WORKFLOW_FILE="/home/node/n8n-workflow.json"

if [ "${N8N_IMPORT_WORKFLOWS:-false}" = "true" ] && [ -f "$WORKFLOW_FILE" ]; then
  echo "[n8n-bootstrap] importing bundled workflows"
  n8n import:workflow --input="$WORKFLOW_FILE"

  echo "[n8n-bootstrap] publishing bundled workflows"
  n8n publish:workflow --id="PC9xbunz6ZsUSNS3"
  n8n publish:workflow --id="filtraLeadAutomation2026"
fi

echo "[n8n-bootstrap] starting n8n on 0.0.0.0:5678"
export N8N_LISTEN_ADDRESS=0.0.0.0
export N8N_PORT=5678
exec n8n start
