#!/bin/sh
set -eu

# Import the single production Filtra.IA workflow, then start n8n.
# The workflow itself carries the production ID, active state and connections.
node <<'NODE'
const fs = require('fs');
const path = '/home/node/n8n-workflow.json';
const exported = JSON.parse(fs.readFileSync(path, 'utf8'));
const workflow = Array.isArray(exported) ? exported[0] : exported;
if (!workflow || !Array.isArray(workflow.nodes) || !workflow.connections) {
  throw new Error('Invalid n8n workflow export');
}
workflow.id = 'PC9xbunz6ZsUSNS3';
workflow.name = 'Filtra.IA - Relatório Telegram';
workflow.active = true;
workflow.isArchived = false;
fs.writeFileSync(path, JSON.stringify(Array.isArray(exported) ? [workflow] : workflow));
NODE

n8n import:workflow --input=/home/node/n8n-workflow.json
exec n8n start
