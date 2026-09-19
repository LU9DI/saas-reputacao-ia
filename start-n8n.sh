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
exec n8n start
