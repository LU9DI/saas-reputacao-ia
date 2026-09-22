#!/bin/sh
set -eu

WORKFLOW_FILE="/home/node/n8n-workflow.json"

if [ "${N8N_IMPORT_WORKFLOWS:-false}" = "true" ] && [ -f "$WORKFLOW_FILE" ]; then
  echo "[n8n-bootstrap] starting temporary port listener for Render health"
  node -e 'require("http").createServer((req,res)=>{res.writeHead(200,{"content-type":"application/json"});res.end("{\"status\":\"bootstrapping\"}");}).listen(5678,"0.0.0.0")' &
  LISTENER_PID=$!

  trap 'kill "$LISTENER_PID" 2>/dev/null || true' EXIT INT TERM

  echo "[n8n-bootstrap] importing bundled workflows"
  n8n import:workflow --input="$WORKFLOW_FILE"
  n8n import:workflow --input="/home/node/n8n-content-acquisition.json"

  echo "[n8n-bootstrap] publishing bundled workflows"
  n8n publish:workflow --id="PC9xbunz6ZsUSNS3"
  n8n publish:workflow --id="filtraLeadAutomation2026"
  n8n publish:workflow --id="aPqhpo48pl3ZOpyP"
  n8n publish:workflow --id="filtraLeadTelegram2026"
  n8n publish:workflow --id="filtraContentAcquisition2026"

  echo "[n8n-bootstrap] stopping temporary port listener"
  kill "$LISTENER_PID" 2>/dev/null || true
  wait "$LISTENER_PID" 2>/dev/null || true
  trap - EXIT INT TERM
fi

echo "[n8n-bootstrap] starting n8n on 0.0.0.0:5678"
export N8N_LISTEN_ADDRESS=0.0.0.0
export N8N_PORT=5678
exec n8n start
