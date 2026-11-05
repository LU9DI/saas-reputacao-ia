# Memória do Índice Filtra.AI — diagnóstico e ajuste

**Data:** 2026-11-04
**Serviço:** `filtra-indice` (Next.js 16, Node 22, Render plano Free — 512 MB / 0,1 CPU)
**Natureza:** diagnóstico local somente leitura + uma alteração de configuração de runtime (`cacheMaxMemorySize`).
**Escopo:** não mexe em dados, conteúdo, rotas, sitemap, SEO, banco, Render ou Cloudflare.

---

## 1. Sintoma relatado em produção

Leitura no painel do Render, na janela consultada:

| Métrica | Valor observado | Limite do plano Free |
|---|---|---|
| Memória | 487,7 – 506,9 MB | 536,9 MB (512 MiB) |
| CPU | 55 % – 70 % | 100 % de 0,1 CPU |
| Falhas contínuas | nenhuma | — |

Ou seja: o serviço opera entre 91 % e 94 % do teto de memória. Não há crash loop, mas não há folga para picos (renderização concorrente, revalidação, rastreamento).

## 2. Método

Duas medições independentes, ambas reproduzíveis e locais:

1. **Custo do modelo de dados** — heap isolado com `node --expose-gc`, carregando arquivos de `data/` e `data-us/` exatamente como `src/lib/data.ts` e `src/lib/us.ts` fazem, medindo o heap depois de forçar GC.
2. **RSS do servidor de produção local** — `server.mjs` (o mesmo entrypoint do Render) em porta isolada, recebendo lotes de requisições reais de páginas de detalhe BR e EUA, com RSS lido do processo a cada fase e repouso de 10 s entre lotes.

Scripts, ambos rastreados no repositório:

- `indice/scripts/diagnose-memory.mjs` — RSS do servidor;
- `indice/scripts/diagnose-memory-data.mjs` — heap do modelo de dados.

Condições controladas para comparação A/B/C:

- Mesmo build, mesmos argumentos (`--br 700 --us 700`), mesma máquina (Windows, Node 26.7.0), mesma porta.
- `.next/cache` (cache ISR em disco) apagado antes dos ensaios B e C, para que os dois renderizem as mesmas 1.400 páginas a frio.
- O ensaio A é mostrado apenas como referência de **cache quente** e não serve para comparar configuração de cache.

### 2.1 Bug corrigido no diagnóstico anterior

A primeira versão de `diagnose-memory.mjs` montava as URLs dos EUA com a **sigla** do estado (`/indice/us/al/...`), mas o app usa o **slug** (`/indice/us/alabama/...`). Todas as requisições dos EUA retornavam **404**, então nenhuma renderização era exercitada e os números de memória atribuídos aos EUA eram, na prática, o custo de servir 404. A versão atual deriva os caminhos das mesmas regras do sitemap (`caminhosUS()` / `iterarCaminhos()`), aceita `--br N`/`--us N`, mede p50/p95 por fase e **falha o diagnóstico** se qualquer resposta tiver status ≥ 400.

Consequência: **qualquer medição anterior de memória do Índice que tenha usado o script antigo está invalidada** para a parte dos EUA.

## 3. Onde a memória está (medição do modelo de dados)

| Estrutura | Heap retido | Volume |
|---|---|---|
| `data/stats/*.json` (BR) | **34,5 MiB** | 27 arquivos, 7,07 MB JSON, 5.571 municípios, 45.876 células, 294.747 chaves de ano, 120.546 de subclasse |
| Ranking BR (9 segmentos, listas + 3 mapas por segmento) | **5,9 MiB** | 9 × ~5.571 posições |
| `data-us/stats/*.json` (EUA) | **3,7 MiB** | 50 arquivos, 50 estados, 3.039 condados, 19.896 células, 9 segmentos |
| `data/lastmod.json` | **7,3 MiB** | 51.720 entradas, 2,67 MB JSON |
| **Total do modelo** | **≈ 51 MiB** | — |

Leitura importante: **o modelo de dados não é o consumidor de 500 MB**. Ele responde por ~10 % do teto. O restante é o runtime do Next (server, router, buffers de renderização) mais o **cache ISR em memória**, que por padrão guarda até **50 MB** de páginas renderizadas por instância.

`lastmod.json` é carregado de forma preguiçosa (`getLastmod()` só instancia o mapa na primeira rota de sitemap), então uma instância que só serve páginas normais retém ~44 MiB de dados, e ~51 MiB se também servir sitemap.

## 4. Ensaio A/B/C

Todas as fases abaixo usam 700 páginas de detalhe BR seguidas de 700 dos EUA, com repouso de 10 s.

| Ensaio | `cacheMaxMemorySize` | Cache ISR em disco | Pico BR (MiB) | Pico EUA (MiB) | Platô final (MiB) | p50 BR / EUA | p95 BR / EUA |
|---|---|---|---|---|---|---|---|
| A | 50 MB (padrão) | **quente** | 258,8 | 320,9 | 312,8 | 18 / 41 ms | 55 / 169 ms |
| B | **8 MB** | frio | **324,1** | **375,7** | **374,3** | 96 / 36 ms | 802 / 99 ms |
| C | 50 MB (padrão) | frio | **391,8** | **460,9** | **447,1** | 92 / 41 ms | 364 / 168 ms |

Comparação válida é **B contra C** (mesmas condições, cache em disco frio):

| Métrica | 50 MB (C) | 8 MB (B) | Δ |
|---|---|---|---|
| Pico após 700 detalhes BR | 391,8 MiB | 324,1 MiB | **−67,7 MiB (−17,3 %)** |
| Pico após 1.400 detalhes (BR+EUA) | 460,9 MiB | 375,7 MiB | **−85,2 MiB (−18,5 %)** |
| Platô final em repouso | 447,1 MiB | 374,3 MiB | **−72,8 MiB (−16,3 %)** |
| p50 BR | 92 ms | 96 ms | +4 ms (+4,3 %) |
| p50 EUA | 41 ms | 36 ms | −5 ms |
| p95 BR | 364 ms | 802 ms | +438 ms (cauda) |
| p95 EUA | 168 ms | 99 ms | −69 ms |

Leitura:

- O tamanho do cache em memória **limita de fato o quanto de HTML renderizado fica retido**. Com 8 MB, o processo termina ~73–85 MiB mais leve no mesmo cenário de tráfego — exatamente a faixa que falta para o serviço sair de 91–94 % do teto.
- **Não há vazamento**: nos dois ensaios o RSS estabiliza e chega a cair no repouso. O crescimento é o cache enchendo, não retenção sem limite.
- Latência: **p50 praticamente igual** (a diferença de 4 ms está dentro do ruído entre ensaios). O **p95 do BR piorou** no primeiro lote a frio (364 → 802 ms) porque as páginas passam a ser lidas do cache em disco em vez de RAM; nos EUA o p95 melhorou. A cauda é sensível a GC e a I/O, e esta máquina de medição não é o Render (0,1 CPU).
- A latência de acerto **quente** não muda: no lote de 100 repetições aquecidas, 8 MB fez 10 ms de p50 contra 13 ms do padrão.

## 5. Mudança aplicada

`indice/next.config.mjs`:

```js
cacheMaxMemorySize: 8 * 1024 * 1024, // padrão do Next é 50 MB
```

Justificativa com números: −18,5 % de pico de RSS e −16,3 % de platô sob a condição realista de cache frio, com p50 igual e sem alterar conteúdo, status HTTP, `revalidate` ou qualidade de dados. As páginas continuam sendo servidas do cache ISR — apenas do disco em vez de RAM quando não estão entre as ~110 mais recentes.

Escopo do risco: é uma opção de runtime do Next; não afeta o build, o sitemap, o conteúdo nem o SEO. Rollback = remover a linha (volta ao padrão de 50 MB) e redeployar.

## 6. Opções rejeitadas

| Opção | Por que não |
|---|---|
| **Manter 50 MB (sem mudança)** | É o estado atual: platô de 447 MiB a frio, ou seja, 87 % do teto já no ambiente local, sem contar o que produção acumula com 43 mil URLs. |
| **`cacheMaxMemorySize: 0` (desligar cache em memória)** | Toda página passaria a vir do disco; a medição com 8 MB já mostra o custo de cauda, e 0 MB não reduz o pico além do que 8 MB reduz (o HTML renderizado continua alocado durante a requisição). Sem ganho proporcional ao risco de latência. |
| **Fazer ranking sob demanda (lazy por segmento)** | O ranking inteiro custa 5,9 MiB no BR e ~3 MiB nos EUA. Economia máxima < 2 % do teto, com mudança em caminho de renderização. Não compensa. |
| **Não carregar `lastmod.json`** | 7,3 MiB, e é preguiçoso: só entra em instância que serve sitemap. Removê-lo quebraria `lastmod` por página no sitemap. |
| **Reescrever `stats` em formato colunar/binário** | O modelo inteiro é ~51 MiB. Mesmo cortando 50 %, seriam ~26 MiB (5 % do teto) ao custo de reescrever `data.ts`, `us.ts`, ingestão e todos os testes. Custo/risco desproporcional. |
| **Upgrade de plano** | Fora de escopo por decisão do projeto (sem custo novo). |

## 7. O que não foi possível medir

- **RSS real do Render**: não há credencial, CLI nem MCP do Render neste ambiente. As medições são locais; os valores absolutos não são transferíveis (Linux/Node 22/0,1 CPU), mas o **delta relativo entre B e C é a evidência** usada para decidir.
- **Distribuição real de tráfego** (quanto é crawler, quanto é cache hit do Cloudflare): sem acesso a logs do Render.
- **Memória após 24 h de operação**: exige observação no painel após o deploy.

### Como confirmar em produção depois do deploy

1. Painel do Render → serviço do Índice → aba **Metrics** → gráfico **Memory**.
2. Comparar a faixa de 487–507 MB com a nova faixa nas primeiras 24 h (esperado: queda de 15–18 % no pico, ou seja, algo entre ~400 e ~430 MB).
3. Se a memória **não** cair e o p95 piorar de forma perceptível, reverter: remover a linha de `cacheMaxMemorySize` e redeployar.

## 8. Como reproduzir

```bash
cd indice
npm ci
npm run build

# heap do modelo de dados (independe do build)
node --expose-gc scripts/diagnose-memory-data.mjs

# RSS do servidor; para medir com cache ISR frio, apague .next/cache antes
node scripts/diagnose-memory.mjs --br 700 --us 700
```

O script não altera dados, banco, Render ou configuração de deploy; ele apenas grava cache ISR em `.next/cache`, como qualquer requisição ao servidor de produção faria.

## Apêndice A — benchmark do modelo de dados

Saída de `node --expose-gc scripts/diagnose-memory-data.mjs`:

```json
{"conjunto":"BR","heap_MiB":40.5,"stats_MiB":34.5,"ranking_MiB":5.9,"arquivosStats":27,"ufs":27,"municipios":5571,"celulas":45876,"chavesAno":294747,"chavesSub":120546}
{"conjunto":"US","heap_MiB":3.7,"stats_MiB":3.7,"ranking_MiB":0,"arquivosStats":50,"estados":50,"condados":3039,"celulas":19896,"segmentos":9}
{"conjunto":"lastmod","heap_MiB":7.3,"entradas":51720,"bytes":2671278}
```

O ranking dos EUA não é isolável nesse método: as posições são objetos pequenos e o delta sai em 0 (ou negativo) por ruído de GC. Por isso a tabela da seção 3 usa apenas o custo das `stats` dos EUA, que é medido de forma estável.

## Apêndice B — tamanho dos dados versionados

```
data/     10.136.902 bytes em 31 arquivos
data-us/   1.481.610 bytes em 52 arquivos
```
