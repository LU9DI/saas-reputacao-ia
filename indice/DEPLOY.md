# Publicar em filtraai.com/indice

O site principal é estático (Cloudflare Pages). O Índice precisa de servidor Node (páginas geradas sob demanda, ISR).

1. Hospedar `indice/` como serviço Node separado (Render, Vercel ou outro): build `npm ci && npm run build`, start `npm start`.
   Dados: rodar o workflow "Índice: atualizar dados", revisar e fazer merge do PR (`indice/data/`).
2. Cloudflare: rota/Worker que encaminha `filtraai.com/indice*` para o serviço, **sem remover o prefixo** (o app usa basePath `/indice`).
3. Só depois de `https://filtraai.com/indice/sitemap-index.xml` responder 200:
   - em `frontend/src/app/robots.ts` trocar `sitemap` por `[base/sitemap.xml, base/indice/sitemap-index.xml]` e ajustar `frontend/scripts/validate-seo.mjs`;
   - enviar o sitemap no Google Search Console e no Bing.
4. Acompanhar no Search Console: páginas "Rastreada, não indexada" indicam conteúdo considerado raso; subir `minimoParaIndexar` se necessário.
