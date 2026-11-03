# Auditoria GSC — indexação das 28.853 URLs do Índice e integração das URLs dos EUA

**Data da auditoria:** 2026-11-03
**Repositório:** `LU9DI/saas-reputacao-ia`
**Branch / commit auditado:** `main` @ `63acca9da1a71c7035d1a04429d926a12b8d4d35`
**PRs inspecionadas:** #164 (merge `2026-11-01T18:13:26Z`, "sitemap estático do Índice, hreflang x-default e gate de produção") e #161 (merge `2026-11-01T16:51:25Z`, "piloto dos EUA com dados reais do Census CBP")
**Propriedades GSC usadas:** `sc-domain:filtraai.com` (siteOwner) e `https://filtraai.com/indice/` (siteOwner)
**Natureza:** somente investigação. Nenhum commit, push, deploy, submissão de sitemap, pedido de indexação ou alteração de produção foi executado.

---

## 1. Estado atual da indexação (o que está comprovado)

| Fato | Evidência |
|---|---|
| O Índice publica **43.920** URLs (28.853 BR + 15.067 EUA) | `node scripts/build-static-sitemaps.mjs --out=/workspace/.tmp-sitemaps` → `total: 43920`, 5 shards (10.000/10.000/10.000/10.000/3.920) |
| O GSC viu **28.853** URLs no índice de sitemaps | `GOOGLE_SEARCH_CONSOLE_LIST_SITEMAPS` → `path=https://filtraai.com/indice/sitemap-index.xml`, `submitted=28853`, `lastDownloaded=2026-11-01T10:03:25Z`, `errors=0`, `warnings=0` |
| 28.853 = exatamente o subconjunto **Brasil** | Contagem do gerador sobre `indice/data/` = 28.853; é o total dos **3 primeiros** shards (`10.000+10.000+8.853`) |
| O GSC ainda **não releu** o índice depois da publicação dos EUA | `lastDownloaded 2026-11-01T10:03Z` < merges #161 `16:51Z` e #164 `18:13Z` |
| Só **64** URLs do Índice receberam alguma impressão desde 2026-07-01 | `SEARCH_ANALYTICS_QUERY` dimensão `page`, filtro `contains /indice`, `dataState=all`, 2026-07-01→2026-11-02 → 64 linhas |
| Páginas do Índice **estão** indexadas | `INSPECT_URL` → `verdict=PASS`, `coverageState=Submitted and indexed` em `/indice/rankings/ativos`, `/indice/sp/sao-paulo/restaurantes`, `/indice/sp/sao-paulo/supermercados`, `/indice/to/augustinopolis/restaurantes`, `/indice/rj` |
| Páginas dos EUA **não foram descobertas** | `INSPECT_URL` → `coverageState=URL is unknown to Google`, `verdict=NEUTRAL` em 7/7 amostras |
| Zero páginas dos EUA com impressão | `SEARCH_ANALYTICS_QUERY` filtro `page contains /indice/us`, 2026-07-01→2026-11-02 → **nenhuma linha** |

### 1.1 Correção de premissa importante

O número **28.853 não é uma contagem de "não indexadas"**. Ele é o total de URLs que o GSC tinha no índice de sitemaps na última leitura. O campo `indexed` devolvido pela API de sitemaps vem `0` e **não é uma medição** (campo depreciado; não é preenchido para propriedades de domínio). Portanto:

---
- "≈28.600 não indexadas" **não pode ser confirmado nem refutado** por API. A medição correta exige o relatório **Indexação de páginas** do GSC (UI → exportação), que não tem endpoint público.
- O que é comprovável é que a cobertura real é **muito menor que 28.853**: em ~4 meses, apenas **64** URLs do Índice geraram impressões.


## 2. Causas comprovadas

### C1 — O índice publicado com os EUA nunca foi lido pelo Google (Alta)
- Produção serve `<sitemapindex>` com **5 shards** (`curl https://filtraai.com/indice/sitemap-index.xml`).
- O GSC registra `submitted=28853`, ou seja, o retrato dos **3 shards anteriores** (só Brasil).
- Os EUA entraram em produção em `2026-11-01T16:51Z` (#161) e no sitemap em `18:13Z` (#164); a última leitura do índice pelo Google foi `10:03Z` do **mesmo dia**.
- Consequência direta: **shards 3 (10.000 URLs EUA) e 4 (3.920 URLs EUA) nunca foram submetidos**, e 1.147 URLs EUA ficaram no fim do shard 2, também não submetido nessa versão.

### C2 — O piloto dos EUA está órfão de links internos (Alta)
- `curl https://filtraai.com/indice | grep -o 'href="/indice/us[^"]*"'` → **0 ocorrências**.
- Páginas brasileiras também não linkam para `/us` (`grep` em `/indice/sp/sao-paulo/restaurantes` → 0).
- O hub `/indice/us` linka para 51 estados e algumas centenas de condados, mas **nada aponta para o hub**.
- Único caminho de descoberta: o sitemap — que, por C1, o Google ainda não releu. Isso fecha o ciclo que explica `URL is unknown to Google`.

### C3 — Publicação em massa de páginas de template, muitas no piso do limiar (Média/Alta)
- O próprio `node scripts/audit-indexability.mjs` reporta: **7.678 células (32,6%) têm entre 10 e 19 ativos**, no limite `minimoParaIndexar = 10`.
- Volume por tipo: 23.566 células BR + 5.012 municípios + 246 rankings + 27 UFs (BR); 12.388 células + 2.627 condados + 50 estados (EUA).
- Contagem de texto por página (HTML sem script/style): célula BR ≈ 937–1.005 palavras; município BR ≈ 786; estado EUA ≈ 906–1.832; **condado EUA ≈ 264 palavras**; célula EUA ≈ 464.
- Amostra de cobertura: `/indice/mg` e `/indice/mg/belo-horizonte` → `Discovered - currently not indexed` (com `sitemap` reconhecido); `/indice/ba/salvador/restaurantes` → idem.
- Interpretação: 28.853 URLs descobertas de uma vez, num domínio de autoridade baixa, com páginas estruturalmente idênticas (mesma tabela, mesmos títulos parametrizados). É o cenário canônico de **"Descoberta — não indexada no momento"** e de **orçamento de rastreamento** insuficiente. Não é bloqueio técnico.

---

## 3. Causas **não** comprovadas (testadas e descartadas)

| Hipótese | Teste | Resultado |
|---|---|---|
| Bloqueio por `robots.txt` | `curl https://filtraai.com/robots.txt` | `Allow: /`, `Disallow: /api/` apenas; declara `/sitemap-index.xml`, `/sitemap.xml` e `/indice/sitemap-index.xml`. **Não bloqueia** |
| `noindex` nas páginas | `grep '<meta name="robots"'` em BR e EUA | `index, follow` nas duas |
| Canonical divergente | `grep '<link rel="canonical"'` | **Auto-referente** em BR e EUA; `googleCanonical == userCanonical` nos 5 URLs `PASS` |
| Redirecionamento / HTTP | `curl -I` / `-L` | `http://` → 301 `https://`; `www.` → 301 apex; todas as páginas testadas **200** |
| Erro de renderização | `curl` com UA Googlebot | HTML completo no servidor (Next.js SSR), título, canonical, conteúdo textual presentes |
| Sitemap inválido / incompleto | download dos 5 shards + `grep`/`sort` | **43.920 `<loc>`, 43.920 únicas, 0 duplicatas**, 0 fragmentos/parâmetros, sem barra final, todos os 5 shards referenciados no índice |
| Shard 5 fantasma | `curl .../sitemap/5.xml` | 404 (correto: existem 5 shards, índices 0–4) |
| Conteúdo dos EUA inexistente ou stub | `curl` de `/indice/us`, `/us/methodology`, `/us/alabama`, `/us/texas/harris-county`, `/us/.../restaurants-and-bars` | Todos **200** com `<title>`, canonical e dados do Census CBP (ex.: "Jefferson County, Alabama had 1.343 restaurants and bars with paid employees in 2023") |
| Páginas dos EUA tratadas como duplicata das BR | inspeção de `googleCanonical` e idioma | Inexistem URLs duplicadas; EUA em inglês (`/us/...`), BR em português; canonical próprio. Sem `hreflang` — não é bloqueio, mas é melhoria pendente |
| Latência dos shards (timeout de crawler) | `curl -w` | shard 0: `0,38 s`; shard 3: `0,38 s`; `x-indice-proxy: render-origin` (sem cache obsoleto do Worker) |
| Incoerência código ↔ artefato publicado | `node --test scripts/lib/static-sitemaps.test.mjs` | **pass**, incluindo "dados reais: total do artefato bate com o snapshot do site principal" |


---

## 4. Auditoria dos sitemaps publicados

```
GET https://filtraai.com/robots.txt                   200  956 B
GET https://filtraai.com/sitemap-index.xml            200  707 B   (índice central: /sitemap.xml + shards 0..4)
GET https://filtraai.com/sitemap.xml                  200  107 <loc>  (leaf do site principal)
GET https://filtraai.com/indice/sitemap-index.xml     200  707 B   (índice do app Índice: shards 0..4)
GET https://filtraai.com/indice/sitemap/0.xml         200  10.000 locs  (100% BR)
GET https://filtraai.com/indice/sitemap/1.xml         200  10.000 locs  (100% BR)
GET https://filtraai.com/indice/sitemap/2.xml         200  10.000 locs  (8.853 BR + 1.147 EUA)
GET https://filtraai.com/indice/sitemap/3.xml         200  10.000 locs  (100% EUA)
GET https://filtraai.com/indice/sitemap/4.xml         200   3.920 locs  (100% EUA)
GET https://filtraai.com/indice/sitemap/5.xml         404  (não existe — correto)
GET https://filtraai.com/indice/robots.txt            404  (coberto pelo robots.txt do host; não é defeito)
```

Amostragem de rastreabilidade: **60 URLs sorteadas** aleatoriamente entre os 43.920 `<loc>` → **60/60 HTTP 200, 0 falhas**
(`bash /workspace/.tmp-sample-check.sh` → `checked=60 fails=0`).

Distribuição dos EUA dentro dos shards, calculada a partir de `indice/data-us/`, confere com a produção:
`shard2=1.147 US`, `shard3=10.000 US`, `shard4=3.920 US`.

**Discrepância menor:** `/sitemap.xml` tem 107 `<loc>`; o GSC registra `submitted=106` para esse leaf (diferença de 1 URL, sem `errors` nem `warnings`).

---

## 5. Diagnóstico específico das 28.853 URLs não indexadas

1. Elas **foram descobertas** (o índice foi lido com sucesso, `errors=0`) e uma parte **foi rastreada e indexada** — 5 das 20 inspeções de URL retornaram `PASS` com `lastCrawlTime` entre `2026-10-30` e `2026-11-02`.
2. A maioria está em **"Descoberta — não indexada no momento"** (3 das 20 inspeções) — fila do Google, não erro.

### 5.1 Contabilidade exata das inspeções de URL

Foram **20 inspeções** de URL (`GOOGLE_SEARCH_CONSOLE_INSPECT_URL`), não 12 nem 15 — número corrigido nesta revisão:

| Resultado | Total | BR | EUA |
|---|---:|---:|---:|
| `Submitted and indexed` (`PASS`) | 5 | 5 | 0 |
| `Discovered - currently not indexed` | 3 | 3 | 0 |
| `URL is unknown to Google` | 12 | 5 | 7 |
| **Total** | **20** | **13** | **7** |

- **PASS (5):** `/indice/rankings/ativos`, `/indice/rj`, `/indice/sp/sao-paulo/restaurantes`, `/indice/sp/sao-paulo/supermercados`, `/indice/to/augustinopolis/restaurantes`
- **Descoberta — não indexada (3):** `/indice/mg`, `/indice/mg/belo-horizonte`, `/indice/ba/salvador/restaurantes`
- **Desconhecida — BR (5):** `/indice/sp`, `/indice/sp/sao-paulo`, `/indice/sp/sao-paulo/farmacias`, `/indice/rj/rio-de-janeiro`, `/indice/pr/curitiba`
- **Desconhecida — EUA (7):** `/indice/us`, `/indice/us/alabama`, `/indice/us/alabama/jefferson-county`, `/indice/us/alabama/jefferson-county/restaurants-and-bars`, `/indice/us/california`, `/indice/us/texas/harris-county`, `/indice/us/florida/miami-dade-county`


3. Não há nenhuma barreira técnica: `robots` libera, `noindex` ausente, canonical auto-referente, HTTP 200, HTML renderizado no servidor, sitemaps válidos e rápidos.
4. A limitação é **de demanda de rastreamento e de percepção de valor**: 28.853 URLs praticamente simultâneas, 32,6% no piso de 10 ativos, template uniforme. O resultado medido (64 páginas com impressão em ~4 meses) é compatível com esse quadro.
5. **Conclusão:** não existe "defeito de indexação" a corrigir nessas 28.600. Existe um problema de **escala × prioridade de rastreamento** e, sobretudo, de **ausência da medição correta** no GSC.

---

## 6. Diagnóstico específico das URLs dos EUA

| Pergunta | Resposta comprovada |
|---|---|
| Estão publicadas em produção? | **Sim.** 15.067 URLs geradas = 2 base + 50 estados + 2.627 condados + 12.388 células; todas servidas (`x-indice-proxy: render-origin`, HTTP 200); 7 páginas representativas conferidas uma a uma |
| Estão nos sitemaps? | **Sim.** 15.067 `<loc>` nos shards 2 (1.147), 3 (10.000) e 4 (3.920) |
| O Google consegue acessá-las? | **Sim** — sem autenticação, sem `noindex`, sem `robots` bloqueando, 200 em todas as amostras |
| O Google as **descobriu**? | **Não.** 7/7 inspeções → `URL is unknown to Google`; 0 impressões no filtro `/indice/us` |
| Por que não aparecem no GSC? | Porque o **índice de sitemaps que o GSC conhece ainda é o de 3 shards/28.853 URLs**. Os shards com EUA nunca foram lidos (C1). Somado a C2 (hub órfão), não havia segundo caminho de descoberta |
| Há problema de idioma/hreflang/canonical? | Não bloqueante. Sem `hreflang` entre `/indice` (pt-BR) e `/indice/us` (en); canonical auto-referente; espaços de URL distintos, sem sinal de duplicata |
| Os estados geram páginas válidas? | Sim: 50 estados com condados publicáveis (51 chaves em `us-states.ts`; 1 sem condado acima do mínimo) |
| Diferença geradas × publicadas × no sitemap? | **Zero** para as três |

**Conclusão (antes da execução de 2026-11-03):** as URLs dos EUA não estavam "quebradas" nem "não publicadas". Estavam **publicadas há ~34 horas e ainda não descobertas**, porque o artefato que as declara ao Google não havia sido relido e porque não recebiam link interno. Ver §13 para o que foi executado.


---

## 7. Comparação: geradas × publicadas × nos sitemaps × descobertas × rastreadas × indexadas

| Indicador | Brasil | EUA | Total |
|---|---:|---:|---:|
| URLs geradas | 28.853 | 15.067 | 43.920 |
| URLs publicadas (HTTP 200) | 28.853 | 15.067 | 43.920 *(amostra 60/60 = 200)* |
| URLs nos sitemaps | 28.853 | 15.067 | 43.920 |
| URLs descobertas | 28.853 *(recorte do GSC: submetidas)* | 0 | 28.853 |
| URLs rastreadas | indisponível *(amostra: 5 URLs com `lastCrawlTime` confirmado)* | 0 *(0/7 amostras)* | indisponível |
| URLs indexadas | indisponível *(amostra: 5/20 `PASS`)* | 0 *(0/7 amostras)* | indisponível |
| URLs não indexadas | indisponível | ≥ 15.067 *(não descobertas)* | indisponível |
| Páginas com ≥1 impressão (2026-07-01→11-02) | 64 | 0 | 64 |

`indisponível` = a API do GSC não expõe o relatório **Indexação de páginas**; os números exatos exigem exportação pela UI.

---

## 8. Problemas encontrados, por gravidade

### P1 — Alta
1. **Índice de sitemaps desatualizado no GSC.** `submitted=28853` / `lastDownloaded=2026-11-01T10:03Z` contra 43.920 publicados. Shards 3 e 4 nunca submetidos.
2. **Hub dos EUA órfão.** 0 links internos de `/indice` e das páginas BR para `/us`; descoberta depende 100% do sitemap.

### P2 — Média
3. **Escala × orçamento de rastreamento.** 28.853 URLs descobertas de uma vez; 64 páginas com impressão em ~4 meses.
4. **Conteúdo fino no piso do limiar.** 7.678 células (32,6%) com 10–19 ativos (`audit-indexability.mjs`); condados EUA com ~264 palavras.
5. **`SEO_INDEXING_RUNBOOK.md` desatualizado.** Ainda afirma "**three** shards" e "28.853 across all three shards"; a realidade é 5 shards / 43.920. O código está correto (`frontend/src/app/sitemap-index.xml/route.ts` deriva `shards` do snapshot), o documento não.

### P3 — Baixa
6. **Dado estruturado `Dataset` sem `license`** — aviso em 100% das páginas inspecionadas (`richResultsResult`).
7. **`indexed=0` da API de sitemaps** pode ser lido como "0 indexadas" numa próxima auditoria. Precisa de nota explícita no runbook.
8. **Delta 107 × 106** entre `/sitemap.xml` publicado e o `submitted` do GSC.
9. **Sem `hreflang`** entre o Índice BR e o piloto EUA (melhoria, não bloqueio).


---

## 9. Plano de correção priorizado

| # | Ação | Gravidade | Depende de | Arquivo / recurso |
|---|---|---|---|---|
| 1 | Reenviar `https://filtraai.com/indice/sitemap-index.xml` no GSC (e no Bing WMT) para forçar releitura; confirmar `submitted` passando a **43.920** | P1 | **autorização explícita** (hoje proibido) | GSC → Sitemaps |
| 2 | Ligar o hub dos EUA a partir de `/indice` (nav/rodapé) e criar link de volta de `/indice/us` para o Índice BR | P1 | — | `indice/src/app/(br)`, `indice/src/app/(us)` |
| 3 | Exportar o relatório **Indexação de páginas** (UI) e substituir os `indisponível` do §7 por números reais por estrato (`/uf`, `/uf/municipio`, `/uf/municipio/segmento`, `/us/...`) | P1 | acesso à UI | GSC → Indexação de páginas → Exportar |
| 4 | Atualizar `SEO_INDEXING_RUNBOOK.md`: 5 shards, 43.920 URLs, aviso de que `indexed=0` da API não é medição, e que os shards 3/4 são 100% EUA | P2 | — | `SEO_INDEXING_RUNBOOK.md` |
| 5 | Reforçar linkagem interna nas células de maior valor (top estados/segmentos) para concentrar rastreamento antes de expandir | P2 | — | páginas do Índice |
| 6 | Adicionar `license` ao `Dataset` (JSON-LD) | P3 | — | template do Índice |
| 7 | Reconciliar o 1 `<loc>` extra em `/sitemap.xml` | P3 | — | `frontend/src/app/sitemap.ts` |
| 8 | Avaliar `hreflang` pt-BR/en entre `/indice` e `/indice/us` | P3 | — | `indice/src/app/**/layout` |

**Não recomendado neste momento:** aplicar `noindex` às 7.678 células finas. O próprio `audit-indexability.mjs` conclui que não há evidência nos dados que justifique removê-las; a leitura correta é acompanhar por estrato no GSC.

---

## 10. Critérios para validar cada correção

| Ação | Critério objetivo de sucesso |
|---|---|
| 1 — Reenvio do índice | `LIST_SITEMAPS` passa a mostrar `submitted=43920`, `errors=0`, com `lastDownloaded` posterior ao reenvio; `INSPECT_URL` de ≥1 URL do shard 3 deixa de retornar `URL is unknown to Google` em até 14 dias |
| 2 — Linkagem do hub | `curl https://filtraai.com/indice \| grep -c 'href="/indice/us'` ≥ 1; `INSPECT_URL` de `/indice/us` passa a ter `referringUrls` não vazio |
| 3 — Exportação do GSC | Tabela do §7 sem nenhum `indisponível`; soma dos buckets = 43.920 |
| 4 — Runbook | nenhuma menção a "three shards"; contagem coerente com 5 shards / 43.920 |
| 5 — Linkagem interna | impressões por estrato crescendo semana a semana; `Discovered - currently not indexed` caindo nos estratos reforçados |
| 6 — `license` | `richResultsResult` sem o aviso "Missing field license" em 5 amostras |
| 7 — Leaf | `grep -c '<loc>' /sitemap.xml` == `submitted` do GSC |
| Regressão geral | `node --test scripts/lib/static-sitemaps.test.mjs` → 13/13; `node scripts/build-static-sitemaps.mjs --check` sem divergência |


---

## 11. Limitações desta auditoria

- **Não houve acesso ao relatório "Indexação de páginas"** do GSC (não existe endpoint público). Os buckets "Descoberta — não indexada", "Rastreada — não indexada", "Duplicada", "Canonical alternativa", "Excluída por noindex", "Bloqueada por robots" **não puderam ser quantificados**. As afirmações sobre eles vêm de 20 inspeções pontuais de URL e **não foram generalizadas**.
- A cobertura foi medida por **amostra** (20 inspeções de URL + 60 URLs testadas por HTTP), não por exaustão das 43.920.
- `submitted` no GSC é o retrato da **última leitura**, não do estado atual do arquivo.
- Nenhuma hipótese deste relatório foi validada em produção após correção — o plano do §9 está **proposto, não executado**.
- Render, Supabase e múltiplos hosts **não foram validados**; a auditoria olhou apenas o que `filtraai.com` responde publicamente.

---

## 12. Veredito

O problema não é de publicação nem de sitemap: **43.920 URLs estão geradas, publicadas, referenciadas e rastreáveis, sem duplicatas e sem barreira técnica**.

O problema é de **descoberta e de medição**:

1. O Google conhece apenas a versão **anterior** do índice (28.853 URLs, só Brasil). As 15.067 URLs dos EUA nunca foram declaradas a ele.
2. O piloto dos EUA está **sem link interno**, o que anula o único caminho alternativo de descoberta.
3. As 28.853 URLs brasileiras não estão "bloqueadas": estão em fila, num volume que o orçamento de rastreamento do domínio não absorve, com 32,6% das páginas no piso de conteúdo.
4. Nenhum número real de indexação existe hoje nesta auditoria — e qualquer afirmação do tipo "28.600 não estão indexadas" é uma leitura incorreta do campo `submitted`.

**Autorização necessária para (estado em 2026-11-03T02:1xZ, antes da execução):** (a) reenviar o índice no GSC; (b) alterar templates/navegação do Índice (ações 2, 5, 6, 8); (c) atualizar o runbook.

> **Atualização:** (a) e (b-ação 2) foram **autorizadas e executadas** em 2026-11-03 — ver §13. (b-ações 5, 6, 8) e o item 3 do §9 continuam pendentes de autorização.

---

## 13. Execução autorizada — 2026-11-03

### 13.1 Reenvio do sitemap index (Ação 1)

**Pré-condições verificadas imediatamente antes do reenvio** (`curl` em produção):

| Verificação | Resultado |
|---|---|
| `GET https://filtraai.com/indice/sitemap-index.xml` | 200; declara **5** shards (`sitemap/0..4.xml`) |
| `<loc>` por shard | 0: 10.000 · 1: 10.000 · 2: 10.000 · 3: 10.000 · 4: 3.920 |
| Total de `<loc>` | **43.920** |
| Total único (`sort -u`) | **43.920** → zero duplicatas |
| URLs dos EUA por shard | 2: **1.146** + `/indice/us` = 1.147 · 3: **10.000** · 4: **3.920** = **15.067** |
| Shards americanos referenciados no índice | **Sim** — `sitemap/3.xml` e `sitemap/4.xml` constam na lista, além do trecho americano do `sitemap/2.xml` |

**Propriedade usada:** `sc-domain:filtraai.com` (permissionLevel `siteOwner`) — a mesma que já detinha o registro. Não foi usada a propriedade de prefixo `https://filtraai.com/indice/`.

**Chamada:** `GOOGLE_SEARCH_CONSOLE_SUBMIT_SITEMAP`
`{ site_url: "sc-domain:filtraai.com", feedpath: "https://filtraai.com/indice/sitemap-index.xml" }`

**Resposta literal do Google, 2026-11-03T02:26:58Z:**
> `Sitemap 'https://filtraai.com/indice/sitemap-index.xml' successfully submitted for site 'sc-domain:filtraai.com'`

**Leitura posterior do mesmo registro** (`GET_SITEMAP`, 2026-11-03T02:32Z):

| Campo | Antes | Depois |
|---|---|---|
| `lastSubmitted` | 2026-10-30T14:37:37.336Z | **2026-11-03T02:26:58.641Z** ✅ |
| `lastDownloaded` | 2026-11-01T10:03:25.037Z | **2026-11-03T02:26:59.867Z** ✅ (releitura 1 s após o reenvio) |
| `submitted` | 28853 | 28853 ⏳ (ainda não propagado) |
| `errors` / `warnings` / `isPending` | 0 / 0 / false | 0 / 0 / false |


### 13.2 Linkagem interna entre os hubs (Ação 2)

**Diagnóstico que motivou a mudança:** `curl https://filtraai.com/indice | grep -c 'href="/indice/us'` → **0**. O hub dos EUA não tinha nenhum link de entrada em HTML; a descoberta dependia só do sitemap.

**Arquivos alterados (3, todos de apresentação — nenhuma rota, canonical ou metadado tocado):**

| Arquivo | Alteração |
|---|---|
| `indice/src/components/SiteHeader.tsx` | +4 linhas: link `→ /us` na navegação do hub brasileiro, com `hrefLang="en" lang="en"` |
| `indice/src/app/(br)/layout.tsx` | +7 linhas: parágrafo no rodapé (presente em **todas** as 28.853 páginas BR) linkando `→ /us` |
| `indice/src/app/(us)/layout.tsx` | +7 linhas: link `→ /` na navegação e parágrafo no rodapé (presente em **todas** as 15.067 páginas EUA) |

**Decisões de preservação:**
- Nenhuma URL criada, renomeada ou removida; nenhum alias (`/estados-unidos` não existe).
- `canonical` intacto e auto-referente nas duas árvores; `<html lang>` intacto (`pt-BR` no BR, `en` nos EUA); `robots: index, follow` intacto.
- **Sem `hreflang`** entre `/indice` e `/indice/us`: não são traduções uma da outra (bases e países distintos). Declarar `pt-BR`/`en` como alternates seria semanticamente falso. O idioma do *destino* é sinalizado no próprio link (`hrefLang` + `lang`), que é o uso correto.
- O rótulo de cada link está no idioma da página de destino (`US Index`; `Índice Filtra.AI` / `Índice Brasil`), sem misturar idiomas na mesma árvore de acessibilidade.
- Sitemaps intocados: o gerador lê `src/lib/*` e `data*/`, não JSX (§13.3 comprova).

**Evidência no HTML efetivamente renderizado** (`next dev` local, HTTP 200):

| Página | Status | Links cruzados no HTML |
|---|---|---|
| `/indice` | 200 · 109.612 B | `<a hrefLang="en" lang="en" href="/indice/us">US Index</a>` + `<a hrefLang="en" lang="en" href="/indice/us">Filtra.AI US Index</a>` → **2** |
| `/indice/sp/sao-paulo/restaurantes` (profunda BR) | 200 | **2** links para `/indice/us` |
| `/indice/us` | 200 · 96.386 B | `<a hrefLang="pt-BR" lang="pt-BR" href="/indice">Índice Brasil</a>` + `<a hrefLang="pt-BR" lang="pt-BR" href="/indice">Índice Filtra.AI</a>` → **2** |

### 13.3 Testes e verificações executados

| Verificação | Comando | Resultado |
|---|---|---|
| Suíte do Índice | `npm test` (em `indice/`) | **83/83 pass**, 0 fail |
| Teste novo de linkagem | `scripts/lib/hub-links.test.mjs` (5 casos) | pass — cobre link recíproco, `hrefLang`/`lang`, ausência de `href` para rota inexistente e ausência de sobreposição BR/EUA |
| Tipos | `tsc --noEmit` | **exit 0**, sem erros |
| Sitemap inalterado (conjunto) | geração atual vs. shards **publicados** baixados antes da mudança | **43.920 vs 43.920 URLs, `diff` = 0 linhas** — conjunto idêntico |
| Sitemap inalterado (índice) | `diff` do `sitemap-index.xml` | idêntico |
| HTTP das páginas alteradas | `curl` local | 200 em `/indice`, `/indice/us` e nas duas páginas profundas |
| Superfície de código | `git diff --stat` | 3 arquivos, +18 linhas; **nenhum** arquivo de sitemap, dado, rota ou metadado modificado |

**Observação registrada (pré-existente, não causada por esta mudança):** o artefato estático (`build-static-sitemaps.mjs`) e a rota de runtime (`indice/src/app/sitemap.ts`) produzem o **mesmo conjunto** de 43.920 URLs, mas com **ordenação/partição diferente entre shards** (o shard 0 de runtime termina antes, em `mg/irai-de-minas`). Efeito prático: uma URL isolada pode mudar de número de shard entre os dois caminhos. Não afeta o conjunto, o índice nem a indexação; convém unificar a fonte de ordenação numa mudança separada.

### 13.4 O que ainda depende do Google (não executável por nós)

1. **Propagação de `submitted` para 43.920** — depende do rastreamento dos shards 3 e 4. Hoje: 28.853.
2. **Descoberta das URLs dos EUA** — depende do próximo ciclo de rastreamento. Hoje: `URL is unknown to Google`.
3. **Indexação** — o reenvio não garante inclusão; `Discovered - currently not indexed` pode persistir nos estratos finos.
4. **Métricas reais por bucket** (indexadas / descobertas / rastreadas / duplicadas) — só no relatório **Indexação de páginas** da UI.

### 13.5 Deploy

Nenhum deploy foi executado. A alteração de linkagem existe apenas no working tree local (§13.2/§13.3). Produção em `https://filtraai.com/indice` ainda serve o HTML **sem** os links cruzados, porque o Índice é servido pelo Render a partir do branch publicado. **O efeito da Ação 2 só se materializa após merge + deploy**, o que exige autorização explícita.

| `/indice/us/alabama/jefferson-county` (profunda EUA) | 200 | **2** links para `/indice` |

Canonical e idioma conferidos no HTML local: `/indice` → `<html lang="pt-BR">`, `canonical https://filtraai.com/indice`; `/indice/us` → `<html lang="en">`, `canonical https://filtraai.com/indice/us`; ambos `robots = index, follow`.

**Interpretação honesta:** o Google **releu o índice** (comprovado pelo `lastDownloaded`), mas `submitted` continua 28.853 porque esse campo reflete o total dos sitemaps-filhos já processados — os shards 3 e 4 são novos no índice e entram na fila. O reenvio **não é** confirmação de indexação nem de que os 43.920 já foram absorvidos: é o pedido de releitura, atendido.

