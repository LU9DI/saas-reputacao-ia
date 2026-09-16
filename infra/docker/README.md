# Infra local Filtra — Evolution API + n8n

Stack Docker para WhatsApp (Evolution) e automações (n8n), alinhada ao backend Filtra no Render.

## Pré-requisitos

- Docker Engine + Docker Compose v2
- ~2 GB RAM livres (com carregador fraco o PC pode ficar lento)

## Subir em 3 comandos

```bash
cd infra/docker
cp .env.example .env
# Edite .env: AUTHENTICATION_API_KEY, N8N_ENCRYPTION_KEY, POSTGRES_PASSWORD

docker compose up -d
```

Aguarde ~30–60s e confira:

```bash
docker compose ps
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5678
```

| Serviço | URL |
|---------|-----|
| Evolution API | http://localhost:8080 |
| n8n | http://localhost:5678 |

## Evolution — criar instância WhatsApp

```bash
# Use a mesma AUTHENTICATION_API_KEY do .env
export EVO_KEY="sua-chave-do-env"

curl -s -X POST http://localhost:8080/instance/create \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "filtra",
    "token": "filtra-instance-token",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

Obter QR:

```bash
curl -s http://localhost:8080/instance/connect/filtra -H "apikey: $EVO_KEY"
```

Escaneie no WhatsApp do celular (Aparelhos conectados).

Status:

```bash
curl -s http://localhost:8080/instance/connectionState/filtra -H "apikey: $EVO_KEY"
```

## n8n — primeiro acesso

1. Abra http://localhost:5678
2. Crie o usuário admin
3. Importe o workflow de exemplo (se existir em `infra/n8n/`)
4. Credenciais úteis:
   - Header Auth / API Key → Evolution (`apikey`)
   - HTTP Request → `FILTRA_API_URL` (backend Render)

## Integração com Filtra (produção)

Fluxo típico de relatório:

```
Backend Filtra → POST N8N_WEBHOOK_URL
  → n8n prepara mensagem
  → Evolution envia WhatsApp (e/ou e-mail/SMS)
```

No **Render (backend Filtra)**:

```
N8N_WEBHOOK_URL=https://SEU-N8N-PUBLICO/webhook/filtra-relatorio-v3
```

No **n8n** (produção ou túnel):

- Webhook path: `filtra-relatorio-v3`
- Nó HTTP para Evolution: `POST {{$env.EVOLUTION_BASE_URL}}/message/sendText/filtra`
- Header: `apikey: {{$env.EVOLUTION_API_KEY}}`

Local sem URL pública: use **Cloudflare Tunnel** ou **ngrok** na porta 5678 e coloque essa URL no `N8N_WEBHOOK_URL` do Render.

## Comandos úteis

```bash
# Logs
docker compose logs -f evolution-api
docker compose logs -f n8n

# Parar
docker compose down

# Parar e apagar volumes (CUIDADO: perde instâncias/QR)
docker compose down -v

# Reiniciar só Evolution
docker compose restart evolution-api
```

## Problemas comuns

| Sintoma | Ação |
|---------|------|
| Porta 8080/5678 em uso | `sudo lsof -i :8080` e encerre o processo, ou mude a porta no compose |
| Evolution 401 | `AUTHENTICATION_API_KEY` diferente no curl e no `.env` |
| QR não conecta | Apague a instância e crie de novo; celular na mesma rede não é obrigatório |
| n8n não sobe | `docker compose logs n8n` — muitas vezes senha/DB |
| PC lento (Dell + fonte fraca) | Suba só `evolution-api` + deps; n8n depois |

## Produção

Esta stack é para **desenvolvimento local**. Em produção:

- Evolution e n8n em VPS/Render/Railway com **HTTPS**
- Chaves fortes e **nunca** commitadas
- Backup dos volumes Postgres e `evolution/instances`
- n8n do Filtra que já existe no Render pode continuar; use esta stack para testar Evolution localmente
