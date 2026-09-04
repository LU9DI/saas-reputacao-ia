# Setup rápido — Filtra.IA

## Pré-requisitos

- Node.js 20+
- Conta Stripe (modo teste) para checkout real

## 1. Backend

```bash
cd backend
cp .env.example .env
# Edite .env:
#   JWT_SECRET=... (mín. 32 chars)
#   STRIPE_SECRET_KEY=sk_test_...
npm install
npm run dev
# → http://localhost:5000
```

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://127.0.0.1:3000
```

## 3. Ou tudo de uma vez (raiz)

```bash
npm install
npm run dev
```

## Checkout Stripe

1. Coloque `STRIPE_SECRET_KEY=sk_test_...` no `backend/.env`
2. Reinicie o backend
3. Clique em **Assinar plano** na home
4. Deve abrir a página do Stripe Checkout

Sem a chave, a API responde **503** com mensagem clara — o botão mostra o erro na tela.

## Testes

```bash
cd backend && npm test
```

## Admin

- URL: http://localhost:3000/admin/login
- E-mail padrão: `admin@seusaas.com`
- Senha: valor de `ADMIN_PASSWORD` no `.env`
