# Sistema anti-fraude de avaliações

## O que foi implementado

| Camada | Comportamento |
|--------|----------------|
| **Rate limit global** | 40/h por IP (express-rate-limit) |
| **Rate limit rígido** | 8 envios / 15 min por IP |
| **Rate por empresa+IP** | máx. 5/h e 12/dia (memória + DB via `ip_hash`) |
| **Honeypot** | campo `website` oculto; se preenchido → rejeita |
| **Duplicata** | mesmo comentário (normalizado) em 24h na mesma empresa → 409 |
| **Flags suaves** | `nome_generico`, `nota_extrema`, `comentario_curto`, etc. (não bloqueiam) |
| **`is_test`** | avaliação de teste do painel; **fora** das métricas oficiais |

## Colunas em `reviews`

- `is_test` INTEGER
- `ip_hash` TEXT (hash do IP, não o IP em texto)
- `fraud_flags` TEXT (JSON)
- `origin` TEXT (`publico` \| `painel_teste`)

## Teste do empresário

```http
POST /api/reviews
{ "rating": 2, "comment": "teste interno", "empresa_id": "...", "is_test": true }
```

Não consome rate anti-fraude nem quota da mesma forma; marcado como teste.

## Limitações (honestas)

- VPN / redes compartilhadas podem bater no limite por IP
- Não há CAPTCHA ainda (próximo passo se houver abuso)
- Empresário ainda *pode* abrir o link público; o rate + aviso reduz, não elimina fraude interna

## Próximos reforços possíveis

1. CAPTCHA (Turnstile) em notas ≤ 3
2. Token de uso único no QR (expira em X min)
3. Painel: botão “Avaliação de teste” com `is_test: true`
