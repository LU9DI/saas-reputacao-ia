#!/bin/sh
set -eu

# Import all production Filtra.AI workflows, then start n8n.
# The workflow file may contain one or multiple workflow exports.
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
  workflow.active = workflow.active !== false;
  workflow.isArchived = false;
}

fs.writeFileSync(path, JSON.stringify(workflows));
NODE

n8n import:workflow --input=/home/node/n8n-workflow.json

# n8n CLI imports workflows as inactive by default. Activate each production
# workflow before starting n8n so webhook triggers are registered at boot.
n8n update:workflow --id=PC9xbunz6ZsUSNS3 --active=true
n8n update:workflow --id=filtraLeadAutomation2026 --active=true

exec n8n start
