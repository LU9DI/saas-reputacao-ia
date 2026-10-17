# Limpeza estrutural (feito + pendente)

## Feito nesta rodada

- [x] `lib/quota`, `lib/planUtils`, `lib/passwordPolicy`, `lib/mailer` canônicos
- [x] Arquivos antigos na raiz viram **re-exports** (`@deprecated`)
- [x] `authMiddleware` → `middleware/authFactory` (+ preferir `lib/auth`)
- [x] `reviewService` / `billingService` / `validate` apontam para `lib/`
- [x] `finishBootstrap` / `wireStripe` marcados deprecated
- [x] `docs/ARCHITECTURE.md`

## Pendente (mover arquivos grandes sem mudar comportamento)

```bash
# localmente, quando quiser:
mkdir -p backend/services backend/routes
# mover e ajustar imports relativos:
#   groqService.ts → services/
#   stripeBilling.ts → services/
#   stripeRoutes.ts → routes/
#   mfa.ts, admin*Route*.ts, passwordResetRoutes.ts → routes/
# atualizar server.ts imports
# git rm caminhos antigos após validar npm test
```

## Remover do Git (obrigatório)

```bash
git rm --cached -f backend/prisma/dev.db 2>/dev/null || true
git rm -rf --cached .aider.tags.cache.v4 2>/dev/null || true
git rm --cached Saas.txt 2>/dev/null || true
```
