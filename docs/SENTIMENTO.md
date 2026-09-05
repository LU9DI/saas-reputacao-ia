# Análise de sentimento

## Como funciona

1. **Heurística (sempre)** — nota + dicionário PT-BR de palavras positivas/negativas  
2. **IA (opcional)** — planos com IA (`trial`, `ultra`, `corporativo`, `rei`) e comentário ≥ 8 chars → refino via Groq/Gemini  
3. Persistido em `reviews.sentiment`, `sentiment_score` (-1…+1), `sentiment_source`

## Labels

| Label | Score típico |
|-------|----------------|
| `positivo` | ≥ 0,2 |
| `neutro` | entre -0,2 e 0,2 |
| `negativo` | ≤ -0,2 |

## API do painel

Cada review pode trazer:

```json
{
  "sentiment": "negativo",
  "sentiment_score": -0.72,
  "sentiment_source": "heuristica"
}
```

Agregados em `metricas`:

```json
{
  "sentimento_mix": { "positivo": 12, "neutro": 3, "negativo": 5 },
  "sentimento_score_medio": 0.18
}
```

## Testes

```bash
cd backend && npx tsx --test tests/sentiment.test.ts
```
