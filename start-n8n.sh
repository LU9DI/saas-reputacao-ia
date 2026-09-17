#!/bin/sh
set -eu

# Normalize the WhatsApp HTTP Request node before importing the versioned workflow.
# The repository stores the workflow export as an array, while n8n's runtime
# uses the first workflow object. Evolution API expects a literal URL, the
# apikey header, and number/text fields.
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
node.parameters.method = 'POST';
node.parameters.url = 'https://spice-edgar-exhibits-presentations.trycloudflare.com/message/sendText/FiltraAI-Wpp';
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

# Import by the same stable workflow ID. n8n documents that an imported workflow
# with an existing ID overwrites the existing definition.
n8n import:workflow --input=/home/node/n8n-workflow.json
n8n publish:workflow --id=48ffd71b-e851-4a92-941a-cbbd59917eb7

exec n8n start
