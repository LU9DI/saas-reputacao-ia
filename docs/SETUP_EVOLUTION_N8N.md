# Setup rápido — Evolution + n8n + Filtra

Guia único para retomar o que estava no terminal (Docker / Evolution / n8n).

## A) Local (recomendado para desenvolver)

```bash
# 1. Docker instalado?
docker --version && docker compose version

# 2. Subir stack
cd /caminho/para/saas-reputacao-ia/infra/docker
chmod +x up.sh
./up.sh

# 3. Criar instância WhatsApp (troque a key)
export EVO_KEY=$(grep AUTHENTICATION_API_KEY .env | cut -d= -f2)
curl -s -X POST http://localhost:8080/instance/create \
  -H "apikey: $EVO_KEY" -H "Content-Type: application/json" \
  -d '{"instanceName":"filtra","qrcode":true,"integration":"WHATSAPP-BAILEYS"}'

# 4. QR
curl -s http://localhost:8080/instance/connect/filtra -H "apikey: $EVO_KEY"
```

n8n: http://localhost:5678  
Detalhes: `infra/docker/README.md`

## B) Produção Filtra (já no Render)

| Serviço | Função |
|---------|--------|
| `filtra-ia-api` (Render) | Backend SaaS |
| `n8n-reputacao-ia` (Render) | Workflows de relatório |
| Evolution | Ideal em VPS com IP/DNS estável (WhatsApp) |

Env no backend:
```
N8N_WEBHOOK_URL=https://n8n-reputacao-ia.onrender.com/webhook/filtra-relatorio-v3
```

**Não** coloque `N8N_WEBHOOK_URL` no nó de e-mail do n8n como se fosse o backend.

## C) Checklist se “parou no meio”

```bash
docker ps -a
docker compose -f infra/docker/docker-compose.yml ps
docker compose -f infra/docker/docker-compose.yml logs --tail 50 evolution-api
```

Cole a saída se precisar de diagnóstico.
