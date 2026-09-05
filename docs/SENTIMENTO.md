# Análise de sentimento

## Como funciona

1. **Heurística (sempre)** — nota + dicionário PT-BR  
2. **IA (opcional)** — planos com IA + comentário ≥ 8 chars  
3. Campos: `sentiment`, `sentiment_score` (-1…+1), `sentiment_source`

## Backfill (avaliações antigas)

Na subida do servidor, se houver reviews **sem** `sentiment`, o backfill roda automaticamente (heurística, até 2000 por boot).

### Desligar / limitar

```env
BACKFILL_SENTIMENT=0          # não roda no boot
BACKFILL_SENTIMENT_LIMIT=500  # tamanho do lote no boot
BACKFILL_SENTIMENT_AI=1       # usa IA no boot (não recomendado em prod sem necessidade)
```

### Script manual

```bash
cd backend

# heurística (recomendado)
npm run backfill:sentiment

# com opções
npx tsx scripts/backfillSentiment.ts --limit=10000
npx tsx scripts/backfillSentiment.ts --force          # reprocessa tudo
npx tsx scripts/backfillSentiment.ts --empresa=UUID
npx tsx scripts/backfillSentiment.ts --ai --limit=200 # refino com LLM
```

Se ainda restarem pendentes, rode de novo (processa em lotes).

## API do painel

```json
{
  "metricas": {
    "sentimento_mix": { "positivo": 12, "neutro": 3, "negativo": 5 },
    "sentimento_score_medio": 0.18
  }
}
```

## Testes

```bash
cd backend && npx tsx --test tests/sentiment.test.ts
```
