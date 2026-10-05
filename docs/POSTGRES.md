# Postgres em produção (Filtra.AI)

## Comportamento do código

`backend/lib/db.ts` escolhe o motor assim:

| Ambiente | DATABASE_URL | Resultado |
| --- | --- | --- |
| development / test | ausente | SQLite |
| qualquer | `postgresql://...` | Postgres |
| production | ausente | SQLite + aviso |

**Produção deve usar Postgres.** O banco não deve depender do filesystem do serviço.

## Provedores

Os provedores aceitos para produção são **Supabase** ou **Neon**.

1. Crie o projeto Postgres.
2. Copie a connection string.
3. Configure `DATABASE_URL` no serviço Render.
4. Use SSL/TLS conforme a connection string fornecida.
5. Aplique o schema/migrações do projeto.
6. Reinicie a API e confirme no log que o adapter Postgres foi selecionado.

Exemplo:

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB?sslmode=require
JWT_SECRET=...
APP_URL=https://filtraai.com
FRONTEND_URL=https://filtraai.com
```

## Dev local

O desenvolvimento pode continuar em SQLite quando `DATABASE_URL` estiver ausente. Testes de integração usam banco temporário.

## Regra operacional

Render hospeda a API; Supabase ou Neon hospeda o Postgres. Não usar banco persistente no filesystem do serviço web.
