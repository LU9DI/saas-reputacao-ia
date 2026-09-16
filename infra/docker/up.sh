#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "→ Criando .env a partir de .env.example"
  cp .env.example .env
  # Gera chaves aleatórias se ainda forem placeholder
  if command -v openssl >/dev/null 2>&1; then
    EVO_KEY=$(openssl rand -hex 16)
    N8N_KEY=$(openssl rand -hex 16)
    PG_PASS=$(openssl rand -hex 12)
    sed -i.bak \
      -e "s/troque-esta-chave-evolution-32chars/${EVO_KEY}/" \
      -e "s/troque-esta-chave-n8n-32caracteresxx/${N8N_KEY}/" \
      -e "s/troque_senha_postgres_forte/${PG_PASS}/" \
      .env
    rm -f .env.bak
    echo "→ Chaves geradas automaticamente no .env"
  else
    echo "⚠ Edite o .env e troque as senhas/chaves antes de produção."
  fi
fi

echo "→ Subindo stack (Postgres, Redis, Evolution, n8n)..."
docker compose up -d

echo "→ Aguardando health..."
sleep 8
docker compose ps

echo ""
echo "Evolution: http://localhost:8080"
echo "n8n:       http://localhost:5678"
echo "API key Evolution: grep AUTHENTICATION_API_KEY .env"
echo ""
echo "Próximo: ver infra/docker/README.md (criar instância + QR)"
