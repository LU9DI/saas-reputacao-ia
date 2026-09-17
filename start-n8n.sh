#!/bin/sh
set -eu

# Normalize and import the Filtra.IA Telegram workflow.
node <<'NODE'
const fs = require('fs');
const path = '/home/node/n8n-workflow.json';
const exported = JSON.parse(fs.readFileSync(path, 'utf8'));
const workflow = Array.isArray(exported) ? exported[0] : exported;
if (!workflow || !Array.isArray(workflow.nodes)) {
  throw new Error('Invalid n8n workflow export: nodes array not found');
}

workflow.id = 'xpXhhPN5dTbdhg1X';
workflow.name = 'Filtra.IA - Relatório + Telegram';
workflow.active = true;

const telegramNode = workflow.nodes.find((item) => item.name === 'WHATSAPP - Enviar');
if (!telegramNode) throw new Error('WHATSAPP - Enviar node not found');

telegramNode.name = 'TELEGRAM - Enviar';
telegramNode.parameters.method = 'POST';
telegramNode.parameters.url = "={{'https://api.telegram.org/bot' + $env.TELEGRAM_BOT_TOKEN + '/sendMessage'}}";
telegramNode.parameters.sendHeaders = true;
telegramNode.parameters.headerParameters = {
  parameters: [
    { name: 'Content-Type', value: 'application/json' }
  ]
};
telegramNode.parameters.sendBody = true;
telegramNode.parameters.specifyBody = 'json';
telegramNode.parameters.jsonBody = '={{JSON.stringify({chat_id:$json.destination,text:$json.message})}}';

const router = workflow.nodes.find((item) => item.name === 'Roteador por canal');
if (!router) throw new Error('Roteador por canal node not found');
const telegramRule = router.parameters.rules.values.find((rule) =>
  rule.conditions?.conditions?.some((condition) => condition.rightValue === 'whatsapp')
);
if (!telegramRule) throw new Error('WhatsApp route not found');
for (const condition of telegramRule.conditions.conditions) {
  if (condition.rightValue === 'whatsapp') condition.rightValue = 'telegram';
}

if (workflow.connections['WHATSAPP - Enviar']) {
  workflow.connections['TELEGRAM - Enviar'] = workflow.connections['WHATSAPP - Enviar'];
  delete workflow.connections['WHATSAPP - Enviar'];
}

fs.writeFileSync(path, JSON.stringify(Array.isArray(exported) ? [workflow] : workflow));
NODE

n8n import:workflow --input=/home/node/n8n-workflow.json
n8n publish:workflow --id=xpXhhPN5dTbdhg1X

exec n8n start
