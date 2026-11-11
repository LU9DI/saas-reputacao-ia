# Auditoria SEO do Índice — DSV4 parte 3 (2026-11-11)

**Escopo:** validação pública do Índice após os PRs #210/#211, auditoria técnica de SEO e cobertura, e correções comprovadas.
**Base:** `main` em `edb0410e94bb6f3289f87ce4e0183000a8b2f34f`.
**Branch desta rodada:** `seo/indice-dsv4-parte3`.
**Produção:** nenhum deploy manual foi executado. As páginas foram validadas diretamente em `https://filtraai.com`.

Este relatório separa **medido**, **observado** e **não medido**. Métricas de indexação, CTR e posição dependem do Search Console e não foram estimadas.

---

## 1. Estado do Git, PRs e deploys

| Verificação | Resultado |
|---|---|
| PR #210 integrado | **SIM** — `a3e17f9b`, "SEO: DSV4 parte 2 — reforçar descoberta do Índice" |
| PR #211 integrado | **SIM** — `edb0410e`, "SEO: conectar páginas de segmento aos rankings de ativos" |
| `origin/main` | `edb0410e94bb6f3289f87ce4e0183000a8b2f34f` |
| Branch de trabalho | `seo/indice-dsv4-parte3`, criada a partir de `edb0410e`, árvore limpa |
| CI da `main` em `edb0410e` | **PASS** — CI, Índice Filtra.AI e Dependency audit concluídos com sucesso em 2026-11-11 |
| `filtra-indice.onrender.com/indice` | **200** (0,46 s) |
| `filtra-indice.onrender.com/indice/sp/sao-paulo/restaurantes` | **200** (0,66 s) |
| `filtra-ai-web-runtime.onrender.com` | **200** (0,46 s) |
| `filtra-ai-frontend.filtra-ai.workers.dev` | **200** (1,56 s) |
| PR desta rodada | **#212 aberto para `main`, sem merge** |

O estado "live" dos serviços foi confirmado por resposta HTTP dos endpoints públicos e das origens; não houve acesso ao painel do Render nem alteração de configuração.

---

## 2. Validação das páginas reais de município × segmento

Páginas verificadas diretamente em produção:

- `https://filtraai.com/indice/sp/sao-paulo/restaurantes`
- `https://filtraai.com/indice/go/goiania/restaurantes`

| Verificação | São Paulo | Goiânia |
|---|---|---|
| HTTP | 200 | 200 |
| Canonical auto-referente | SIM | SIM |
| `meta robots` | `index, follow` | `index, follow` |
| `X-Robots-Tag` | ausente | ausente |
| Título | `Restaurantes e bares em São Paulo (SP): 79.301 ativos` | `Restaurantes e bares em Goiânia (GO): 12.035 ativos` |
| Description | 151 caracteres | 155 caracteres |
| JSON-LD | `Dataset`, `BreadcrumbList`, `FAQPage` | `Dataset`, `BreadcrumbList`, `FAQPage` |
| Erros de JSON-LD | 0 | 0 |
| Palavras no HTML | 1.066 | 1.047 |
| Cache da resposta | `render-cache`, CF `HIT`, age 1.609 s | `render-origin`, CF `DYNAMIC` |
| `X-Indice-Proxy` | `render-cache` | `render-origin` |

Os títulos e descrições correspondem ao conteúdo visível; não há promessa de monitoramento de avaliações do Google. A página de Goiânia ainda não estava no cache de borda no momento da medição, mas respondeu 200 pela origem.

---

## 3. Links nacionais e estaduais do PR #211

Nas duas páginas, a seção **"Compare este segmento nos rankings de ativos"** aparece com dois links visíveis:

| Página | Link nacional | Link estadual |
|---|---|---|
| São Paulo | `/indice/rankings/ativos/restaurantes` → **200**, canonical próprio | `/indice/rankings/ativos/restaurantes/sp` → **200**, canonical próprio |
| Goiânia | `/indice/rankings/ativos/restaurantes` → **200**, canonical próprio | `/indice/rankings/ativos/restaurantes/go` → **200**, canonical próprio |

Casos em que o ranking estadual **não** existe foram testados:

- `/indice/df/brasilia/restaurantes`: apenas o link nacional; nenhum link para `/rankings/ativos/restaurantes/df`.
- `/indice/ac/rio-branco/hoteis`: apenas o link nacional; nenhum link para `/rankings/ativos/hoteis/ac`.

A seleção usa `rankingsAtivosDaUF`, a mesma regra do sitemap e da rota, portanto não há link para rota inexistente.

### 3.1 Cobertura dos 208 rankings de UF em produção

| Verificação | Resultado |
|---|---|
| Rankings de UF publicados | **208** |
| Respondem 200 com canonical self | **208/208** |
| Linkados por hubs de UF | **208/208** |
| Linkados por rankings nacionais | **208/208** |
| Hubs de UF com ao menos um link | 26/27 (DF não tem ranking de UF) |

Também foram amostrados 20 hubs municipais: em todos, todos os segmentos publicados do município estavam linkados.

---

## 4. Sitemap, robots, canonical e indexabilidade

### 4.1 Sitemap

| Artefato | Resultado |
|---|---|
| Índice central | 200, 5 shards |
| Shards | 10.000 + 10.000 + 10.000 + 10.000 + 3.920 |
| URLs | **43.920 únicas**, 0 duplicatas, 0 parâmetros, 0 barras finais |
| Brasil | 28.853 |
| EUA | 15.067 |
| `sitemap/5.xml` | 404, correto |
| Lastmod | presente em 10.000/10.000 do shard 0, datetime W3C válido |

Classificação: 1 home BR, 1 metodologia BR, 2 hubs de rankings, 27 UFs, 5.012 municípios, 23.566 células, 27 rankings de aberturas, 9 rankings nacionais de ativos, 208 rankings de UF; 1 home EUA, 1 metodologia EUA, 50 estados, 2.627 condados e 12.388 células EUA.

### 4.2 Amostra de 122 páginas

| Verificação | Resultado |
|---|---|
| HTTP 200 | **122/122** |
| Canonical auto-referente | 122/122 |
| `index, follow` | 122/122 |
| `X-Robots-Tag` | 0 ocorrências |
| Erros de JSON-LD | 0 |
| Páginas sem `BreadcrumbList` | 0 |
| Páginas sem `Dataset` | 0 após a correção desta PR; antes, home/estado/condado dos EUA não tinham |
| Páginas sem H1 | 0 |
| Palavras | mínimo 253, p10 467, mediana 992 |

### 4.3 Casos que não devem ser indexados

- 10/10 combinações abaixo do mínimo testadas respondem **404**, com `Cache-Control: no-store`, e não estão no sitemap.
- As versões Markdown (`/indice/md/...`) respondem 404 quando não existem e levam `X-Robots-Tag: noindex` quando existem; não entram no sitemap.
- Variantes com query string respondem 200 com **canonical para a URL limpa** e não são linkadas internamente.
- `/indice/` e `/indice/SP` redirecionam 308 para a forma canônica; `/indice/rankings/ativos/nao-existe` responde 404.

### 4.4 Robots

`robots.txt` de produção: `Allow: /`, `Disallow: /api/` apenas; 15 agentes de IA liberados individualmente; sitemaps central, principal e do Índice declarados.

---

## 5. Cobertura e conteúdo

| Indicador | Valor medido |
|---|---:|
| Células BR publicadas | 23.566 |
| Municípios BR com página | 5.012 |
| Combinações BR abaixo do mínimo (não publicadas) | 22.310 |
| Células BR entre 10 e 19 ativos | 7.678 (32,6%) |
| Células EUA publicadas | 12.388 |
| Condados EUA com página | 2.627 |
| Combinações EUA abaixo do mínimo | 7.508 |
| Palavras em condados EUA (amostra) | 253–293 |
| Palavras em células EUA (amostra) | 467–541 |
| Similaridade Jaccard entre células do mesmo segmento (5-gramas) | 0,57–0,70 |

Não há duplicata canônica: cada célula tem URL, canonical e dados próprios. A similaridade alta é estrutural (mesmo template e mesmas perguntas), não uma duplicação de conteúdo idêntico. Não houve remoção nem `noindex` em massa: a auditoria de indexabilidade já concluiu que não há evidência nos dados para desindexar as células no piso do limiar.

Não foi encontrado cluster órfão: todos os rankings de UF têm dois caminhos internos; os 20 municípios amostrados linkam todas as células publicadas; os hubs EUA, estados e condados seguem a hierarquia existente.

---

## 6. Google Search Console

**Acesso nesta sessão: indisponível.** Não há ferramenta GSC/MCP, extensão de marketplace correspondente, credencial OAuth ou arquivo de ambiente com chave do Google. A busca por extensões de Search Console retornou 0 resultados. Nenhum número de indexação, cliques ou posição foi produzido ou estimado.

Os números históricos de 2026-11-03 permanecem apenas como referência: 28.853 URLs reconhecidas no índice de sitemaps, 64 páginas do Índice com impressões entre 2026-07-01 e 2026-11-02, 5/20 inspeções `PASS` e 0 impressões dos EUA. Eles **não** representam o estado atual.

Foi adicionada uma ferramenta para a exportação CSV:

- `frontend/scripts/gsc-export.mjs`, com `npm run seo:gsc:analyze`.
- Lê Páginas ou Consultas com cabeçalhos PT/EN, BOM, CRLF, separadores `,`/`;`/tab e campos entre aspas.
- Separa posições 8–30 com impressões relevantes e posições 1–7 com CTR baixo.
- Agrega impressões por tipo de página do Índice e do site.
- Não calcula score, CTR esperado ou projeção de cliques.

Guia: `docs/GSC_ANALISE_CSV.md`.

---

## 7. Core Web Vitals

**Dados de campo indisponíveis:** a API PageSpeed Insights retornou `429 RESOURCE_EXHAUSTED` (quota diária do projeto sem chave) e não há acesso ao CrUX.

Medição de laboratório (Lighthouse 12.8.2, Chrome headless, host local carregado):

| Página / preset | Performance | FCP | LCP | TBT | CLS | SEO | A11y |
|---|---:|---:|---:|---:|---:|---:|---:|
| São Paulo, desktop | 0,91 | 1,2 s | 1,2 s | 40 ms | 0,095 | 1,00 | — |
| São Paulo, mobile simulado | 0,36 | 3,5 s | 3,6 s | 14.920 ms | 0,187 | 1,00 | 0,97 |
| Metodologia, mobile simulado | 0,17 | 11,5 s | 13,4 s | 3.730 ms | 0,187 | 1,00 | 0,97 |

Os resultados mobile foram obtidos em um host com vários processos concorrentes e throttling simulado; **não são métricas de campo** e não justificam alteração de página. O desktop está saudável. O único achado reproduzível de acessibilidade é contraste de 4,46:1 nos botões `#6366f1` com texto branco (limite 4,5:1), registrado como P3 e não alterado nesta PR para não mexer na identidade visual sem decisão de design.

---

## 8. Problemas por impacto

### P1 — bloqueiam a medição, não a página

1. **Search Console inacessível nesta sessão.** Sem ele não é possível quantificar indexação, CTR, posições 8–30 ou impacto do #211. A exportação CSV é o caminho preparado.

### P2 — melhorias técnicas e monitoramento

2. **Hubs dos EUA sem `Dataset`.** Corrigido nesta PR para home, 50 estados e 2.627 condados.
3. **7.678 células BR (32,6%) entre 10 e 19 ativos** e **condados EUA com 253–293 palavras**. Monitorar por estrato no GSC antes de qualquer decisão de conteúdo ou noindex.
4. **CWV mobile de laboratório ruim** no host local, sem confirmação de campo. Monitorar com CrUX/PSI quando houver cota ou acesso.
5. **`/sitemap.xml` transitório com 97 URLs.** Em uma leitura às 20:41 o Worker devolveu um fallback estático antigo com 97 URLs; às 20:43 voltou a 107, estável nas três leituras seguintes. Causa: fallback do Worker para `/sitemap.xml` quando a origem primária falha. Não houve alteração persistente, mas o caso deve ser monitorado.

### P3 — baixo impacto

6. Descrições acima de 160 caracteres em 2 páginas amostradas (162 e 170) e título de 67 caracteres na metodologia BR.
7. Sem `hreflang` entre `/indice` (pt-BR) e `/indice/us` (en).
8. `Dataset` sem `license` (decisão documentada: não inventar licença).
9. Contraste de 4,46:1 nos botões.

---

## 9. Alterações realizadas

| Arquivo | Mudança |
|---|---|
| `indice/src/lib/seo.tsx` | `datasetDoRecorteUS` com fonte Census, ano, data real e variáveis medidas |
| `indice/src/app/(us)/us/page.tsx` | `Dataset` no hub EUA com totais publicados |
| `indice/src/app/(us)/us/[state]/page.tsx` | `Dataset` no hub estadual com total, condados e categorias |
| `indice/src/app/(us)/us/[state]/[county]/page.tsx` | `Dataset` no hub de condado com total e categorias |
| `indice/scripts/test-seo.mjs` | validação de `Dataset` único, fonte, data, ano, variáveis e cobertura espacial em home/estado/condado |
| `frontend/scripts/gsc-export.mjs` | analisador de exportação CSV do GSC |
| `frontend/scripts/test-gsc-export.mjs` | 6 testes do analisador |
| `frontend/package.json` | `seo:gsc:analyze` e `test:seo:gsc` |
| `docs/GSC_ANALISE_CSV.md` | guia de exportação e análise |

Nenhuma URL foi criada ou removida; sitemap, canonical, robots, CTAs e conteúdo comercial ficaram inalterados.

---

## 10. Testes

| Gate | Resultado |
|---|---|
| `indice: npm run typecheck` | PASS (exit 0) |
| `indice: npm test` | PASS (97/97) |
| `indice: npm run build` | PASS (exit 0) |
| `indice: npm run test:seo` | PASS (88.900 verificações, 0 falhas, exit 0) |
| `indice: npm run sitemaps:static` + `--check` | PASS (43.920 URLs, 5 shards) |
| `frontend: npm run test:seo:p1-links` | PASS (19/19) |
| `frontend: npm run test:seo:gsc` | PASS (6/6) |
| CI do PR #212 | em execução no momento da redação; resultado registrado no PR |

Transparência: o `test:seo` teve uma execução interrompida por `fetch failed` após 57 PASS (falha transitória já registrada) e uma execução com 3 falhas causadas pela seleção de `/us/methodology` como "estado" no próprio teste; o seletor foi corrigido e a suíte completa passou. O ESLint local não rodou porque o `node_modules` do frontend está corrompido (`Cannot find module 'prelude-ls'`); o CI é o gate de lint.

---

## 11. Oportunidades com dados disponíveis

1. Exportar Páginas e Consultas do GSC e rodar `npm run seo:gsc:analyze -- --file ... --period ...`.
2. Priorizar posições 8–30 com impressões e revisar título/descrição apenas onde o CTR estiver abaixo do esperado para a posição.
3. Usar a comparação de dois períodos para medir o efeito do #211 e desta PR; sem isso, não há como atribuir ganho de posição.
4. Se o GSC mostrar páginas descobertas mas não indexadas nos estratos de célula, avaliar conteúdo/linkagem por estrato — não aplicar noindex em massa.
5. Reavaliar CWV mobile com dados de campo (CrUX) antes de qualquer mudança de performance.

---

## 12. Concluído versus não comprovado

**Concluído e validado:**

- Páginas de município/segmento em produção com canonical, metadados, JSON-LD, cache e links corretos.
- 208/208 rankings de UF acessíveis e linkados por dois caminhos.
- 208/208 destinos de ranking sem 404.
- Sitemap válido em 43.920 URLs; nenhuma URL nova.
- 404 e `no-store` para combinações abaixo do mínimo.
- `Dataset` nos hubs dos EUA e testes de integração passando.
- Ferramenta de análise CSV do GSC testada.

**Não comprovado:**

- Ganho de posição, cliques ou CTR atribuível ao #211 ou a esta PR.
- Número atual de URLs indexadas, páginas descobertas/não indexadas e impressões por estrato.
- CWV de campo em mobile.

Esses itens dependem de exportação/medição no Search Console e de dados de campo que não estavam disponíveis nesta sessão.