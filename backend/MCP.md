# Filtra.AI — Conector MCP (Grok e outros)

O backend expõe um servidor **MCP** em HTTP para o Grok (e qualquer cliente MCP) consultar reputação da empresa autenticada.

## Endpoint

| Método | Path | Uso |
|--------|------|-----|
| `GET` | `/mcp` | Info pública (nome, tools, como autenticar) |
| `POST` | `/mcp` | JSON-RPC 2.0 (`initialize`, `tools/list`, `tools/call`) |

URL de produção (exemplo):

```text
https://<sua-api-no-render>.onrender.com/mcp
```

Substitua pela URL real da API Filtra (a mesma base de `NEXT_PUBLIC_API_URL`).

## Autenticação

Todas as **tools** exigem:

```http
Authorization: Bearer <JWT>
```

O JWT é o mesmo token de login da **empresa** no Filtra (e-mail + senha → token de sessão).  
Conta **admin** não tem painel de empresa e será recusada.

### Como obter o JWT (manual / teste)

1. Login no painel ou via API de auth da empresa.  
2. Use o token retornado (ou cookie `saas_auth_token` / `auth_token`) como Bearer.  
3. No Grok Custom connector, se o fluxo pedir header de autorização, configure o Bearer com esse JWT.

> Fase 2 (futuro): OAuth dedicado “Conectar Filtra” sem copiar JWT manualmente.

## Tools

| Tool | Descrição |
|------|-----------|
| `filtra_get_company_summary` | Nota média, totais, % positivas, crises 24h, plano |
| `filtra_list_critical_reviews` | Críticas 1–3★ (`limit`, `only_untreated`) |
| `filtra_get_ai_themes` | Tags/temas de IA mais frequentes |
| `filtra_get_plan_status` | Plano, expiração, acesso ativo |

## Conectar no Grok

1. Abra [grok.com/connectors](https://grok.com/connectors)  
2. **New Connector** → **Custom**  
3. URL do servidor MCP: `https://<sua-api>/mcp`  
4. Complete autenticação / header Bearer se o Grok pedir  
5. Confirme que as tools `filtra_*` aparecem  

Business/Enterprise: o admin pode precisar liberar o conector em [console.x.ai](https://console.x.ai).

Documentação xAI: [Custom MCP connectors](https://x.ai/docs/grok/connectors.md).

## Teste rápido (curl)

```bash
# Info
curl -s https://<api>/mcp | jq

# Listar tools
curl -s -X POST https://<api>/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq

# Resumo (com JWT)
curl -s -X POST https://<api>/mcp \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_JWT' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"filtra_get_company_summary","arguments":{}}}' | jq
```

## Deploy

1. Faça deploy do **backend** com este código (Render/Railway).  
2. Confirme `GET /mcp` responde em HTTPS público.  
3. Não use `localhost` no Grok — a URL precisa ser alcançável pela internet.

## Segurança

- Rate limit: 60 req/min no `POST /mcp`  
- Só dados da empresa do JWT  
- Assinatura/trial inativo → 401 lógico (erro JSON-RPC)  
- Sem escrita destrutiva neste MVP (somente leitura)
