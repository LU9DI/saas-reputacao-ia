#!/bin/sh
set -eu

# Normalize the WhatsApp HTTP Request node before importing the versioned workflow.
# Evolution API expects the public base URL, the apikey header, and number/text fields.
node <<'NODE'
const fs = require('fs');
const path = '/home/node/n8n-workflow.json';
const exported = JSON.parse(fs.readFileSync(path, 'utf8'));
const workflow = Array.isArray(exported) ? exported[0] : exported;
if (!workflow || !Array.isArray(workflow.nodes)) {
  throw new Error('Invalid n8n workflow export: nodes array not found');
}
const node = workflow.nodes.find((item) => item.name === 'WHATSAPP - Enviar');
if (!node) throw new Error('WHATSAPP - Enviar node not found');
const baseUrl = String(process.env.FILTRA_WHATSAPP_URL || '').replace(/\/$/, '');
if (!baseUrl) throw new Error('FILTRA_WHATSAPP_URL is required');
node.parameters.method = 'POST';
node.parameters.url = `={{$env.FILTRA_WHATSAPP_URL + '/message/sendText/FiltraAI-Wpp'}}`;
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
n8n publish:workflow --id=48ffd71b-e851-4a92-941a-cbbd59917eb7

exec n8n start
