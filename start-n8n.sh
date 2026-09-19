#!/bin/sh
set -eu

WORKFLOW_FILE=/home/node/n8n-workflow.json

# IMPORTANT: n8n import deactivates workflows and can block startup while the
# database migration/import lock is held. Never auto-import on boot.
# The Render service uses the persistent n8n database, so published workflows
# survive restarts. Set N8N_IMPORT_WORKFLOWS=true only for an intentional
# one-time workflow re-import, then redeploy/restart again with it unset.
if [ "${N8N_IMPORT_WORKFLOWS:-false}" = "true" ]; then
  node <<'NODE'
const fs = require('fs');
const path = '/home/node/n8n-workflow.json';
const exported = JSON.parse(fs.readFileSync(path, 'utf8'));
const workflows = Array.isArray(exported) ? exported : [exported];

if (!workflows.length || workflows.some((workflow) =>
  !workflow || !Array.isArray(workflow.nodes) || !workflow.connections
)) {
  throw new Error('Invalid n8n workflow export');
}

for (const workflow of workflows) {
  workflow.active = true;
  workflow.isArchived = false;
}

fs.writeFileSync(path, JSON.stringify(workflows));
NODE

  n8n import:workflow --input="$WORKFLOW_FILE"
  n8n publish:workflow --id=PC9xbunz6ZsUSNS3
  n8n publish:workflow --id=filtraLeadAutomation2026
fi

echo "Starting n8n on 0.0.0.0:5678..."
export N8N_LISTEN_ADDRESS=0.0.0.0
export N8N_PORT=5678
exec n8n start
