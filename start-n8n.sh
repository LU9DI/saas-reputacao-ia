#!/bin/sh
set -eu

# Normalize the WhatsApp HTTP Request node before importing the versioned workflow.
# Evolution API expects a literal URL, the apikey header, and number/text fields.
sed -i 's#"url":"={$env\.FILTRA_WHATSAPP_URL}"#"url":"https://picking-wines-providence-tower.trycloudflare.com/message/sendText/FiltraAI-Wpp"#g; s#"url":"={{\$env\.FILTRA_WHATSAPP_URL}}"#"url":"https://picking-wines-providence-tower.trycloudflare.com/message/sendText/FiltraAI-Wpp"#g; s#"name":"Authorization","value":"={'"'"'Bearer '"'"'+$env.FILTRA_WHATSAPP_TOKEN}"#"name":"apikey","value":"={{$env.FILTRA_WHATSAPP_TOKEN}}"#g; s#"jsonBody":"={{JSON.stringify({to:\$json.destination,message:\$json.message,cliente_id:\$json.cliente_id,periodo:\$json.periodo,idempotency_key:\$json.idempotency_key})}}"#"jsonBody":"={{JSON.stringify({number:$json.destination,text:$json.message})}}"#g; s#"url":"={$env.FILTRA_SMS_URL}"#"url":"={{$env.FILTRA_SMS_URL}}"#g; s#"url":"={$env.FILTRA_WECHAT_URL}"#"url":"={{$env.FILTRA_WECHAT_URL}}"#g' /home/node/n8n-workflow.json

# Import the versioned workflow before starting n8n. The workflow keeps its
# stable ID, so n8n overwrites the existing definition instead of creating
# duplicates. Publish it again because CLI imports deactivate workflows by
# default on non-multi-main instances.
n8n import:workflow --input=/home/node/n8n-workflow.json
n8n publish:workflow --id=48ffd71b-e851-4a92-941a-cbbd59917eb7

exec n8n start
