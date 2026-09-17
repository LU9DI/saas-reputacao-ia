#!/bin/sh
set -eu

# Normalize and import the corrected Filtra.IA WhatsApp workflow.
# Evolution API expects the current public Quick Tunnel URL, the apikey header, and number/text fields.
node <<'NODE'
const fs = require('fs');
const path = '/home/node/n8n-workflow.json';
const exported = JSON.parse(fs.readFileSync(path, 'utf8'));
const workflow = Array.isArray(exported) ? exported[0] : exported;
if (!workflow || !Array.isArray(workflow.nodes)) {
  throw new Error('Invalid n8n workflow export: nodes array not found');
}

// The versioned file historically contained the archived workflow ID.
// Import it under the corrected workflow ID so the live workflow is actually updated.
workflow.id = 'xpXhhPN5dTbdhg1X';
workflow.name = 'Filtra.IA - Relatório + WhatsApp (corrigido)';
workflow.active = true;

const node = workflow.nodes.find((item) => item.name === 'WHATSAPP - Enviar');
if (!node) throw new Error('WHATSAPP - Enviar node not found');

const baseUrl = 'https://anticipated-colleges-treasure-jewel.trycloudflare.com';
node.parameters.method = 'POST';
node.parameters.url = `${baseUrl}/message/sendText/FiltraAI-Wpp`;
node.parameters.sendHeaders = true;
node.parameters.headerParameters = {
  parameters: [
    { name: 'apikey', value: '={{$env.FILTRA_WHATSAPP_TOKEN}}' },
    { name: 'Content-Type', value: 'application/json' }
  ]
};
node.parameters.sendBody = true;
node.parameters.specifyBody = 'json';
node.parameters.jsonBody = '={{JSON.stringify({number:$json.destination,text:$json.message})}}';

fs.writeFileSync(path, JSON.stringify(Array.isArray(exported) ? [workflow] : workflow));
NODE

n8n import:workflow --input=/home/node/n8n-workflow.json
n8n publish:workflow --id=xpXhhPN5dTbdhg1X

exec n8n start
