# Migração SQLite → Postgres

O projeto hoje usa **SQLite** (`sqlite` + `sqlite3`) via `backend/lib/db.ts`.  
Para produção com vários clientes concorrentes, Postgres é o próximo passo natural.

## Estratégia recomendada (sem big-bang)

1. Manter a interface `getDb()` / queries SQL simples.  
2. Introduzir um driver Postgres (`pg`) atrás da mesma API.  
3. Trocar `?` placeholders por `$1, $2…` no adapter Postgres.  
4. Rodar schema em `docs/schema.postgres.sql`.  
5. Migrar dados uma vez (export SQLite → import Postgres).

## Quando migrar

- [ ] Mais de ~50 empresas ativas  
- [ ] Picos de escrita em reviews  
- [ ] Necessidade de réplicas / backups gerenciados (Railway Postgres, Neon, Supabase)

## Passos técnicos

### 1. Provisionar Postgres

Railway → New → Database → PostgreSQL  
Copie `DATABASE_URL`.

### 2. Aplicar schema

```bash
psql "$DATABASE_URL" -f docs/schema.postgres.sql
```

### 3. Dependências

```bash
cd backend
npm install pg
npm install -D @types/pg
```

### 4. Adapter (esqueleto)

Criar `backend/lib/db.pg.ts` que exporta:

- `initDB()` → conecta com `DATABASE_URL`
- `getDb().run / get / all` com conversão de `?` → `$n`

Em `lib/db.ts`:

```ts
if (process.env.DATABASE_URL?.startsWith('postgres')) {
  // delegar para db.pg
} else {
  // SQLite atual
}
```

### 5. Diffs SQL importantes

| SQLite | Postgres |
|--------|----------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` |
| `DATETIME` | `TIMESTAMPTZ` |
| `INSERT OR IGNORE` | `ON CONFLICT DO NOTHING` |
| `PRAGMA table_info` | `information_schema.columns` |

As migrations `ALTER TABLE … ADD COLUMN` do código atual precisam virar checks no catalog do Postgres (já esboçados no schema).

### 6. Cutover

1. Manter SQLite em produção.  
2. Subir Postgres e migrar dados offline.  
3. Apontar `DATABASE_URL` e reiniciar API.  
4. Validar `/api/health` + trial + login.  
5. Desligar volume SQLite.

## Ainda não implementado no código

O adapter Postgres completo **não** está ligado neste commit — só o schema e o plano.  
Peça “implementar adapter Postgres” quando for a hora; o trabalho principal é o wrapper de placeholders + trocar `ensure*Columns`.
