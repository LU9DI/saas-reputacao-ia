#!/bin/sh
set -eu

# Normalize the WhatsApp HTTP Request node before importing the versioned workflow.
# Evolution API expects a literal URL, the apikey header, and number/text fields.
node <<'NODE'
const fs = require('fs');
const path = '/home/node/n8n-workflow.json';
const workflow = JSON.parse(fs.readFileSync(path, 'utf8'));
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
fs.writeFileSync(path, JSON.stringify(workflow));
NODE

# Import the versioned workflow before starting n8n. The workflow keeps its
# stable ID, so n8n overwrites the existing definition instead of creating
# duplicates. Publish it again because CLI imports deactivate workflows by
# default on non-multi-main instances.
n8n import:workflow --input=/home/node/n8n-workflow.json
n8n publish:workflow --id=48ffd71b-e851-4a92-941a-cbbd59917eb7

exec n8n start
