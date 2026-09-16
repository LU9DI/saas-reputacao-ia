# n8n × Filtra.AI

## Dois cenários

### 1) n8n já no Render (`n8n-reputacao-ia`)
Continue usando o serviço existente. Configure:

**Backend Filtra → n8n**
```
N8N_WEBHOOK_URL=https://n8n-reputacao-ia.onrender.com/webhook/filtra-relatorio-v3
```

**n8n → Backend Filtra** (nó HTTP interno, se precisar):
```
POST https://filtra-ia-api.onrender.com/api/internal/n8n/email
```
(ajuste path conforme a rota real no backend)

### 2) n8n local (Docker em `infra/docker`)
Para desenvolver o fluxo sem gastar o Render:

1. `cd infra/docker && ./up.sh`
2. Abra http://localhost:5678
3. Crie workflow com Webhook `filtra-relatorio-v3`
4. Exponha com túnel se o backend em produção precisar chamar o n8n local:
   ```bash
   # exemplo ngrok
   ngrok http 5678
   # use a URL https://xxxx.ngrok.io/webhook/filtra-relatorio-v3 no Render
   ```

## Fluxo mínimo de relatório

1. **Webhook** (POST) — recebe payload do backend
2. **Code / Set** — normaliza destinatários e canal
3. **IF / Switch** — whatsapp | email | sms
4. **HTTP Request** — Evolution `sendText` ou SMTP
5. **Respond to Webhook** — `{ ok: true }`

## Evolution sendText (exemplo)

```
POST http://evolution-api:8080/message/sendText/filtra
Header: apikey: <AUTHENTICATION_API_KEY>
Body JSON:
{
  "number": "5562999999999",
  "text": "Seu relatório Filtra.AI está pronto."
}
```

No n8n local use host `evolution-api` (nome do serviço Docker).  
No n8n Render use a URL pública da Evolution (VPS) se não estiver no mesmo host.

## Se o roteador ficar verde mas vazio

O nó anterior (**Separar destinatários**) não enviou itens. Verifique:

- `destinatarios` no payload do webhook
- o Code node faz `return items` / `return [{ json: ... }]` no formato n8n
- execute o nó **Preparar relatório** e inspecione Output antes do Switch
