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

const webhook = workflow.nodes.find((item) => item.name === 'Webhook - Relatório');
if (!webhook) throw new Error('Webhook - Relatório node not found');
webhook.parameters.httpMethod = 'POST';
webhook.parameters.path = 'filtra-relatorio-v3';
webhook.parameters.responseMode = 'responseNode';

const healthWebhook = workflow.nodes.find((item) => item.name === 'Webhook - Health Intelligent Report');
if (healthWebhook) {
  healthWebhook.parameters.httpMethod = 'GET';
  healthWebhook.parameters.path = 'intelligent-report';
  healthWebhook.parameters.responseMode = 'responseNode';
}

const successResponse = workflow.nodes.find((item) => item.name === 'Resposta - Relatório');
if (!successResponse) throw new Error('Resposta - Relatório node not found');
successResponse.parameters.respondWith = 'json';
successResponse.parameters.responseBody = '={{ { ok: $json.ok, status: $json.status, cliente_id: $json.cliente_id, periodo: $json.periodo, idempotency_key: $json.idempotency_key, total: $json.total, sent: $json.sent, failed: $json.failed, results: $json.results } }}';
successResponse.parameters.options = { responseCode: 200 };

const errorResponse = workflow.nodes.find((item) => item.name === 'Resposta - Erro');
if (!errorResponse) throw new Error('Resposta - Erro node not found');
errorResponse.parameters.respondWith = 'json';
errorResponse.parameters.responseBody = '={{ { ok: false, status: $json.status || 400, error: $json.error || \'Invalid request\' } }}';
errorResponse.parameters.options = { responseCode: 400 };

const healthResponse = workflow.nodes.find((item) => item.name === 'Resposta - Health Intelligent Report');
if (healthResponse) {
  healthResponse.parameters.respondWith = 'json';
  healthResponse.parameters.responseBody = '={{ { ok: true, status: \'ready\', workflow: \'Filtra.IA - Relatório + WhatsApp (corrigido)\', webhook: \'POST /webhook/filtra-relatorio-v3\' } }}';
  healthResponse.parameters.options = { responseCode: 200 };
}

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
