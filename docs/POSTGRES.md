# Postgres em produção (Filtra.IA)

## Comportamento atual do código

`backend/lib/db.ts` escolhe o motor assim:

| Ambiente | `DATABASE_URL` | Resultado |
|----------|----------------|-----------|
| development / test | ausente | **SQLite** |
| qualquer | `postgresql://...` | **Postgres** (`lib/db.pg.ts`) |
| production | ausente | SQLite + **aviso** (use `SQLITE_ALLOW_PROD=1` para silenciar) |

## Subir em produção (Railway / Neon / Supabase)

1. Crie um Postgres e copie a URL.

2. No painel da API:

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB?sslmode=require
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://seu-frontend
FRONTEND_URL=https://seu-frontend
```

3. Aplique o schema base (primeira vez):

```bash
psql "$DATABASE_URL" -f docs/schema.postgres.sql
```

O `initDB()` também tenta `CREATE TABLE IF NOT EXISTS` via adapter.

4. Reinicie a API. No log deve aparecer:

```text
🐘 Postgres conectado (DATABASE_URL)
```

## Adapter (`lib/db.pg.ts`)

- API compatível: `get / run / all / exec`
- `?` → `$1, $2…`
- `PRAGMA table_info` → `information_schema.columns`
- `datetime('now')` → `NOW()`
- `IFNULL` → `COALESCE`
- `INSERT OR IGNORE` → `ON CONFLICT DO NOTHING`

**Limitação:** SQL muito específico do SQLite em scripts legados pode precisar de ajuste pontual. O caminho feliz (empresas, usuários, reviews, billing) está coberto.

## Dev local continua em SQLite

Não defina `DATABASE_URL` no `.env` de desenvolvimento.  
Testes de integração usam arquivo temporário em `/tmp`.
