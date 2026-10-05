# Infra local Filtra.AI — Evolution API + n8n

Stack Docker para desenvolvimento local de WhatsApp (Evolution) e automações (n8n), alinhada ao backend Filtra no Render.

## Produção

- API Filtra: Render
- Frontend: Vercel
- Postgres: Supabase ou Neon
- Evolution/n8n: somente onde houver configuração segura e HTTPS

O restante deste documento descreve apenas o ambiente local. Chaves fortes nunca devem ser commitadas e bancos de produção não devem depender de volumes locais do Docker.
