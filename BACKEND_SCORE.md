# Backend — scorecard (meta ≥ 4,5/5)

## Já no código (esta rodada + anteriores)

| Área | Nota estimada | Notas |
|------|---------------|--------|
| Deploy/produção | **4,5** | `tsx` em dependencies; build sem tsc; start `tsx server.ts`; Render.md |
| Segurança base | **4,2** | JWT obrigatório ≥32; headers; CORS allowlist; errorHandler sem stack em prod; rate-limit nas rotas |
| Banco | **4,5** | Postgres **obrigatório** em prod; SQLite só com `SQLITE_ALLOW_PROD=1`; índices; ping no health |
| Confiabilidade | **4,3** | Health real (SELECT 1 → 503 se DB cair); graceful shutdown SIGTERM/SIGINT; retry queue |
| IA | **4,2** | Groq→Gemini; warnings se só um provedor |
| Pagamentos | **4,0** | Webhooks/retry existentes; seguir validando assinaturas |
| Qualidade | **4,0** | Rotas/services/lib; ainda há arquivos legados na raiz do backend |

**Total estimado após este harden: ~4,3–4,5** (depende de env no Render + revisão pontual de webhooks).

## Obrigatório no Render para fechar 4,5

```env
NODE_ENV=production
JWT_SECRET=<≥32 aleatório>
DATABASE_URL=<Postgres filtra-ia-db>
APP_URL=https://seu-app.vercel.app
FRONTEND_URL=https://seu-app.vercel.app
CORS_ORIGINS=https://seu-app.vercel.app
```

Sem `DATABASE_URL` a API **não sobe** em produção (exit 1).

## Próximos 0,2–0,3 pontos (opcional)

1. Mover `adminLoginRoute`, `mfa`, `stripeRoutes` para `routes/`
2. Migrations versionadas (em vez de só `CREATE IF NOT EXISTS`)
3. Testes de integração contra Postgres
4. Revisar webhooks Stripe/MP/PayPal (assinatura + idempotência) arquivo a arquivo
5. Dependências: `npm audit` seletivo (sem `--force`)
