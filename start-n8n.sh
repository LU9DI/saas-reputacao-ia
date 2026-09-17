#!/bin/sh
set -eu

# Normalize and import the Filtra.IA Telegram workflow.
node <<'NODE'
const fs = require('fs');
const path = '/home/node/n8n-workflow.json';
const exported = JSON.parse(fs.readFileSync(path, 'utf8'));
const workflow = Array.isArray(exported) ? exported[0] : exported;
if (!workflow || !Array.isArray(workflow.nodes)) throw new Error('Invalid n8n workflow export');

workflow.id = 'PC9xbunz6ZsUSNS3';
workflow.name = 'Filtra.IA - Relatório + Telegram';
workflow.active = true;
workflow.isArchived = false;

const telegramNode = workflow.nodes.find((item) => item.name === 'WHATSAPP - Enviar');
if (!telegramNode) throw new Error('WHATSAPP - Enviar node not found');
telegramNode.name = 'TELEGRAM - Enviar';
telegramNode.parameters.method = 'POST';
telegramNode.parameters.url = "={{'https://api.telegram.org/bot' + $env.TELEGRAM_BOT_TOKEN + '/sendMessage'}}";
telegramNode.parameters.sendHeaders = true;
telegramNode.parameters.headerParameters = { parameters: [{ name: 'Content-Type', value: 'application/json' }] };
telegramNode.parameters.sendBody = true;
telegramNode.parameters.specifyBody = 'json';
telegramNode.parameters.jsonBody = '={{JSON.stringify({chat_id:$json.destination,text:$json.message})}}';

const router = workflow.nodes.find((item) => item.name === 'Roteador por canal');
if (!router) throw new Error('Roteador por canal node not found');
const telegramRule = router.parameters.rules.values.find((rule) => rule.conditions?.conditions?.some((condition) => condition.rightValue === 'whatsapp'));
if (!telegramRule) throw new Error('WhatsApp route not found');
for (const condition of telegramRule.conditions.conditions) if (condition.rightValue === 'whatsapp') condition.rightValue = 'telegram';

for (const connection of Object.values(workflow.connections)) {
  for (const outputs of Object.values(connection)) {
    if (!Array.isArray(outputs)) continue;
    for (const branch of outputs) if (Array.isArray(branch)) for (const link of branch) if (link && link.node === 'WHATSAPP - Enviar') link.node = 'TELEGRAM - Enviar';
  }
}

workflow.nodes = workflow.nodes.filter((node) => !['TELEGRAM - Resultado','EMAIL - Resultado','Merge - Resultados'].includes(node.name));
workflow.nodes.push(
  { parameters: { jsCode: "const original=$('Separar destinatários').item.json;\nconst provider=$json||{};\nreturn [{json:{...original,delivery_ok:provider.ok===true,provider_response:provider}}];" }, id: '18', name: 'TELEGRAM - Resultado', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1000, -96] },
  { parameters: { jsCode: "const original=$('Separar destinatários').item.json;\nconst provider=$json||{};\nreturn [{json:{...original,delivery_ok:provider.ok===true,provider_response:provider}}];" }, id: '19', name: 'EMAIL - Resultado', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1000, 80] },
  { parameters: { mode: 'append', numberInputs: 2 }, id: '20', name: 'Merge - Resultados', type: 'n8n-nodes-base.merge', typeVersion: 3, position: [1200, 0] }
);

const aggregate = workflow.nodes.find((item) => item.name === 'Agregar resultados');
if (!aggregate) throw new Error('Agregar resultados node not found');
aggregate.parameters.jsCode = "const items=$input.all();\nconst results=items.map(item=>{const d=item.json||{};const provider=d.provider_response??d;const ok=d.delivery_ok===true||provider.ok===true;return{channel:d.channel??null,destination:d.destination??null,status:ok?'sent':'failed',ok,error:ok?null:(provider.error?.message??provider.error??null),provider_response:provider};});\nconst failed=results.filter(r=>!r.ok).length;\nreturn[{json:{ok:results.length>0&&failed===0,status:results.length===0?'no_recipients':failed===0?'completed':'partial_failure',total:results.length,sent:results.filter(r=>r.ok).length,failed,results}}];";

for (const name of ['TELEGRAM - Enviar','EMAIL - Enviar','TELEGRAM - Resultado','EMAIL - Resultado','Merge - Resultados']) delete workflow.connections[name];
workflow.connections['TELEGRAM - Enviar'] = { main: [[{ node: 'TELEGRAM - Resultado', type: 'main', index: 0 }]] };
workflow.connections['EMAIL - Enviar'] = { main: [[{ node: 'EMAIL - Resultado', type: 'main', index: 0 }]] };
workflow.connections['TELEGRAM - Resultado'] = { main: [[{ node: 'Merge - Resultados', type: 'main', index: 0 }]] };
workflow.connections['EMAIL - Resultado'] = { main: [[{ node: 'Merge - Resultados', type: 'main', index: 1 }]] };
workflow.connections['Merge - Resultados'] = { main: [[{ node: 'Agregar resultados', type: 'main', index: 0 }]] };

fs.writeFileSync(path, JSON.stringify(Array.isArray(exported) ? [workflow] : workflow));
NODE

n8n unpublish:workflow --id=xpXhhPN5dTbdhg1X || true
n8n import:workflow --input=/home/node/n8n-workflow.json
n8n publish:workflow --id=PC9xbunz6ZsUSNS3

exec n8n start
