# Checklist — workflow Filtra × Evolution

## URL do HTTP Request (WhatsApp)

**Correto (fx desligado, texto fixo):**
```
https://picking-wines-providence-tower.trycloudflare.com/message/sendText/FiltraAI-Wpp
```

- Sem `=` no valor final
- Sem barra no final do domínio antes de `/message`
- Nome da instância igual ao da Evolution: `FiltraAI-Wpp`

**Se o túnel Cloudflare mudar**, atualize a URL (trycloudflare.com muda a cada restart do cloudflared).

## Headers

| Name | Value |
|------|--------|
| apikey | mesmo valor de `AUTHENTICATION_API_KEY` da Evolution |
| Content-Type | application/json |

Authentication do nó = **None**

## Body (JSON)

```json
{
  "number": "5562999999999",
  "text": "Teste Filtra"
}
```

Número com DDI (55) + DDD, só dígitos.

## Webhook (backend → n8n)

Path: `filtra-relatorio-v3`  
URL pública exemplo: `https://SEU-N8N/webhook/filtra-relatorio-v3`

No Render (backend Filtra):
```
N8N_WEBHOOK_URL=https://SEU-N8N/webhook/filtra-relatorio-v3
```

## Teste manual no n8n

1. Abra o nó **Evolution sendText**
2. Execute com input de teste (ou pin data no Code):
   - numero: seu WhatsApp com 55
   - texto: "teste"
3. Deve retornar 200/201 da Evolution

## Importar workflow pronto

1. n8n → ⋮ → Import from file
2. `infra/n8n/filtra-whatsapp-send.json`
3. Troque `COLE_AQUI_SUA_AUTHENTICATION_API_KEY`
4. Ajuste a URL do túnel se mudou
5. Activate workflow
