# Diagnóstico das ~39 mil URLs não indexadas — 2026-11-11

**Repositório:** `LU9DI/saas-reputacao-ia`
**Referência:** `main` em `c4d4e2f9983054466cce71287a62554e8a6d0f11` (merge do PR #212).
**Branch desta rodada:** `seo/diagnostico-39k-nao-indexadas`.
**Natureza:** auditoria técnica com dados públicos e preparação da análise do Search Console. Nenhuma recuperação de indexação foi declarada.

---

## 0. Veredito e limite principal

O ambiente **não tem acesso autenticado ao Google Search Console**. Portanto, não existe, nesta sessão, medição atual de quantas URLs estão indexadas ou não indexadas, nem a distribuição real por motivo de exclusão. A premissa de ~39 mil URLs não indexadas **não foi confirmada nem refutada** aqui.

O que foi comprovado:

- O Índice publica **43.920 URLs** no sitemap e no snapshot, sem duplicatas.
- Uma amostra de **500 URLs** respondeu **500/500 em HTTP 200**, com canonical auto-referente, `index, follow` e sem `X-Robots-Tag`.
- Não há bloqueio técnico generalizado de robots, noindex, canonical, renderização ou 404 nas URLs publicadas.
- Há **11.435 células entre 10 e 19 estabelecimentos** (7.678 BR + 3.757 EUA), **2.627 condados EUA no total (amostra com 253–293 palavras)** e similaridade de template de 0,57–0,70 entre células do mesmo segmento. Isso é sinal de qualidade/escala, não prova de exclusão.
- O fallback estático do `/sitemap.xml` está defasado: 125 URLs brutas, 28 delas `/zh`, resultando em **97 URLs** quando sanitizado; o sitemap primário tem **107**. O evento de 97 URLs observado em 2026-11-11 é explicado por esse fallback.
- O cache de borda do Índice pode servir HTML anterior ao deploy por até 24 h; isso foi observado no hub `/indice/us`.

---

## 1. Acesso ao Google Search Console

| Verificação | Resultado |
|---|---|
| Ferramenta/MCP do Search Console | **0 ferramentas** disponíveis |
| Extensão de Search Console no marketplace | **0 resultados** |
| Credencial OAuth / chave Google em ambiente | **0 variáveis** `GOOGLE*`, `GSC*`, `SEARCH_CONSOLE*` |
| Arquivo `.env` com chave Google | **nenhum** |
| Navegador in-app | abriu `google.com`, mas a página exibiu **"Fazer login"**; não há sessão Google autenticada |
| Acesso à propriedade `filtraai.com` | **BLOCKED** |

Nenhuma tentativa de contornar login, assinatura ou quota foi feita. Também não foram usados dados históricos como se fossem atuais.

### 1.1 Totais reais

| Indicador | Valor | Data | Fonte |
|---|---:|---|---|
| URLs publicadas no Índice | **43.920** | 2026-11-11 | sitemap público + snapshot |
| URLs no snapshot do site principal | **43.920** | 2026-11-11 | `frontend/src/generated/indice-snapshot.json` |
| URLs indexadas pelo Google | **não medido** | — | GSC inacessível |
| URLs não indexadas pelo Google | **não medido** | — | GSC inacessível |
| GSC `submitted` (histórico) | **28.853** | 2026-11-03 | `docs/AUDITORIA_GSC_INDEXACAO_2026-11-03.md` |
| Páginas do Índice com impressão (histórico) | **64** | 2026-07-01..2026-11-02 | mesmo documento |
| Premissa da missão (~39 mil) | **não verificada** | — | briefing |

O número histórico de 28.853 é exatamente o subconjunto Brasil e **não** é uma contagem de indexação. Os 15.067 URLs dos EUA não apareciam nesse retrato.

---

## 2. Distribuição medida por país e tipo de página

Total inventariado no sitemap: **43.920**.

| País / tipo | URLs |
|---|---:|
| Brasil — home | 1 |
| Brasil — metodologia | 1 |
| Brasil — hub de rankings de ativos | 1 |
| Brasil — hub de rankings de aberturas | 1 |
| Brasil — página de UF | 27 |
| Brasil — página de município | 5.012 |
| Brasil — município × segmento | 23.566 |
| Brasil — ranking nacional de ativos | 9 |
| Brasil — ranking de ativos por UF | 208 |
| Brasil — ranking de aberturas por segmento e ano | 27 |
| **Subtotal Brasil** | **28.853** |
| EUA — home | 1 |
| EUA — metodologia | 1 |
| EUA — estado | 50 |
| EUA — condado | 2.627 |
| EUA — condado × segmento | 12.388 |
| **Subtotal EUA** | **15.067** |
| **Total** | **43.920** |

Distribuição de células BR por UF (publicadas): SP 3.501, MG 3.643, PR 1.956, RS 2.054, BA 1.797, SC 1.392, GO 1.137, PE 794, MT 720, PA 673, RJ 642, MA 620, ES 493, PB 482, MS 455, RN 443, PI 399, TO 338, AL 310, RO 258, SE 236, AM 198, AC 83, AP 47, RR 47, DF 9.

Células BR por segmento: restaurantes 4.814, salões 4.320, oficinas 3.961, farmácias 2.672, clínicas 2.525, profissionais de saúde 1.786, supermercados 1.346, academias 1.163, hotéis 979.

Células EUA por segmento: restaurantes 2.611, oficinas 1.905, escritórios médicos 1.739, profissionais de saúde 1.634, hotéis 1.217, salões 1.016, mercados 918, farmácias 733, academias 615.

---

## 3. Distribuição por motivo de exclusão do Google

**Não disponível nesta sessão.** A tabela abaixo é o contrato que o CSV da Indexação → Páginas deve preencher. Nenhum número foi inventado. A prioridade é uma sugestão determinística, não uma medição.

| Motivo | Quantidade | % do não indexado | Exemplos | Prioridade esperada |
|---|---:|---:|---|---|
| Descoberta, atualmente não indexada | — | — | — | P1 para hub/ranking; P2 para célula |
| Rastreada, atualmente não indexada | — | — | — | P1 |
| Duplicada: Google escolheu canonical diferente | — | — | — | P1 |
| Duplicada sem canonical selecionada pelo usuário | — | — | — | P1 |
| Duplicada: URL enviada não selecionada como canonical | — | — | — | P1 |
| Página alternativa com canonical adequada | — | — | — | P2/P3 (pode ser intencional) |
| Soft 404 | — | — | — | P0 se estiver no sitemap |
| Não encontrada (404) | — | — | — | P0 se estiver no sitemap |
| Erro de servidor (5xx) | — | — | — | P0 |
| Erro de redirecionamento | — | — | — | P0 se estiver no sitemap |
| Página com redirecionamento | — | — | — | P3 se intencional; P1 se no sitemap |
| Bloqueada pelo robots.txt | — | — | — | P0 se não intencional |
| Excluída por noindex | — | — | — | P0 se no sitemap; P3 se intencional |
| Indexada, embora bloqueada por robots.txt | — | — | — | P1 |
| Não autorizada (401) | — | — | — | P1 |
| Acesso proibido (403) | — | — | — | P1 |
| Outro erro 4xx | — | — | — | P1 |
| Outro motivo informado pelo Google | — | — | — | P2 |

O analisador `frontend/scripts/gsc-indexing.mjs` preenche essa tabela sem agrupar motivos diferentes; cada texto desconhecido vira `outro:<texto>`.

---

## 4. Status técnico medido

### 4.1 Amostra de 500 URLs do sitemap

Amostragem sistemática sobre os 43.920 `<loc>`:

| Verificação | Resultado |
|---|---|
| HTTP 200 | **500/500** |
| Canonical auto-referente | **500/500** |
| `index, follow` | **500/500** |
| `X-Robots-Tag` | **0** |
| Falhas de conexão | **0** |

### 4.2 Teste com Googlebot

Dez URLs representativas (home, Índice, metodologia, UF, célula, EUA, condado, condado × segmento e blog) foram buscadas com UA de Googlebot e UA comum. Título, canonical, robots e contagem de palavras foram **idênticos** nas duas leituras. Não há cloaking.

### 4.3 404, redirect e soft 404

| Prova | Resultado |
|---|---|
| `/indice/sp/nao-existe` | 404, `no-store` |
| `/indice/us/nao-existe` | 404, `no-store` |
| `/indice/rankings/ativos/restaurantes/nao-existe` | 404, `no-store` |
| `/indice/sp/sao-paulo/restaurantes/` | 308 para a URL sem barra |
| `/indice/SP` | 308 para `/indice/sp` |
| `http://filtraai.com/indice/sp` | 301 para HTTPS |
| 10 combinações abaixo do mínimo | 404, `no-store`, fora do sitemap |

Não foi encontrado soft 404 nas amostras: caminhos inválidos devolvem 404 real.

### 4.4 Robots e noindex

- `robots.txt`: 956 bytes, `Allow: /`, `Disallow: /api/`, 15 agentes de IA nomeados e 3 sitemaps.
- Páginas do Índice: `index, follow`, sem `X-Robots-Tag`.
- Gêmeas Markdown (`/indice/md/...`): 200 com `X-Robots-Tag: noindex, follow`, fora do sitemap. Exclusão intencional.

### 4.5 Sitemap e snapshot

| Artefato | URLs | Situação |
|---|---:|---|
| `/indice/sitemap-index.xml` | 5 shards | 200 |
| Shards 0–4 | 10.000+10.000+10.000+10.000+3.920 | 200 |
| Soma | **43.920** | 0 duplicatas |
| Snapshot do frontend | **43.920** | igual ao sitemap |
| `/sitemap.xml` primário | **107** | 107 não-zh; 0 zh |
| Fallback estático sanitizado | **97** | 125 brutas − 28 zh; 10 URLs a menos que o primário |
| GSC `submitted` (histórico) | **28.853** | 2026-11-03; só Brasil, não é indexação atual |
| `/sitemap/5.xml` | — | 404, correto |

Não foram encontradas URLs indexáveis do Índice fora do sitemap. As exceções são intencionais: gêmeas Markdown (noindex), combinações abaixo do mínimo (404) e variantes com query string (canonical para a URL limpa).

---

## 5. Qualidade e utilidade das páginas

### 5.1 Distribuição por estabelecimentos

| Faixa de ativos | Células BR | Células EUA |
|---|---:|---:|
| 10–19 | **7.678** | **3.757** |
| 20–49 | 7.444 | 3.860 |
| 50–99 | 3.517 | 1.943 |
| 100–499 | 3.723 | 2.200 |
| 500+ | 1.204 | 628 |
| **Total** | **23.566** | **12.388** |

**11.435 células (31,8% das 35.954 células) estão na faixa 10–19**, o piso de publicação. Isso não prova baixa utilidade: cada célula tem contagem própria, posição, participação e perguntas frequentes. Mas é o estrato que mais se parece com páginas programáticas de cauda longa e merece medição por motivo no GSC.

### 5.2 Conteúdo

| Tipo | Palavras (amostra) |
|---|---:|
| Célula BR (São Paulo/restaurantes) | 1.066 |
| Célula BR (Goiânia/restaurantes) | 1.047 |
| Célula BR pequena (Bujari/salões, 10 ativos) | 973 |
| Município BR (Bujari) | 720 |
| UF BR (São Paulo) | 3.432 |
| Home do Índice | 1.602 |
| Metodologia BR | 2.121 |
| Home EUA | 868 |
| Estado EUA (Califórnia) | 973 |
| Condado EUA (Los Angeles) | 301 |
| Condado EUA pequeno (Crenshaw, AL) | **253** |
| Condado × segmento EUA | 467–541 |

A célula BR com apenas 10 estabelecimentos ainda tem ~973 palavras. O problema das células não é falta de texto; é **diferenciação e demanda**. Os condados EUA são o grupo mais próximo de conteúdo insuficiente em extensão, mas têm dados próprios do Census CBP e FAQ.

### 5.3 Similaridade e links internos

- Jaccard de 5-gramas entre células do mesmo segmento: **0,57–0,70**. É template repetido com dados locais, não duplicata idêntica.
- Toda célula publicada tem ao menos o link do hub municipal; os rankings nacionais/estaduais e os hubs de UF acrescentam caminhos. Não foi encontrado cluster órfão.
- Hubs de UF, rankings e municípios foram validados em produção; os 208 rankings de UF têm dois caminhos internos.

### 5.4 Dados e atualização

- Competência BR: **2026-10**, dados gerados em 2026-10-26; a página declara a competência.
- EUA: CBP **2023**, ano de referência do Census.
- Não há evidência de dado vencido além do ciclo mensal esperado.

### 5.5 Demanda de pesquisa

**Não medida.** Sem exportação de Consultas/Páginas do GSC não é possível afirmar que uma URL não tem demanda. Nenhuma página foi removida ou recebeu noindex por suposição de falta de demanda.

---

## 6. Causas comprovadas e hipóteses

### 6.1 Comprovadas

| # | Causa | Evidência | Confiança |
|---|---|---|---|
| C1 | Não há bloqueio técnico generalizado | 500/500 em 200, canonical self, index/follow, 0 X-Robots | Alta |
| C2 | O sitemap publicado tem 43.920 URLs, mas o GSC histórico conhecia 28.853 (só Brasil) | Comparação do sitemap com o documento de 2026-11-03 | Alta para o histórico; atual desconhecido |
| C3 | O fallback estático do `/sitemap.xml` está defasado | estático 125, 28 `/zh`, sanitizado 97; primário 107; 97 observado publicamente às 20:41 e 107 às 20:43 | Alta |
| C4 | O cache de borda pode servir HTML anterior ao deploy por até 24 h | `/indice/us` com `Dataset` ausente e age ~7.210 s enquanto a origem já tinha `Dataset`; `?verify=1` trouxe o HTML novo | Alta |
| C5 | Existe um volume grande de células no piso e condados EUA curtos | 11.435 células 10–19; 2.627 condados EUA no total, com amostra de 253–293 palavras; Jaccard 0,57–0,70 | Alta para os números; causalidade não provada |

### 6.2 Hipóteses abertas

| # | Hipótese | Por que falta evidência | Como testar |
|---|---|---|---|
| H1 | O Google não indexa parte das células por escala/qualidade percebida | Não há GSC por motivo; só o padrão de volume/template | Exportar Indexação → Páginas e cruzar motivo × tipo × faixa de ativos |
| H2 | Parte dos EUA nunca foi descoberta | Histórico `submitted=28.853` (só BR); os shards 3–4 podem nunca ter sido lidos | Verificar `submitted=43920` e inspecionar uma URL de cada shard |
| H3 | Canonical escolhida pelo Google difere da declarada em algum estrato | A inspeção de URL não está acessível | Amostrar URLs com motivo “Duplicada/canonical” e comparar `googleCanonical` |
| H4 | Links internos/crawl budget limitam a descoberta | O #204/#205/#211/#212 melhoraram a linkagem, mas não há dados de rastreamento atuais | Cruzar “Descoberta” × profundidade/tipo no GSC |
| H5 | Falta de demanda nas caudas | Consultas não exportadas | Exportar Consultas e comparar impressões por tipo/faixa |

---

## 7. Problemas, prioridade e plano

### P0 — bloqueiam a recuperação ou indicam erro de sitemap

| Problema | Evidência | URLs afetadas | Causa provável | Correção | Validação |
|---|---|---:|---|---|---|
| Sem medição de indexação | GSC inacessível | 43.920 (universo) | Falta de acesso | Exportar Indexação → Páginas e rodar o analisador | Tabela por motivo preenchida |
| Fallback estático defasado | 125 brutas, 28 zh, 97 sanitizadas vs 107 primárias | 10 URLs ausentes no fallback | Deploy estático do `filtra-ai-frontend` não acompanha a `main` | Atualizar o deploy estático e monitorar a contagem; não servir fallback antigo | Fallback com 107 URLs não-zh e igual ao primário |
| Se o CSV mostrar 5xx/404/noindex em URL do sitemap | Ainda não medido | Desconhecido | A confirmar | Corrigir rota/canonical/robots e cobrir com teste | Motivo zerado no GSC após recrawl |

### P1 — impacto provável na indexação

| Problema | Evidência | URLs afetadas | Confiança | Correção | Validação |
|---|---|---:|---|---|---|
| EUA potencialmente não descobertos | Histórico submitted=28.853 (BR) | até 15.067 | Média-alta | Confirmar releitura do índice central e inspecionar amostras dos shards 3–4 | `submitted=43920`; URLs dos EUA deixam de ser “desconhecidas” |
| “Rastreada, não indexada” | Ainda não medido | Desconhecido | — | Priorizar hubs/rankings e páginas com impressões; enriquecer só com dados reais | Motivo reduz após mudanças e recrawl |
| Cache de borda pós-deploy | `/indice/us` desatualizado por ~2 h | Qualquer página alterada | Alta | Purgar cache no deploy ou reduzir TTL/versionar | HTML público igual à origem após deploy |
| Células 10–19 e condados curtos | 11.435 células; 2.627 condados EUA no total, com amostra de 253–293 palavras | 11.435 + 2.627 | Média (qualidade; causalidade não provada) | Medir no GSC; se “crawled not indexed” com impressões, adicionar dados comparativos úteis, não texto artificial | Motivo e impressões por estrato antes/depois |

### P2 — melhoria e monitoramento

| Problema | Evidência | Correção | Validação |
|---|---|---|---|
| Metadados longos | 2 descrições >160 e 1 título de 67 na amostra | Revisar apenas páginas com CTR baixo no CSV | CTR e posição antes/depois |
| Sem hreflang BR/EUA | Páginas em idiomas distintos sem alternates | Avaliar cluster com conteúdo equivalente | hreflang recíproco e canonical correto |
| CWV mobile de laboratório ruim | Desktop 0,91; mobile simulado 0,36 em host carregado | Obter CrUX/PSI e investigar só com dados de campo | LCP/INP/CLS de campo |

### P3 — baixo impacto

- Contraste 4,46:1 nos botões `#6366f1`.
- `Dataset` sem `license` (decisão documentada).
- Datas `lastmod` não mudam quando só o template muda; não alterar em massa.

---

## 8. Correções realizadas nesta rodada

| Arquivo | Mudança | Teste |
|---|---|---|
| `frontend/scripts/gsc-indexing.mjs` | Analisador da exportação Indexação → Páginas: motivos separados, contagem, %, exemplos, tipo, país, UF/segmento, prioridade e cruzamento com sitemap | `test-gsc-indexing.mjs` (7 testes) |
| `frontend/scripts/test-gsc-indexing.mjs` | Fixtures PT/EN, BOM/CRLF, motivo com vírgula, desconhecidos, prioridades e sitemap | 7/7 |
| `frontend/package.json` | `seo:gsc:indexing` e `test:seo:gsc:indexing` | — |
| `docs/GSC_INDEXACAO_CSV.md` | Instruções exatas de exportação e execução | — |

Não houve:

- noindex em massa;
- remoção em massa de URLs;
- alteração de canonical sem evidência;
- criação de páginas genéricas;
- deploy manual.

As correções anteriores relevantes permanecem: #204 (breadcrumbs), #205 (links para os 208 rankings de UF), #210/#211 (links contextuais), #212 (Dataset nos hubs EUA).

---

## 9. Como completar o diagnóstico quando o CSV existir

    cd frontend
    npm run seo:gsc:indexing -- \
      --file /caminho/indexing.csv \
      --sitemap https://filtraai.com/sitemap-index.xml \
      --period "AAAA-MM-DD..AAAA-MM-DD" \
      --format md --examples 5

O relatório produzirá, a partir do arquivo:

1. total de linhas, indexadas, não indexadas e desconhecidas;
2. cada motivo separado, com contagem, percentual, exemplos e prioridade sugerida;
3. distribuição por país, tipo, UF/estado e segmento;
4. URLs do sitemap ausentes do GSC, não indexadas dentro do sitemap e não indexadas fora dele.

Para cruzar com o snapshot, use o mesmo sitemap central; o script baixa os 5 shards. Se usar um único shard, o cruzamento será parcial.

---

## 10. Critérios de conclusão e dependências externas

**Concluído nesta sessão:**

- Auditoria técnica de 500 URLs (500/500 em 200, canonical self, indexable).
- Verificação de Googlebot, 404, redirects, robots, noindex intencional e soft 404.
- Inventário completo de 43.920 URLs por país e tipo.
- Quantificação de células no piso, condados curtos, similaridade e conteúdo.
- Diagnóstico do fallback de 97 URLs e da defasagem do cache de borda.
- Ferramenta e guia para importar a exportação de indexação.

**Depende de acesso externo:**

- Total real indexado/não indexado e distribuição por motivo (GSC).
- `googleCanonical` vs canonical declarada por URL (Inspeção de URL).
- Consultas/impressões para avaliar demanda e CTR (GSC Performance).
- Releitura do índice central e recrawl (GSC).
- Atualização do deploy estático do `filtra-ai-frontend` (Cloudflare/Render).
- CWV de campo (CrUX/PSI).

**Não é possível afirmar, sem nova coleta no GSC:**

- que as ~39 mil URLs não indexadas foram recuperadas;
- que uma alteração de conteúdo aumentou posição ou CTR;
- que este ou aquele motivo é o dominante na exclusão.

A conclusão correta desta rodada é: **o problema não é um bloqueio técnico generalizado; é uma combinação de escala/qualidade em estratos específicos, possível descoberta incompleta dos EUA e um fallback de sitemap defasado, com a medição real ainda pendente de exportação do GSC.**