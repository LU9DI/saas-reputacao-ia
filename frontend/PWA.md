# PWA — Filtra.IA

O front Next.js pode ser instalado na tela inicial (Android, desktop Chrome/Edge; iOS via “Adicionar à Tela de Início”).

## O que foi implementado

| Peça | Arquivo |
|------|---------|
| Manifest | `public/manifest.webmanifest` |
| Service Worker | `public/sw.js` |
| Registro + banner instalar | `src/app/components/PwaRegister.tsx` |
| Meta / theme-color | `src/app/layout.tsx` |
| Headers SW | `next.config.mjs` |
| Ícones SVG + script PNG | `public/icons/`, `scripts/generate-pwa-icons.mjs` |

## Comportamento do SW

- **API** (`/api`, porta 5000): sempre rede, sem cache (evita dados velhos/sensíveis offline)
- **Páginas**: network-first, fallback para cache se offline
- **Estáticos**: stale-while-revalidate

Isso **não** torna o painel fully offline (precisa da API). Serve para shell rápido e ícone de app.

## Como testar

```bash
cd frontend
node scripts/generate-pwa-icons.mjs   # gera PNGs 192/512
npm run build && npm start            # PWA completa é mais confiável fora do next dev
```

1. Abra Chrome → DevTools → Application → Manifest / Service Workers
2. Lighthouse → Progressive Web App
3. No Android: menu → “Instalar app”
4. No iPhone Safari: Compartilhar → Adicionar à Tela de Início

`localhost` e **HTTPS** em produção são exigidos para install + WebAuthn.

## Produção

1. Troque ícones sólidos por logo oficial (192, 512, maskable com margem segura)
2. Confirme `start_url` e domínio no manifest
3. HTTPS obrigatório
4. Opcional: push notifications (fase 2)

## Limitações conscientes

- iOS não mostra `beforeinstallprompt` — só fluxo manual Safari
- Offline real do painel exigiria cache de API autenticada (risco de segurança; não feito)
- Avaliação via QR continua sendo página web normal (pode abrir no browser sem instalar)
