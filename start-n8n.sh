#!/bin/sh
set -eu

WORKFLOW_FILE=/home/node/n8n-workflow.json

# n8n imports deactivate workflows. Never re-import on every boot:
# doing so creates a window where production webhooks return 404.
# Import only when explicitly requested or when the workflow IDs are missing.
needs_import=false

if [ "${N8N_IMPORT_WORKFLOWS:-false}" = "true" ]; then
  needs_import=true
else
  if ! n8n list:workflow --onlyIdAndName 2>/dev/null | grep -q 'PC9xbunz6ZsUSNS3'; then
    needs_import=true
  fi
  if ! n8n list:workflow --onlyIdAndName 2>/dev/null | grep -q 'filtraLeadAutomation2026'; then
    needs_import=true
  fi
fi

if [ "$needs_import" = "true" ]; then
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

  # publish:workflow is the supported n8n 2.x command. Importing leaves
  # workflows inactive; publish makes the imported versions active/published
  # before n8n starts accepting production traffic.
  n8n publish:workflow --id=PC9xbunz6ZsUSNS3
  n8n publish:workflow --id=filtraLeadAutomation2026
fi

exec n8n start
