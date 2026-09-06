# Configuração rápida — o que está pedindo no painel

## 1. Login (obrigatório)

PDF, troca de plano, WhatsApp e Google exigem sessão:

1. `http://localhost:3000/login`
2. CNPJ + senha da empresa
3. O token fica em `localStorage.filtra_token` e no cookie

Sem login: erro de token / 401 / 403.

## 2. Testar planos (sem Stripe)

Em **development**, `ALLOW_PLAN_SWITCH` já é liberado.

No painel, use **Modo teste — alternar plano** (Trial, Inicial, Pro…).

Produção: só com `ALLOW_PLAN_SWITCH=1` ou pagamento real (`STRIPE_SECRET_KEY`).

## 3. PDF

- Plano com PDF: **trial**, **pro**, **ultra**, **corporativo**, **rei** (não o Inicial pago)
- Logado no painel → **Baixar PDF**
- Se der 403: troque o plano no modo teste para Pro+

## 4. Push (alerta 1–3★ no celular/PC)

```bash
cd backend && npx web-push generate-vapid-keys
```

No `backend/.env`:

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@seusaas.com
```

Reinicie a API → no painel **Ativar** notificações.

## 5. Digital (WebAuthn)

No painel, após login: **Cadastrar digital**.

```env
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Filtra.IA
WEBAUTHN_ORIGIN=http://localhost:3000
```

Em produção: `RP_ID=seudominio.com`, `ORIGIN=https://seudominio.com`.

## 6. Google Maps / Reviews

No painel, campo **Link Google Maps** → cola a URL pública do estabelecimento.
Notas 4–5★ redirecionam para esse link. **Não precisa** de API key do Google Maps só para o redirect.

## 7. n8n (opcional)

```env
N8N_WEBHOOK_URL=https://seu-n8n/webhook/...
N8N_STATUS_URL=https://seu-n8n/webhook-status/...
```

Sem isso o painel só mostra “não configurado” — o SaaS funciona sem n8n.

## 8. Stripe (pagamento real)

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Para **só testar recursos**, use o seletor de plano (sem Stripe).

## 9. Sair

Botão **Sair** no header do painel → limpa cookie + `filtra_token` → `/login`.
