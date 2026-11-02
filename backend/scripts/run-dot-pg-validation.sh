#!/usr/bin/env bash
#
# Validação PostgreSQL real do Filtra DOT contra um cluster DESCARTÁVEL.
#
# Requisitos:
#   - binários do PostgreSQL (initdb, pg_ctl, postgres) em $PG_BIN
#   - dependências do backend instaladas (backend/node_modules)
#
# Garantias:
#   - nunca toca em cluster já instalado: o cluster é criado em $ROOT (padrão %TEMP%),
#     escuta apenas 127.0.0.1 e usa porta dedicada;
#   - o diretório de dados precisa estar ausente/vazio (aborta se houver conteúdo);
#   - o servidor temporário é sempre parado no final, preservando logs e dados.
#
# Uso:
#   PG_BIN=/caminho/para/bin backend/scripts/run-dot-pg-validation.sh
#
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PG_BIN="${PG_BIN:-/tmp/pg-tools/node_modules/@embedded-postgres/linux-x64/native/bin}"
PG_PORT="${PG_PORT:-55432}"
PG_DATABASE="filtra_dot_test"
ROOT="${ROOT:-${TMPDIR:-/tmp}/filtra-dot-pg-validation}"
DATA="$ROOT/data"
LOG="$ROOT/postgres.log"

if [ ! -x "$PG_BIN/initdb" ] || [ ! -x "$PG_BIN/pg_ctl" ]; then
  echo "ERRO: binários do PostgreSQL não encontrados em $PG_BIN (defina PG_BIN)." >&2
  exit 1
fi

if [ -d "$DATA" ] && [ -n "$(ls -A "$DATA" 2>/dev/null)" ]; then
  echo "ERRO: $DATA já contém uma instância. Nada foi apagado; use outro ROOT." >&2
  exit 1
fi

mkdir -p "$ROOT"

stop_server() {
  if [ -f "$DATA/postmaster.pid" ]; then
    echo "==> Parando o servidor temporário (porta $PG_PORT)"
    "$PG_BIN/pg_ctl" -D "$DATA" stop -m fast || true
  fi
  echo "==> Logs preservados em $LOG; dados preservados em $DATA"
}
trap stop_server EXIT

echo "==> initdb em $DATA"
"$PG_BIN/initdb" -D "$DATA" -U postgres --auth=trust --encoding=UTF8 --locale=C >/dev/null

echo "==> iniciando PostgreSQL em 127.0.0.1:$PG_PORT"
"$PG_BIN/pg_ctl" -D "$DATA" -l "$LOG" -o "-p $PG_PORT -c listen_addresses=127.0.0.1" start >/dev/null

echo "==> criando banco $PG_DATABASE e conferindo identidade"
DOT_PG_IDENTITY_SQL="SELECT current_database() AS db, inet_server_port() AS port, inet_server_addr()::text AS host, (SELECT setting FROM pg_settings WHERE name = 'data_directory') AS data_directory"
export DOT_PG_IDENTITY_SQL
DOT_PG_PORT="$PG_PORT" DOT_PG_DATABASE="$PG_DATABASE" node --input-type=module -e '
import pg from "'"$BACKEND_DIR"'/node_modules/pg/lib/index.js";
const port = Number(process.env.DOT_PG_PORT);
const database = process.env.DOT_PG_DATABASE;
const admin = new pg.Client({ host: "127.0.0.1", port, user: "postgres", database: "postgres" });
await admin.connect();
const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
if (exists.rowCount === 0) await admin.query(`CREATE DATABASE ${database}`);
await admin.end();
const target = new pg.Client({ host: "127.0.0.1", port, user: "postgres", database });
await target.connect();
const identity = await target.query(process.env.DOT_PG_IDENTITY_SQL);
const row = identity.rows[0];
if (row.db !== database) throw new Error(`banco inesperado: ${row.db}`);
if (Number(row.port) !== port) throw new Error(`porta inesperada: ${row.port}`);
if (!/^127\.0\.0\.1/.test(row.host)) throw new Error(`host inesperado: ${row.host}`);
console.log("[dot-pg] identidade do banco:", JSON.stringify(row));
await target.end();
'

echo "==> executando a suíte PostgreSQL do DOT"
cd "$BACKEND_DIR"
export DOT_PG_TEST_DATABASE_URL="postgresql://postgres@127.0.0.1:$PG_PORT/$PG_DATABASE"
export NODE_ENV=test
npx tsx --test tests/postgres.dot.integration.test.ts
