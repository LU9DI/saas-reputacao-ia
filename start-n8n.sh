#!/bin/sh
set -eu

# Normalize environment expressions before importing the versioned workflow.
# n8n 2.x requires an expression beginning with ={{...}} for env-backed URLs.
sed -i 's/"url":"={$env\.FILTRA_WHATSAPP_URL}"/"url":"={{$env.FILTRA_WHATSAPP_URL}}"/g; s/"url":"={$env\.FILTRA_SMS_URL}"/"url":"={{$env.FILTRA_SMS_URL}}"/g; s/"url":"={$env\.FILTRA_WECHAT_URL}"/"url":"={{$env.FILTRA_WECHAT_URL}}"/g' /home/node/n8n-workflow.json

# Import the versioned workflow before starting n8n. The workflow keeps its
# stable ID, so n8n overwrites the existing definition instead of creating
# duplicates. Publish it again because CLI imports deactivate workflows by
# default on non-multi-main instances.
n8n import:workflow --input=/home/node/n8n-workflow.json
n8n publish:workflow --id=48ffd71b-e851-4a92-941a-cbbd59917eb7

exec n8n start
