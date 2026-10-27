# Publicar em filtraai.com/indice

O site principal é estático (Cloudflare Pages). O Índice é um app Next.js separado, hospedado em servidor Node, com páginas de município/segmento geradas sob demanda e ISR.

## Arquitetura e publicação

1. Hospedar `indice/` como serviço Node separado: build `npm ci && npm run build` e start `npm start`. Usar Node 22, conforme `indice/package.json`.
2. Para atualizar os dados, executar o workflow **Índice: atualizar dados**, revisar os arquivos e resultados gerados e fazer merge do PR em `indice/data/`. Não publicar dados sintéticos.
3. Configurar a rota/Worker Cloudflare `filtraai.com/indice*` para encaminhar ao serviço sem remover o prefixo: o app usa `basePath: '/indice'`.
4. A política de robots do site principal é mantida em `frontend/src/app/robots.ts` e deve declarar os dois sitemaps:
   - `https://filtraai.com/sitemap.xml` — site principal;
   - `https://filtraai.com/indice/sitemap-index.xml` — Índice separado.
   
   Essa declaração já está presente no código e na resposta pública verificada em 26/10/2026. Não substituir por apenas um sitemap nem listar URLs do Índice no sitemap principal.
5. Depois de qualquer deploy, executar os testes locais (`npm test`, `npm run typecheck`, `npm run build` e `npm run test:seo`) e validar a produção conforme a checklist abaixo.

## Checklist de validação em produção

- `/indice/sitemap-index.xml` responde HTTP 200 e XML válido com namespace Sitemap.
- Cada sitemap filho referenciado responde HTTP 200 e contém apenas URLs canônicas `https://filtraai.com/indice...`, sem parâmetros ou fragmentos.
- O sitemap principal `/sitemap.xml` não inclui URLs `/indice`; o sitemap do Índice é declarado separadamente em `/robots.txt`.
- Páginas válidas têm canonical próprio, `index, follow` quando os dados são reais, título/descrição, fonte, competência, data de geração, links internos e JSON-LD coerente.
- Rotas de município/segmento abaixo do mínimo configurado não devem aparecer no sitemap e devem responder 404; não converter automaticamente essas rotas em páginas `noindex`.
- Com `meta.sintetico=true`, as páginas devem permanecer `noindex, nofollow` e o build de produção deve recusar a base.
- Conferir também redirects, canonical após redirect, páginas inexistentes e consistência do número de URLs do sitemap com `todosOsCaminhos()` e com `npm run audit:indexability`.

## Search Console e Bing

Depois de confirmar a resposta pública do sitemap, enviar `https://filtraai.com/indice/sitemap-index.xml` no Google Search Console e no Bing Webmaster Tools. A aceitação do sitemap ou de uma solicitação de indexação não comprova que uma URL foi indexada. Acompanhar os estratos home, metodologia, UF, município e célula e distinguir “Rastreada, não indexada”, “Descoberta, atualmente não indexada”, duplicatas/canonical e erros de rastreamento.

Não reduzir ou aumentar `minimoParaIndexar` apenas para alterar o volume de URLs. Usar `npm run audit:indexability` para avaliar cobertura e células finas e tomar decisões com base nos dados e na qualidade editorial.

## Estado verificado em 26/10/2026

- `https://filtraai.com/indice/sitemap-index.xml` respondeu com um sitemap filho.
- `https://filtraai.com/indice/sitemap/0.xml` declarou 28.607 URLs.
- O sitemap principal respondeu com 103 URLs, sem rotas `/zh` e sem misturar URLs do Índice.
- `/robots.txt` declarou os dois sitemaps.
- Amostras de páginas de estados, municípios, segmentos e metodologia apresentaram canonical próprio e `index, follow`. Três rotas inválidas testadas responderam 404.
- A indexação efetiva no Google ainda precisa ser confirmada no Search Console; não inferir cobertura total a partir do sitemap.
