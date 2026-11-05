# Google Analytics 4 — Filtra.AI (filtraai.com)

Documento operacional da instrumentação. Código-fonte:

| Arquivo | Papel |
|---|---|
| `frontend/src/app/lib/analyticsPolicy.ts` | Política pura: allowlist de rotas, catálogo de eventos, filtro de dados pessoais. Testado por `scripts/test-analytics.mjs`. |
| `frontend/src/app/lib/analytics.ts` | Runtime: consentimento, carregamento idempotente do `gtag.js`, dedupe de `page_view`/eventos. |
| `frontend/src/app/components/GoogleAnalytics.tsx` | Montagem no layout raiz, `page_view` em mudança de rota (SPA) e delegação de `contact`/`cta_click`. |
| `frontend/src/app/components/CookieConsent.tsx` | Banner de consentimento (aceitar/recusar). |
| `frontend/src/app/components/CookiePreferencesButton.tsx` | Reabertura do banner na Política de Privacidade. |

## 1. Propriedade GA4

| Campo | Valor |
|---|---|
| Conta | `414880880` (`FiltraAI`) |
| Propriedade | `562518631` (`filtra.ai`) |
| Stream web | `properties/562518631/dataStreams/16279145684` (`Filtra.AI`, criado 2026-11-05) |
| URI padrão | `https://filtraai.com` |
| **Measurement ID** | **`G-DCY9RH8NPJ`** |
| Eventos-chave já existentes | `purchase`, `qualify_lead`, `close_convert_lead` |

O ID foi lido na Admin API do GA4 (não foi inventado) e está fixado como padrão
em `frontend/src/app/lib/analyticsPolicy.ts` → `DEFAULT_MEASUREMENT_ID`, então a
tag funciona em produção **sem** depender de variável de ambiente no Cloudflare
Pages/Render/Vercel. `NEXT_PUBLIC_GA_MEASUREMENT_ID` continua aceito como
override (útil para staging) e tem precedência quando é válido.

> Measurement ID não é segredo: é o mesmo valor que o snippet oficial do GA4
> publica no HTML de qualquer site que o utilize.

### Como ativar (já feito no código)

1. ~~Copiar o Measurement ID~~ → `G-DCY9RH8NPJ` (fixo no código).
2. ~~Definir variável de build~~ → só é necessária para trocar de propriedade.
3. Rebuild/redeploy do frontend publica a tag.
4. Validar conforme a seção 7.

## 2. Consentimento e privacidade

- A tag **não** é carregada antes de consentimento explícito. Não há `gtag.js`
  no HTML inicial: ele é injetado por `loadAnalytics()` somente após o aceite.
## 3. Eventos instrumentados

| Evento | Conversão? | Disparado em | Parâmetros |
|---|---|---|---|
| `page_view` | não | Toda rota pública, uma vez por rota (manual, `send_page_view: false`) | `page_location`, `page_path` |
| `sign_up` | **sim** | `/teste` e `/preview/teste`: resposta OK de `POST /api/lead` | `method`, `plan` |
| `login` | não | `/login`: login aceito pelo backend | `method` |
| `generate_lead` | **sim** | `/auditoria-gratuita`: `lead_id` retornado por `/api/public/acquisition/consent` | `form`, `locale` |
| `form_submit` | não | `/auditoria-gratuita`: diagnóstico concluído com OK do backend | `form`, `locale` |
| `report_generated` | **sim** | Diagnóstico gratuito concluído (`tool=free_audit`) | `tool`, `plan` |
| `purchase` | **sim** | `MpTransparentCheckout` / `PixCheckoutModal`: status `approved` do Mercado Pago | `plan`, `value`, `currency`, `method` |
| `contact` | **sim** | Clique em `mailto:`, `tel:`, `wa.me`, `t.me` (delegação global) | `channel` |
| `cta_click` | não | Clique em `[data-ga-cta]` (header, hero, footer, seção Dot) | `cta`, `placement` |

**Eventos-chave a marcar no GA4** (Administrador › Eventos › Eventos-chave
ou "Marcar como conversão"): `sign_up`, `generate_lead`, `purchase`,
`report_generated`, `contact`.

`purchase` **não** é disparado em `/pagamento-ok`: aquela rota apenas recebe o
redirecionamento do Stripe e não confirma a cobrança no backend. Só contamos
compra onde existe status aprovado do provedor (Mercado Pago, cartão ou Pix).

### Regras aplicadas

1. Conversão só depois da confirmação do backend/provedor — nunca no clique.
2. `cta_click` e `form_submit` não são conversões.
3. Dedupe de 1,5 s por `evento + parâmetros + rota` (protege contra duplo
   render, StrictMode e botão clicado duas vezes).

## 4. Páginas medidas x páginas privadas

`page_view` é bloqueado em: `/admin`, `/painel`, `/dot`, `/login`,
`/recuperar-senha`, `/pagamento-ok`, `/avaliacao`, `/widget`, `/api`, `/preview`.

Em caminhos privados, apenas `login`, `sign_up`, `purchase`, `report_generated`
e `cta_click` podem sair — sempre sem identificadores.

## 5. Tráfego humano x automatizado

GA4 é uma fonte de mensuração comportamental, **não** um detector de bots. A
estratégia é medir e segmentar, não "limpar" números:

- **Métricas de engajamento**: Usuários ativos, Sessões, Sessões engajadas e
  Engajamento médio (o GA4 já não conta sessões sem interação como engajadas;
  `bounce` não existe mais).
- **Aquisição**: Origem/mídia da sessão separa `organic` (Search Console via
  Windsor.ai), `direct`, `referral` e `social`. Usar *Explorar › Aquisição*.
- **Crawlers conhecidos**: não executam JavaScript na maioria dos casos
  (Bingbot, GPTBot, CCBot); Googlebot/Applebot executam. Um hit de crawler que
  executa JS aparece como sessão com 0 s de engajamento e origem `direct`.
- **Requisições automatizadas**: segmento operacional "provável bot" =
  `Sessões engajadas = 0` **e** `Duração do engajamento < 3 s`. Tratar como
  sinal de qualidade, não como verdade absoluta.
- **Não enviamos tráfego artificial** ao GA4 (nenhum uso de Measurement
  Protocol com dados sintéticos) — métricas não são infladas por construção.
- **Validação cruzada**: `sessions` do GA4 x cliques do Search Console
  (Windsor.ai) x hits de borda no Cloudflare. Divergência é esperada
  (consentimento recusado, adblock, ITP, cache).

- Decisão persistida em `localStorage.filtra_consent_v1` (`granted`/`denied`).
- Consent Mode v2 é declarado com `ad_storage`, `ad_user_data` e
  `ad_personalization` sempre `denied` (não fazemos publicidade) e
## 6. SEO — estado auditado (05/11/2026, neste HEAD)

- `next build` (export estático) + `seo:audit`: canônicas self-referencing,
  `robots.txt` liberando `/` e bloqueando `/api/`, sitemap central em
  `/sitemap-index.xml` cobrindo `/sitemap.xml` + 5 shards do Índice.
- `/`, `/avaliacoes-google`, `/en`, `/indice` continuam indexáveis; `/zh/*` e as
  rotas privadas continuam `noindex`.
- `www.filtraai.com` responde `301 → https://filtraai.com/…` e `http://` →
  `https://` (verificado em produção em 05/11/2026).
- Nenhuma página foi removida nem desindexada nesta entrega.

## 7. Como validar no GA4 (tempo real)

1. Abra `https://filtraai.com/` em janela anônima.
2. O banner "Cookies de medição" aparece → clique em **Aceitar**.
3. DevTools › Network › filtre por `gtag/js`: deve haver **exatamente 1**
   requisição `https://www.googletagmanager.com/gtag/js?id=G-…`.
4. Filtre por `collect`: cada navegação SPA gera **1** requisição com
   `en=page_view` e `dl` no domínio apex, sem query string.
5. GA4 › Relatórios › **Tempo real**: 1 usuário ativo e o `page_view` no caminho
   correto.
6. GA4 › Administrador › **DebugView** (Tag Assistant): confira `page_view` e
   `cta_click`.
7. Conversões: `/auditoria-gratuita` (formulário completo) → `form_submit`,
   `report_generated` e `generate_lead` quando o e-mail/consentimento é
   registrado; `/teste` → `sign_up` após criar a conta.
8. Verificação automatizada local:
   `E2E_GA_ID=G-… npm run build` e `npx playwright test e2e/analytics.spec.ts`.

> Validação técnica (tag carregada, 1 requisição, eventos no `dataLayer`) é
> diferente de validação de produto (dados aparecendo no painel do GA4). A
> segunda depende do Measurement ID configurado no build de produção.

## 8. Testes

```bash
cd frontend
npm run test:analytics   # política pura: rotas, allowlist, PII, dedupe (11 testes)
npm run lint
npm run build            # export estático + guards de SEO/idioma/meta
npx playwright test e2e/analytics.spec.ts   # com E2E_GA_ID e build correspondente
```

`e2e/analytics.spec.ts` (4 testes) cobre: nenhuma requisição ao Google antes do
consentimento, `gtag.js` carregado uma única vez, 1 `page_view` por rota (inclusive
em navegação SPA), `send_page_view: false`, recusa mantendo a medição desligada,
`cta_click`/`contact` com os parâmetros esperados e ausência de e-mail/CPF no
`dataLayer`. O teste faz *stub* de `gtag.js` — nada é enviado ao Google.

> O stub não detecta erro de **formato** do `dataLayer` (foi exatamente o bug que
> a validação no navegador pegou). Essa garantia fica no teste unitário do
> `createGtagShim` (`npm run test:analytics`).

## 9. Pendências e o que depende de acesso externo

| Item | Situação | Dependência |
|---|---|---|
| Measurement ID `G-DCY9RH8NPJ` | **resolvido** | Lido na Admin API; fixado como padrão no código |
| Propriedade recebendo eventos | **validado tecnicamente no navegador** | Hits `g/collect` com `tid=G-DCY9RH8NPJ` foram aceitos pelo Google a partir da build local (com `debug_mode`, fora dos relatórios). Produção só passa a medir depois do redeploy |
| Marcar eventos-chave restantes | **ação manual no painel** | O toolkit conectado só *lista* key events (`GOOGLE_ANALYTICS_CREATE_KEY_EVENT` não existe). Faltam `sign_up`, `generate_lead`, `report_generated`, `contact` (`purchase` já existe) |
| App `/indice` (43.920 URLs) | **fora desta entrega** | É um deploy Next separado (`indice/`); precisa da mesma política de consentimento e de um segundo build |
| PageSpeed/PSI pós-mudança | **não executado** | A API pública do PSI retornou `429 RESOURCE_EXHAUSTED` (quota diária anônima esgotada) e não há deploy de produção autorizado |
| Passo de CI `npm run test:analytics` | **bloqueado** | O token do GitHub App não tem permissão `workflows` para alterar `.github/workflows/ci.yml`; comando já existe e passa localmente |
| Validação Windsor/Supermetrics/Ahrefs | **não executado** | Dependem de contas ativas nessas ferramentas; ausência de acesso não é evidência de ausência de problema |

Impacto de performance esperado: a tag **não** entra no HTML e **não** carrega
antes do consentimento, então LCP/TBT da primeira visita não são afetados. O custo
é o módulo de analytics no bundle do layout (≈4 KB antes de gzip) mais o banner
(só renderiza após hidratação, quando há ID configurado e nenhuma decisão salva).

  `analytics_storage` liberado apenas após o aceite.
- Recusar (ou revogar) remove cookies `_ga*`/`_gid` do domínio.
- Revogação disponível em `/privacidade` → botão "Preferências de cookies".
- `anonymize_ip`, `allow_google_signals: false`, `allow_ad_personalization_signals: false`.
- Sessões de validação local usam `localStorage.filtra_ga_debug = '1'` e mandam
  `debug_mode: true` (ficam fora dos relatórios) e só funcionam fora do domínio
  canônico nesse modo debug.
- Nenhum parâmetro de evento carrega e-mail, telefone, nome, empresa, CPF/CNPJ,
  token, UUID, hash, conteúdo de formulário ou texto de avaliação: a allowlist de
  `analyticsPolicy.ts` descarta valores com esse padrão (ver testes).

### Armadilha do `dataLayer` (importante)

`gtag.js` só processa entradas **array-like** (`arguments`), como no snippet
oficial (`dataLayer.push(arguments)`). Empurrar `Array` puro faz a tag baixar
com HTTP 200, o `dataLayer` encher e **nenhum hit sair** — parece instalado e a
propriedade fica vazia. Isso foi reproduzido e corrigido em 05/11/2026
(variantes com `Array`: 0 hits; com `arguments`: hit enviado). O shim vive em
`createGtagShim()` e tem teste de regressão.

### Duplicação de `page_view` — medido, não presumido

Medido no navegador contra a propriedade real (com `debug_mode`):

| Cenário | Comandos enviados por nós | Hits `page_view` recebidos |
|---|---|---|
| Carga inicial em `/` | 1 | 1 |
| Carga direta em `/planos` | 1 | 1 |
| Carga direta em `/blog` | 1 | 1 |
| Carga direta em `/en` | 1 | 1 |
| Carga direta em `/avaliacoes-google` | 1 | 1 |
| Navegação SPA `/` → `/blog` | 2 (uma por rota) | 2 (uma por rota) |

Ou seja: **1 `page_view` por rota**, sem duplicação, e o `page_change` automático
do enhanced measurement não disparou. Se algum dia o volume de `page_view`
aparecer ~2× as rotas no GA4, desligue em **Administrador › Fluxos de dados ›
Filtra.AI › Medição otimizada › "Alterações de página com base em eventos de
histórico do navegador"** — a coleta manual desta implementação continua correta.

### Recebimento confirmado na propriedade

`GOOGLE_ANALYTICS_RUN_REALTIME_REPORT` em `properties/562518631` (05/11/2026,
~15:30 UTC), depois dos hits enviados pela build local:

| eventName | eventCount |
|---|---|
| `first_visit` | 1 |
| `page_view` | 1 |
| `session_start` | 1 |

O Google aceitou os hits com `tid=G-DCY9RH8NPJ`, então a tag está funcional de
ponta a ponta. Em produção a medição começa quando o redeploy do frontend
publicar esta branch **e** o visitante aceitar o banner.


## 10. Passos manuais que restam no painel do GA4

1. **Marcar 4 eventos-chave** (Administrador › Eventos › "Marcar como evento-chave"):
   `sign_up`, `generate_lead`, `report_generated`, `contact`.
   `purchase` já está marcado. O toolkit conectado não expõe `createKeyEvent`.
2. **Confirmar "Medição otimizada"** do stream `Filtra.AI`: se o volume de
   `page_view` vier ~2× o número de rotas, desligue "Alterações de página com
   base em eventos de histórico do navegador" (ver seção 2).
3. **Google signals / retenção de dados**: decisões do titular da conta; a
   implementação já envia `allow_google_signals: false`.
4. **Vincular Search Console** (Administrador › Links do produto › Search
   Console) para unir consultas orgânicas ao comportamento — não feito aqui.
